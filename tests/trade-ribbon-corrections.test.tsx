import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PokemonEntry, PlannedEntry, SpecialDataset } from "../src/app-types";
import type { AppController } from "../src/hooks/use-app-controller";
import { applySpecialCatalogCorrections } from "../src/catalog-corrections";
import { buildBoxes } from "../src/catalog-planner";
import { PARTNER_RIBBON, correctTradeAndRibbons, correctLegacyTradePlanIds } from "../src/trade-ribbon-corrections";
import { matchCollectionRecords, parseCollectionCsv } from "../src/import-export";
import { TraitBadges } from "../src/components/specimen-trait-controls";
import { DatabaseChoiceCard } from "../src/components/DatabaseChoiceCard";
import { EntryDetails } from "../src/views/EntryDetails";
import { LANGUAGE_OPTIONS, copy } from "../src/translations";

const raw = (JSON.parse(readFileSync("public/data/special-collections.json", "utf8")) as SpecialDataset).entries;
const corrected = applySpecialCatalogCorrections(raw);
const trades = corrected.filter((entry) => entry.collection === "trades");
const svTrades = trades.filter((entry) => entry.game === "Pokémon Scarlet and Violet");
const cyrano = svTrades.find((entry) => entry.dex === 522 && entry.trainerName === "Cyrano")!;
const events = corrected.filter((entry) => entry.collection === "event-dex");
const yoasobi = events.find((entry) => entry.dex === 923 && entry.trainerId === "231118")!;

test("Let's Go trades support both variants with the correct Alolan artwork and NPC OT", () => {
  const entries = trades.filter((entry) => entry.game?.includes("Let's Go"));
  assert.equal(entries.length, 10);
  for (const entry of entries) {
    assert.equal(entry.shinyEligible, true, entry.id);
    assert.equal(entry.normalEligible, true, entry.id);
    assert.equal(entry.form, "Alolan", entry.id);
    assert.equal(entry.mark, "LGPE", entry.id);
    assert.ok(entry.artId! > 10000, entry.id);
    assert.equal(entry.ownOtNormal, false);
    assert.equal(entry.ownOtShiny, false);
    assert.ok(!entry.partnerRibbon);
  }
});

test("Regina and XD shiny exceptions do not unlock unrelated NPC trades", () => {
  const regina = trades.filter((entry) => entry.trainerName === "Regina");
  const xd = trades.filter((entry) => entry.game === "Pokémon XD: Gale of Darkness");
  assert.equal(regina.length, 10);
  assert.equal(xd.length, 5);
  for (const entry of [...regina, ...xd]) {
    assert.equal(entry.shinyEligible, true, entry.id);
    assert.equal(entry.normalEligible, true);
    assert.equal(entry.ownOtNormal, false);
    assert.equal(entry.ownOtShiny, false);
    assert.ok(!entry.partnerRibbon);
  }
  for (const entry of regina.filter((entry) => [103, 105].includes(entry.dex))) assert.equal(entry.form, "Alolan");
  const baseSwsh = trades.filter((entry) => entry.game === "Pokémon Sword and Shield" && entry.trainerName !== "Regina");
  assert.equal(baseSwsh.length, 11);
  assert.ok(baseSwsh.every((entry) => !entry.shinyEligible));
  const previouslyShiny = raw.filter((entry) => entry.collection === "trades" && entry.shinyEligible);
  assert.equal(previouslyShiny.length, 24);
  assert.ok(previouslyShiny.every((entry) => trades.find((candidate) => candidate.id === entry.id)?.shinyEligible));
  assert.equal(trades.filter((entry) => entry.shinyEligible).length, 50);
});

test("Cyrano is shiny-only; all 30 League Club trades carry Partner Ribbon", () => {
  assert.ok(cyrano);
  assert.equal(cyrano.shinyEligible, true);
  assert.equal(cyrano.normalEligible, false);
  assert.equal(cyrano.trainerId, "390518");
  const league = svTrades.filter((entry) => entry.partnerRibbon);
  assert.equal(league.length, 30);
  for (const entry of league) {
    assert.equal(entry.mark, "SV");
    assert.ok(entry.ribbons?.includes(PARTNER_RIBBON));
    assert.ok(entry.requirements?.ribbons?.includes(PARTNER_RIBBON));
    assert.equal(entry.shinyEligible, entry.id === cyrano.id);
  }
  const base = svTrades.filter((entry) => !entry.partnerRibbon);
  assert.equal(base.length, 3);
  assert.ok(base.every((entry) => !entry.requirements?.ribbons?.includes(PARTNER_RIBBON)));
});

test("Partner Ribbon belongs to exact event distributions, not whole species", () => {
  assert.equal(events.filter((entry) => entry.partnerRibbon).length, 19);
  const hyuma = events.find((entry) => entry.dex === 987 && entry.trainerId === "250621")!;
  const corocoro = events.find((entry) => entry.dex === 987 && entry.trainerId === "5656")!;
  assert.ok(hyuma.requirements?.ribbons?.includes(PARTNER_RIBBON));
  assert.ok(hyuma.ribbons?.includes("Battle Champion Ribbon"));
  assert.ok(!corocoro.partnerRibbon);
  assert.ok(yoasobi);
  assert.ok(!yoasobi.partnerRibbon);
  assert.deepEqual(yoasobi.ribbons, ["Classic Ribbon"]);
  assert.deepEqual(yoasobi.requirements?.ribbons, ["Classic Ribbon"]);
  const mistakenlyTagged = correctTradeAndRibbons({
    ...yoasobi, partnerRibbon: true, ribbons: ["Classic Ribbon", PARTNER_RIBBON],
    requirements: { ribbons: [PARTNER_RIBBON] },
  });
  assert.equal(mistakenlyTagged.partnerRibbon, false);
  assert.deepEqual(mistakenlyTagged.requirements.ribbons, ["Classic Ribbon"]);
});

test("trade/ribbon corrections preserve source inputs and IDs and are idempotent", () => {
  const original = structuredClone(raw);
  const first = applySpecialCatalogCorrections(raw);
  assert.deepEqual(raw, original);
  assert.deepEqual(first.map((entry) => entry.id), raw.map((entry) => entry.id));
  assert.deepEqual(applySpecialCatalogCorrections(first), first);
});

test("legacy Cyrano completion and custom-box IDs migrate to his only legal variant", () => {
  const legacy = `${cyrano.id}:normal`;
  const target = `${cyrano.id}:shiny`;
  const ids = [legacy, target, "SV:blitzle:normal", null, 5];
  assert.deepEqual(correctLegacyTradePlanIds(ids), [target, "SV:blitzle:normal"]);
  assert.equal(ids[0], legacy);
  const imported = matchCollectionRecords(parseCollectionCsv(`planId\n${legacy}\n${target}`), trades, {}, new Set());
  assert.deepEqual(imported.newPlanIds, [target]);
  assert.equal(imported.matchedRows, 2);
  assert.equal(imported.alreadyOwned, 1);
});

test("trade planning offers legal variants and keeps ribbons off generic specimens", () => {
  const plan = (preset: "origin" | "basic") => buildBoxes(
    [], trades, [], ["trades"], { normal: true, shiny: true },
    { own: true, trade: true, event: true, external: true }, false, false,
    "notable", { alternate: true, alcremie: true, minior: true }, false, false, false,
    preset, new Map(), "ENG",
  ).flatMap((box) => box.entries);
  const planned = plan("origin");
  assert.deepEqual(planned.filter((entry) => entry.id === cyrano.id).map((entry) => entry.variant), ["shiny"]);
  assert.ok(planned.find((entry) => entry.id === cyrano.id)?.requirements?.ribbons?.includes(PARTNER_RIBBON));
  assert.ok(planned.filter((entry) => entry.game?.includes("Let's Go")).length === 20);
  const generic = plan("basic").filter((entry) => entry.genericEntry);
  assert.ok(generic.length > 0);
  assert.ok(generic.every((entry) => !entry.partnerRibbon && !entry.ribbons?.length && !entry.requirements?.ribbons?.length));
});

test("Partner Ribbon badge is localized and does not confuse Partner Mark with the ribbon", () => {
  const png = readFileSync("public/assets/partner-ribbon.png");
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  for (const { code } of LANGUAGE_OPTIONS) {
    const t = (key: string) => copy(code, key);
    assert.notEqual(t("partner_ribbon"), "partner_ribbon");
    assert.notEqual(t("shiny_guaranteed"), "shiny_guaranteed");
    if (code !== "ENG") {
      assert.notEqual(t("partner_ribbon"), copy("ENG", "partner_ribbon"));
      assert.notEqual(t("shiny_guaranteed"), copy("ENG", "shiny_guaranteed"));
    }
    const badge = renderToStaticMarkup(createElement(TraitBadges, { requirements: cyrano.requirements, t }));
    assert.ok(badge.includes(`alt="${t("partner_ribbon")}"`));
    assert.ok(badge.includes(`title="${t("partner_ribbon")}"`));
    assert.match(badge, /class="trait-icon partner-ribbon-icon"/);
    for (const requirements of [yoasobi.requirements, { ribbons: ["Partner Mark"] }, { encounterMark: "Partner Mark" }]) {
      assert.equal(renderToStaticMarkup(createElement(TraitBadges, { requirements, t })), "");
    }
  }
  const combined = renderToStaticMarkup(createElement(TraitBadges, {
    requirements: { alpha: true, encounterMark: "Mightiest Mark", ribbons: [PARTNER_RIBBON] },
    t: (key) => copy("ENG", key),
  }));
  assert.match(combined, /alpha\.png/);
  assert.match(combined, /mightiest-mark\.png/);
  assert.match(combined, /partner-ribbon\.png/);
});

test("database cards and details show the Partner Ribbon and guaranteed shiny status", () => {
  const entry: PlannedEntry = { ...cyrano, planId: `${cyrano.id}:shiny`, variant: "shiny", ownOt: false, groupKey: "trades", groupLabel: "In-game trades" };
  const t = (key: string) => copy("ENG", key);
  const card = renderToStaticMarkup(createElement(DatabaseChoiceCard, {
    entry, name: "Blitzle", form: null, selected: false, detailsLabel: "Details", t, onToggle() {}, onDetails() {},
  }));
  assert.match(card, /database-choice-artwork[\s\S]*specimen-trait-badges[\s\S]*partner-ribbon-icon/);
  assert.match(card, /database-shiny/);
  const app = {
    detailEntry: { entry }, locatedEntries: [], traitAvailability: new Map(), pokemonNames: {}, language: "ENG", favorites: new Set(), homeChallengesByDex: new Map(),
    t, displayName: () => "Blitzle", displayForm: () => null, displayNote: (value: PokemonEntry) => value.note,
    setDetailEntry() {}, toggleFavorite() {},
  } as unknown as AppController;
  const details = renderToStaticMarkup(createElement(EntryDetails, { app }));
  assert.match(details, /<dd>Always shiny<\/dd>/);
  assert.match(details, /<dd>Partner Ribbon<\/dd>/);
  assert.match(details, /<dd>Cyrano<\/dd>/);
  assert.match(details, /partner-ribbon-icon/);
  const generic = renderToStaticMarkup(createElement(EntryDetails, {
    app: { ...app, detailEntry: { entry: { ...entry, genericEntry: true, requirements: {} } } },
  }));
  assert.doesNotMatch(generic, /Always shiny/);
});
