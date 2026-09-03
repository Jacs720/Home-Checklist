import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DatabaseChoiceCard } from "../src/components/DatabaseChoiceCard";
import { EntryDetails } from "../src/views/EntryDetails";
import type { AppController } from "../src/hooks/use-app-controller";
import { COLLECTIONS, DEFAULT_COLLECTIONS, DEFAULT_MARKS, GROUP_COLORS, MARKS } from "../src/app-config";
import type { Acquisition, Dataset, FormOptions, GenderMode, PlannedEntry, PokemonNames, PokemonEntry, SpecialDataset, Variant } from "../src/app-types";
import { addGoStorableForms, applySpecialCatalogCorrections, createBattleBondGreninja } from "../src/catalog-corrections";
import { applyCatalogCorrections, buildBoxes, isOwnOtShinyLocked, pokemonArtworkUrl } from "../src/catalog-planner";
import { COLLECTION_PRESETS, GAME_PLANS, UNIFIED_COLLECTION_PRESETS, availabilityForEntry, methodKeyForEntry, reasonKeyForEntry, requiresPokemonBank, rankGamePlans, type CollectionPreset, type SpeciesRulesDataset } from "../src/collection-features";
import { buildOwnedProgressCsv, matchCollectionRecords, parseCollectionCsv } from "../src/import-export";
import { buildBoxNavigationHash, buildGlobalNavigationHash, parseSharedNavigationHash } from "../src/navigation-url";
import { buildMightiestRaidEntries, type MightiestRaidsDataset } from "../src/mightiest-raids";
import { buildTitanEntries } from "../src/titan-pokemon";
import { createTauriPlatform } from "../src/platform/tauri";
import { LANGUAGE_OPTIONS, copy, groupName, hasCopy } from "../src/translations";
import { TITAN_COPY } from "../src/titan-translations";
import { packBoxesContinuously } from "../src/box-packing";
import { traitEligible } from "../src/specimen-traits";

test("packs adjacent collection boundaries without changing entry order", () => {
  const entries = [
    ...Array.from({ length: 32 }, (_, index) => ({ id: `a-${index}`, groupKey: "a", groupLabel: "Alpha" })),
    ...Array.from({ length: 31 }, (_, index) => ({ id: `b-${index}`, groupKey: "b", groupLabel: "Beta" })),
  ];
  const boxes = [
    { globalIndex: 0, groupKey: "a", number: 1, label: "Alpha 01", entries: entries.slice(0, 30) },
    { globalIndex: 1, groupKey: "a", number: 2, label: "Alpha 02", entries: entries.slice(30, 32) },
    { globalIndex: 2, groupKey: "b", number: 1, label: "Beta 01", entries: entries.slice(32, 62) },
    { globalIndex: 3, groupKey: "b", number: 2, label: "Beta 02", entries: entries.slice(62) },
  ];

  assert.strictEqual(packBoxesContinuously(boxes, false), boxes);
  const packed = packBoxesContinuously(boxes, true);
  assert.deepEqual(packed.map((box) => box.entries.length), [30, 30, 3]);
  assert.equal(packed[1].label, "Alpha 02 + Beta 01");
  assert.equal(packed[2].label, "Beta 02");
  assert.deepEqual(packed.flatMap((box) => box.entries.map((entry) => entry.id)), entries.map((entry) => entry.id));
});

const readJson = async <T>(path: string) => JSON.parse(await readFile(resolve(path), "utf8")) as T;
const [baseDataset, rawSpecialDataset, names, rulesDataset, mightiestDataset] = await Promise.all([
  readJson<Dataset>("public/data/pokemon-lite.json"),
  readJson<SpecialDataset>("public/data/special-collections.json"),
  readJson<PokemonNames>("public/data/pokemon-names.json"),
  readJson<SpeciesRulesDataset>("public/data/species-rules.json"),
  readJson<MightiestRaidsDataset>("public/data/mightiest-raids.json"),
]);

const catalogEntries = applyCatalogCorrections(baseDataset.entries);
const mightiestEntries = buildMightiestRaidEntries(mightiestDataset, catalogEntries);
const titanEntries = buildTitanEntries(catalogEntries);
const battleBondGreninja = createBattleBondGreninja(catalogEntries);
const correctedRawSpecialEntries = applySpecialCatalogCorrections(rawSpecialDataset.entries);
const specialEntries = [...addGoStorableForms(correctedRawSpecialEntries, catalogEntries), battleBondGreninja, ...mightiestEntries, ...titanEntries];
const importEntries = [...catalogEntries, ...specialEntries];

test("every catalog origin and collection routes Shellos/Gastrodon artwork by sea form", () => {
  const entries = importEntries.filter((entry) => [422, 423].includes(entry.dex) && ["West Sea", "East Sea"].includes(entry.form ?? ""));
  assert.ok(entries.length >= 28);
  for (const entry of entries) {
    for (const variant of ["normal", "shiny"] as const) {
      const planned: PlannedEntry = { ...entry, planId: `${entry.id}:${variant}`, variant, ownOt: true, groupKey: "test", groupLabel: "Test" };
      const side = entry.form === "East Sea" ? "east" : "west";
      assert.ok(pokemonArtworkUrl(planned)?.endsWith(`assets/pokemon/${variant}/0${entry.dex}-${side}.webp`), entry.id);
      assert.equal(planned.planId, `${entry.id}:${variant}`);
    }
  }
});
const speciesRules = new Map(rulesDataset.species.map((rule) => [rule.dex, rule]));
const allAcquisitions: Record<Acquisition, boolean> = { own: true, trade: true, event: true, external: true };
const ownAcquisition: Record<Acquisition, boolean> = { own: true, trade: false, event: false, external: false };
const allForms: FormOptions = { alternate: true, alcremie: true, minior: true };
const noForms: FormOptions = { alternate: false, alcremie: false, minior: false };

type ProfileOptions = {
  preset: CollectionPreset;
  marks?: string[];
  collections?: string[];
  variants?: Record<Variant, boolean>;
  acquisitions?: Record<Acquisition, boolean>;
  includeNonShinySpecials?: boolean;
  includeEventMythicals?: boolean;
  gender?: GenderMode;
  forms?: FormOptions;
  normalLivingDex?: boolean;
  originMarkDex?: boolean;
  originIndependentDex?: boolean;
};

function buildProfile(options: ProfileOptions) {
  return buildBoxes(
    catalogEntries,
    specialEntries,
    options.marks ?? DEFAULT_MARKS,
    options.collections ?? [],
    options.variants ?? { normal: true, shiny: false },
    options.acquisitions ?? ownAcquisition,
    options.includeNonShinySpecials ?? false,
    options.includeEventMythicals ?? false,
    options.gender ?? "notable",
    options.forms ?? noForms,
    options.normalLivingDex ?? false,
    options.originMarkDex ?? false,
    options.originIndependentDex ?? false,
    options.preset,
    speciesRules,
    "ENG",
  );
}

const canonicalProfileOptions = {
  "Living Dex": { preset: "basic", normalLivingDex: true },
  "Final Form Dex": { preset: "final", forms: { ...noForms, alternate: true } },
  "Living Dex + Regional Forms": { preset: "regional", forms: { ...noForms, alternate: true } },
  "Living Form Lite": { preset: "forms_lite", gender: "all", forms: allForms },
  "Living Form Dex": { preset: "forms", gender: "all", forms: allForms },
  "Shiny Living Dex": { preset: "shiny_basic", variants: { normal: false, shiny: true } },
  "Shiny Final Form Dex": { preset: "shiny_final", variants: { normal: false, shiny: true }, forms: { ...noForms, alternate: true } },
  "Shiny Living Dex + Regional Forms": { preset: "shiny_regional", variants: { normal: false, shiny: true }, forms: { ...noForms, alternate: true } },
  "Shiny Living Form Lite": { preset: "shiny_forms_lite", variants: { normal: false, shiny: true }, gender: "all", forms: allForms },
  "Shiny Form Living Dex": { preset: "shiny", variants: { normal: false, shiny: true }, gender: "all", forms: allForms },
  "Origin Mark Dex": { preset: "origin", originMarkDex: true },
  "Event Dex": { preset: "custom", marks: [], collections: ["event-dex"], variants: { normal: true, shiny: true }, acquisitions: allAcquisitions, includeNonShinySpecials: true, gender: "all", forms: allForms },
} satisfies Record<string, ProfileOptions>;

type CanonicalProfile = keyof typeof canonicalProfileOptions;
const canonicalProfiles = Object.fromEntries(Object.entries(canonicalProfileOptions).map(([name, options]) => [name, buildProfile(options)])) as Record<CanonicalProfile, ReturnType<typeof buildProfile>>;

const EXPECTED_PROFILE_COUNTS: Record<keyof typeof canonicalProfiles, number> = {
  "Living Dex": 1025,
  "Final Form Dex": 606,
  "Living Dex + Regional Forms": 1082,
  "Living Form Lite": 1274,
  "Living Form Dex": 1378,
  "Shiny Living Dex": 981,
  "Shiny Final Form Dex": 563,
  "Shiny Living Dex + Regional Forms": 1035,
  "Shiny Living Form Lite": 1220,
  "Shiny Form Living Dex": 1324,
  "Origin Mark Dex": 5044,
  "Event Dex": 1882,
};

function profileEntries(profile: CanonicalProfile) {
  return canonicalProfiles[profile].flatMap((box) => box.entries);
}

test("catalog identities and origin keys are valid", () => {
  const ids = importEntries.map((entry) => entry.id);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicateIds, [], `duplicate raw catalog ids: ${duplicateIds.join(", ")}`);
  const allowedMarks = new Set(MARKS);
  const allowedCollections = new Set([...COLLECTIONS, "events"]);
  for (const entry of importEntries) {
    assert.ok(entry.dex > 0, `${entry.id} has invalid National Dex number ${entry.dex}`);
    if (entry.mark) assert.ok(allowedMarks.has(entry.mark), `${entry.id} has impossible Origin Mark ${entry.mark}`);
    if (entry.collection) assert.ok(allowedCollections.has(entry.collection), `${entry.id} has unknown collection ${entry.collection}`);
  }
  assert.equal(catalogEntries.some((entry) => entry.mark === "GBA" && entry.dex === 983), false, "Kingambit cannot retain a GBA origin");
});

test("Sword and Shield keeps every valid own-OT Alolan shiny except Exeggutor", () => {
  const swshAlolan = catalogEntries.filter((entry) => entry.mark === "SwSh" && entry.form === "Alolan");
  const swshExeggutor = swshAlolan.find((entry) => entry.dex === 103);
  const svAlolan = catalogEntries.filter((entry) => entry.mark === "SV" && entry.form === "Alolan");

  assert.ok(swshAlolan.some((entry) => entry.dex === 52 && entry.ownOtNormal && entry.ownOtShiny));
  assert.ok(swshAlolan.some((entry) => entry.dex === 53 && entry.ownOtNormal && entry.ownOtShiny));
  assert.equal(swshExeggutor?.ownOtNormal, true);
  assert.equal(swshExeggutor?.ownOtShiny, false);
  assert.equal(swshExeggutor?.shinyEligible, false);
  assert.equal(isOwnOtShinyLocked({ mark: "SwSh", dex: 103, form: "Alolan" }), true);
  assert.ok(swshAlolan.filter((entry) => entry.dex !== 103).every((entry) => entry.ownOtNormal && entry.ownOtShiny && entry.shinyEligible));
  assert.ok(svAlolan.length > 0);
  assert.ok(svAlolan.every((entry) => entry.ownOtNormal && entry.ownOtShiny && entry.shinyEligible));
  assert.ok(svAlolan.filter((entry) => entry.dex === 26).every((entry) => entry.availability === "historical"));
  assert.equal(svAlolan.find((entry) => entry.dex === 103)?.availability, "standard");
});

test("Mightiest Mark collection contains only unique eligible raid specimens", () => {
  assert.equal(GROUP_COLORS.mighty, "#9b63d9");
  assert.equal(mightiestDataset.meta.specimenCount, 54);
  assert.equal(mightiestEntries.length, 54);
  assert.equal(new Set(mightiestEntries.map((entry) => `${entry.dex}:${entry.form ?? ""}`)).size, 54);
  assert.ok(mightiestEntries.some((entry) => entry.dex === 157 && entry.form === "Original"));
  assert.ok(mightiestEntries.some((entry) => entry.dex === 157 && entry.form === "Hisuian"));
  assert.ok(mightiestEntries.some((entry) => entry.dex === 1005));
  assert.ok(mightiestEntries.some((entry) => entry.dex === 1006));
  const markedMew = mightiestEntries.find((entry) => entry.dex === 151);
  assert.ok(markedMew);
  assert.equal(markedMew.shinyEligible, true);
  assert.equal(markedMew.ownOtShiny, true);
  assert.equal(markedMew.requirements?.originGame, undefined);
  assert.match(markedMew.sourceUrl ?? "", /event-mightymewtwoshowdown/);
  for (const entry of mightiestEntries) {
    assert.equal(entry.collection, "mighty");
    assert.equal(entry.mark, "SV");
    assert.equal(entry.shinyEligible, entry.dex === 151);
    assert.equal(entry.ownOtNormal, true);
    assert.equal(entry.requirements?.encounterMark, "Mightiest Mark");
  }
});

test("Titan collection contains exactly the six catchable, non-shiny former Titans", () => {
  assert.deepEqual(titanEntries.map((entry) => entry.dex), [950, 962, 968, 978, 984, 990]);
  assert.equal(DEFAULT_COLLECTIONS.includes("titan"), false);
  assert.equal(titanEntries.find((entry) => entry.dex === 978)?.form, "Curly");
  assert.equal(titanEntries.find((entry) => entry.dex === 984)?.requirements?.originGame, "Scarlet");
  assert.equal(titanEntries.find((entry) => entry.dex === 990)?.requirements?.originGame, "Violet");
  for (const entry of titanEntries) {
    assert.equal(entry.collection, "titan");
    assert.equal(entry.mark, "SV");
    assert.equal(entry.requirements?.encounterMark, "Titan Mark");
    assert.equal(entry.shinyEligible, false);
    assert.equal(entry.ownOtShiny, false);
    assert.equal(entry.ownOtNormal, true);
    assert.equal(requiresPokemonBank(entry), false);
    assert.equal(availabilityForEntry(entry), "current");
    assert.equal(methodKeyForEntry(entry), "method_titan");
    assert.equal(reasonKeyForEntry(entry), "why_titan");
    const ordinary = catalogEntries.find((candidate) => candidate.dex === entry.dex && candidate.form === entry.form && candidate.mark === "SV");
    assert.equal(ordinary?.shinyEligible, true, "Titan shiny locks must not affect ordinary specimens");
    assert.equal(ordinary?.requirements?.encounterMark, undefined);
  }
  assert.throws(() => buildTitanEntries([]), /Missing Scarlet\/Violet catalog entry for Titan/);
});

test("Titan filter preserves separate slots and progress alongside the origin-independent Living Dex", () => {
  const options: ProfileOptions = { preset: "custom", marks: [], collections: ["titan"], variants: { normal: true, shiny: true } };
  const titanOnly = buildProfile(options).flatMap((box) => box.entries);
  assert.equal(titanOnly.length, 6);
  assert.ok(titanOnly.every((entry) => entry.variant === "normal" && !entry.genericEntry));
  assert.deepEqual(buildProfile({ ...options, variants: { normal: false, shiny: true } }), []);
  assert.equal(buildProfile({ ...options, variants: { normal: false, shiny: true }, includeNonShinySpecials: true }).flatMap((box) => box.entries).length, 6);
  const combined = buildProfile({ ...options, originIndependentDex: true }).flatMap((box) => box.entries);
  for (const titan of titanOnly) {
    assert.ok(combined.some((entry) => entry.planId === titan.planId));
    assert.ok(combined.some((entry) => entry.dex === titan.dex && entry.genericEntry && !entry.requirements?.encounterMark));
  }
  assert.deepEqual(buildProfile(options).flatMap((box) => box.entries), titanOnly);
  const owned = new Set(titanOnly.map((entry) => entry.planId));
  const csv = buildOwnedProgressCsv(owned, importEntries);
  const records = parseCollectionCsv(csv);
  const restored = matchCollectionRecords(records, importEntries, names, new Set());
  assert.deepEqual(new Set(restored.newPlanIds), owned);
});

test("Titan labels and details are localized in every supported language", () => {
  for (const { code } of LANGUAGE_OPTIONS) {
    for (const key of ["titan_collection", "titan_mark", "method_titan", "why_titan"] as const) {
      assert.ok(TITAN_COPY[code][key]);
      assert.equal(copy(code, key), TITAN_COPY[code][key]);
      if (code !== "ENG") assert.notEqual(copy(code, key), TITAN_COPY.ENG[key]);
    }
    assert.equal(groupName(code, "titan"), TITAN_COPY[code].titan_collection);
  }
});

test("marked specimen details show the encounter badge separately from the Paldea origin", () => {
  for (const source of [titanEntries[0], mightiestEntries[0]]) {
    for (const { code } of LANGUAGE_OPTIONS) {
      const entry: PlannedEntry = { ...source, planId: `${source.id}:normal`, variant: "normal", ownOt: true, groupKey: source.collection!, groupLabel: groupName(code, source.collection!) };
      const app = {
        detailEntry: { entry }, locatedEntries: [], traitAvailability: new Map(), pokemonNames: names, language: code, favorites: new Set(), homeChallengesByDex: new Map(),
        t: (key: string) => copy(code, key), displayName: () => entry.name, displayForm: () => entry.form, displayNote: () => "",
        setDetailEntry() {}, toggleFavorite() {},
      } as unknown as AppController;
      const html = renderToStaticMarkup(createElement(EntryDetails, { app }));
      const label = copy(code, source.collection === "titan" ? "titan_mark" : "mightiest_mark");
      assert.ok(html.includes(`alt="${label}"`));
      assert.ok(html.includes(`<dd>${label}</dd>`));
      assert.ok(html.includes(`<dd>${groupName(code, "SV")}</dd>`));
      assert.match(html, /Paldea_icon_HOME\.png/);
    }
  }
});

test("event source corrections preserve the actual stored forms and origin marks", () => {
  const originalColorMagearna = correctedRawSpecialEntries.filter((entry) => entry.dex === 801 && entry.game === "HOME");
  assert.ok(originalColorMagearna.length > 0);
  assert.ok(originalColorMagearna.every((entry) => entry.form === "Original Color" && entry.artId === 10147 && entry.mark === "SwSh"));

  const shinyGalarianBirds = correctedRawSpecialEntries.filter((entry) => entry.collection === "event-dex" && [144, 145, 146].includes(entry.dex) && entry.shinyEligible && entry.mark === "SwSh");
  assert.equal(shinyGalarianBirds.length, 3);
  assert.deepEqual(shinyGalarianBirds.map((entry) => entry.form), ["Galarian", "Galarian", "Galarian"]);
  assert.deepEqual(shinyGalarianBirds.map((entry) => entry.artId), [10169, 10170, 10171]);

  const shinyZeraora = correctedRawSpecialEntries.filter((entry) => entry.dex === 807 && entry.shinyEligible && entry.game === "HOME");
  assert.ok(shinyZeraora.length > 0);
  assert.ok(shinyZeraora.every((entry) => entry.mark === "SwSh"));

  const eventGimmighoul = correctedRawSpecialEntries.find((entry) => entry.collection === "event-dex" && entry.dex === 999);
  assert.equal(eventGimmighoul?.form, "Chest Form");
});

test("event distributions preserve every source-backed origin mark", () => {
  const events = rawSpecialDataset.entries.filter((entry) => entry.collection === "event-dex");
  const koreanShinyDiancie = events.find((entry) => entry.dex === 719 && entry.trainerName === "올스타" && entry.trainerId === "08136");
  assert.equal(koreanShinyDiancie?.shinyEligible, true);
  assert.equal(koreanShinyDiancie?.mark, "P");

  const orasEvents = events.filter((entry) => /Omega\s*Ruby|Alpha\s*Sapphire/i.test(entry.game ?? ""));
  assert.equal(orasEvents.length, 334);
  assert.ok(orasEvents.every((entry) => entry.mark === "P"));

  const modernGames = /Omega\s*Ruby|Alpha\s*Sapphire|(^|, )(X|Y)($|,)|Sun|Moon|Let's Go|Sword|Shield|Brilliant Diamond|Shining Pearl|Legends:|Scarlet|Violet|HOME|Virtual Console/i;
  assert.ok(events.filter((entry) => modernGames.test(entry.game ?? "")).every((entry) => entry.mark && entry.mark !== "Sin marca"));

  for (const [dex, trainerId] of [[35, "220910"], [440, "211101"]] as const) {
    const marks = events.filter((entry) => entry.dex === dex && entry.trainerId === trainerId).map((entry) => entry.mark);
    assert.ok(marks.includes("SwSh"), `missing Galar event origin for #${dex}`);
    assert.ok(marks.includes("BDSP"), `missing BDSP event origin for #${dex}`);
    assert.ok(marks.includes("LA"), `missing Hisui event origin for #${dex}`);
  }
});

test("event-only shiny distributions augment the matching origin catalogs", () => {
  const eventShinies = buildProfile({
    preset: "custom",
    marks: ["SwSh", "SV"],
    variants: { normal: false, shiny: true },
    acquisitions: allAcquisitions,
    includeEventMythicals: true,
    forms: allForms,
  }).flatMap((box) => box.entries);

  for (const dex of [807, 1001, 1002, 1003, 1004, 1007, 1008]) {
    assert.ok(eventShinies.some((entry) => entry.dex === dex && entry.variant === "shiny"), `missing event-only shiny #${dex}`);
  }
  for (const dex of [144, 145, 146]) {
    assert.ok(eventShinies.some((entry) => entry.dex === dex && entry.form === "Galarian" && entry.variant === "shiny"), `missing shiny Galarian bird #${dex}`);
  }
});

test("Battle Bond Greninja preserves the unique Sun and Moon demo requirements", () => {
  assert.equal(battleBondGreninja.dex, 658);
  assert.equal(battleBondGreninja.collection, "battle-bond");
  assert.equal(battleBondGreninja.mark, "USUM");
  assert.equal(battleBondGreninja.form, null, "Ash-Greninja is a battle transformation, not a separately stored HOME form");
  assert.equal(battleBondGreninja.gender, "male");
  assert.equal(battleBondGreninja.trainerId, "131017");
  assert.equal(battleBondGreninja.requirements?.ability, "Battle Bond");
  assert.deepEqual(battleBondGreninja.requirements?.ribbons, ["Souvenir Ribbon"]);
  assert.equal(battleBondGreninja.shinyEligible, false);
});

test("own-OT shiny locks remain excluded", () => {
  const invalid = catalogEntries.filter((entry) => isOwnOtShinyLocked(entry) && (entry.shinyEligible || entry.ownOtShiny));
  assert.deepEqual(invalid.map((entry) => entry.id), []);
});

test("Arceus Alolan Vulpix and Ninetales remain normal-only and cannot be alpha", () => {
  const planned = buildProfile({
    preset: "custom", marks: ["LA"], variants: { normal: true, shiny: true },
    acquisitions: allAcquisitions, forms: allForms,
  }).flatMap((box) => box.entries);

  for (const dex of [37, 38]) {
    const entry = catalogEntries.find((entry) => entry.mark === "LA" && entry.dex === dex && entry.form === "Alolan");
    assert.ok(entry, `missing Arceus Alolan #${dex}`);
    assert.equal(isOwnOtShinyLocked(entry), true);
    assert.equal(entry.shinyEligible, false);
    assert.equal(entry.ownOtShiny, false);
    assert.equal(entry.normalEligible, true);
    assert.equal(entry.ownOtNormal, true);
    assert.equal(traitEligible(entry, "alpha"), false);
    assert.deepEqual(planned.filter((candidate) => candidate.id === entry.id).map((candidate) => candidate.variant), ["normal"]);
  }
});

test("the Arceus Alolan shiny lock preserves Kantonian forms and other origins", () => {
  const planned = buildProfile({
    preset: "custom", marks: ["LA", "USUM", "LGPE", "SwSh", "SV"],
    variants: { normal: false, shiny: true }, acquisitions: allAcquisitions, forms: allForms,
  }).flatMap((box) => box.entries);

  for (const dex of [37, 38]) {
    assert.equal(planned.some((entry) => entry.mark === "LA" && entry.dex === dex && entry.form === "Alolan"), false);
    const kantonian = catalogEntries.find((entry) => entry.mark === "LA" && entry.dex === dex && entry.form !== "Alolan");
    assert.ok(kantonian);
    assert.equal(isOwnOtShinyLocked(kantonian), false);
    assert.equal(kantonian.shinyEligible, true);
    assert.equal(traitEligible(kantonian, "alpha"), true);
    assert.ok(planned.some((entry) => entry.id === kantonian.id));

    for (const mark of ["USUM", "LGPE", "SwSh", "SV"]) {
      const entry = catalogEntries.find((entry) => entry.mark === mark && entry.dex === dex && entry.form === "Alolan");
      assert.ok(entry, `missing ${mark} Alolan #${dex}`);
      assert.equal(isOwnOtShinyLocked(entry), false);
      assert.equal(entry.shinyEligible, true);
      assert.ok(planned.some((candidate) => candidate.id === entry.id), `${entry.id} lost its shiny variant`);
    }
  }
});

test("canonical profile counts match catalog snapshots", () => {
  const actual = Object.fromEntries(Object.keys(canonicalProfiles).map((profile) => [profile, profileEntries(profile as CanonicalProfile).length]));
  assert.deepEqual(actual, EXPECTED_PROFILE_COUNTS);
});

test("profiles preserve species coverage and the complete post-Gen-5 Form Dex", () => {
  const livingDex = profileEntries("Living Dex");
  const livingFormDex = profileEntries("Living Form Dex");
  assert.deepEqual([...new Set(livingDex.map((entry) => entry.dex))], Array.from({ length: 1025 }, (_, index) => index + 1));
  for (const dex of new Set(livingDex.map((entry) => entry.dex))) assert.ok(livingFormDex.some((entry) => entry.dex === dex), `Living Form Dex lost #${dex}`);
  for (const dex of [650, 722, 810, 906]) assert.ok(livingFormDex.some((entry) => entry.dex === dex), `Living Form Dex lost generation starter #${dex}`);
  assert.ok(livingFormDex.some((entry) => entry.dex === 901 && entry.form === "Bloodmoon"), "Living Form Dex lost Bloodmoon Ursaluna");
});

test("form profiles omit source-only base placeholders and keep real exclusive forms", () => {
  const entries = buildProfile({
    preset: "forms",
    variants: { normal: true, shiny: true },
    acquisitions: allAcquisitions,
    gender: "all",
    forms: allForms,
  }).flatMap((box) => box.entries);

  const formsFor = (dex: number) => entries.filter((entry) => entry.dex === dex).map((entry) => `${entry.variant}:${entry.form ?? "base"}`).sort();
  assert.deepEqual(formsFor(801), ["normal:Basic", "normal:Original Color"]);
  assert.deepEqual(formsFor(854), ["normal:Antique Form", "normal:Phony Form", "shiny:Antique Form", "shiny:Phony Form"]);
  assert.deepEqual(formsFor(999), ["normal:Chest Form", "normal:Roaming Form", "shiny:Chest Form", "shiny:Roaming Form"]);
  assert.deepEqual(formsFor(1012), ["normal:Artisan", "normal:Counterfeit", "shiny:Artisan", "shiny:Counterfeit"]);

  for (const dex of [128, 647, 676, 720, 901]) {
    assert.ok(entries.some((entry) => entry.dex === dex && !entry.form && entry.variant === "normal"), `lost real unnamed base form #${dex}`);
    assert.ok(entries.some((entry) => entry.dex === dex && entry.form), `lost named alternate form #${dex}`);
  }

  const eternalFloette = entries.find((entry) => entry.dex === 670 && entry.form === "Eternal Flower" && entry.variant === "normal");
  const originalColorMagearna = entries.find((entry) => entry.dex === 801 && entry.form === "Original Color" && entry.variant === "normal");
  const normalUnboundHoopa = entries.find((entry) => entry.dex === 720 && entry.form === "Unbound" && entry.variant === "normal");
  assert.match(pokemonArtworkUrl(eternalFloette!) ?? "", /\/normal\/10061\.webp$/);
  assert.match(pokemonArtworkUrl(originalColorMagearna!) ?? "", /\/normal\/10147\.webp$/);
  assert.match(pokemonArtworkUrl(normalUnboundHoopa!) ?? "", /\/normal\/10086\.webp$/);
  assert.match(pokemonArtworkUrl({ ...normalUnboundHoopa!, variant: "shiny" }) ?? "", /\/shiny\/10086\.webp$/);
});

test("all planned entries fit boxes, have unique planIds and deterministic order", () => {
  for (const [profile, boxes] of Object.entries(canonicalProfiles)) {
    const entries = boxes.flatMap((box) => box.entries);
    assert.equal(new Set(entries.map((entry) => entry.planId)).size, entries.length, `${profile} contains duplicate planIds`);
    boxes.forEach((box, index) => {
      assert.equal(box.globalIndex, index, `${profile} has a non-deterministic global box index`);
      assert.ok(box.entries.length <= 30, `${profile} overfilled box ${index + 1}`);
    });
    const rebuilt = buildProfile(canonicalProfileOptions[profile as CanonicalProfile]);
    assert.deepEqual(rebuilt.flatMap((box) => box.entries.map((entry) => entry.planId)), entries.map((entry) => entry.planId), `${profile} order changed between identical builds`);
  }
});

test("export and import preserve owned progress", () => {
  const normalTargets = importEntries.filter((entry) => entry.availability !== "excluded" && entry.normalEligible !== false).slice(0, 4).map((entry) => `${entry.id}:normal`);
  const shinyTargets = importEntries.filter((entry) => entry.availability !== "excluded" && entry.shinyEligible).slice(0, 4).map((entry) => `${entry.id}:shiny`);
  const expected = new Set([...normalTargets, ...shinyTargets]);
  const firstCsv = buildOwnedProgressCsv(expected, importEntries);
  const firstImport = matchCollectionRecords(parseCollectionCsv(firstCsv), importEntries, names, new Set());
  assert.deepEqual(new Set(firstImport.newPlanIds), expected);
  assert.equal(firstImport.unmatched, 0);
  assert.equal(firstImport.ambiguous, 0);

  const secondCsv = buildOwnedProgressCsv(new Set(firstImport.newPlanIds), importEntries);
  const secondImport = matchCollectionRecords(parseCollectionCsv(secondCsv), importEntries, names, new Set());
  assert.deepEqual(new Set(secondImport.newPlanIds), expected);
});

test("custom Living Dex mode removes origin requirements while preserving custom form filters", () => {
  const basic = buildProfile({ preset: "custom", marks: [], originIndependentDex: true });
  const basicEntries = basic.flatMap((box) => box.entries);
  assert.equal(basicEntries.length, 1025);
  assert.ok(basicEntries.every((entry) => entry.genericEntry && !entry.mark && !entry.collection));

  const withForms = buildProfile({ preset: "custom", marks: [], originIndependentDex: true, gender: "all", forms: allForms });
  assert.ok(withForms.flatMap((box) => box.entries).some((entry) => entry.dex === 901 && entry.form === "Bloodmoon"));

  const withSpecialCollection = buildProfile({ preset: "custom", marks: [], collections: ["n"], originIndependentDex: true, acquisitions: allAcquisitions });
  assert.equal(withSpecialCollection[0]?.groupKey, "origin-independent-living-dex");
  assert.ok(withSpecialCollection.some((box) => box.groupKey === "n"), "selected special collections should remain separate");
});

test("profiles without origin requirements are explicitly classified as Living Dex profiles", () => {
  assert.deepEqual([...UNIFIED_COLLECTION_PRESETS], [
    "basic", "shiny_basic", "final", "shiny_final", "regional", "shiny_regional",
    "forms_lite", "shiny_forms_lite", "forms", "shiny", "noah", "original_generation",
  ]);
  for (const preset of ["origin", "completionist", "custom"] as const) assert.equal(UNIFIED_COLLECTION_PRESETS.has(preset), false);
});

test("game recommendations use the planner rules and a stable tie break", () => {
  const entries = profileEntries("Living Dex");
  const ranking = rankGamePlans(entries, () => false, importEntries);
  assert.ok(ranking.length > 0);
  ranking.forEach((game, index) => {
    assert.ok(GAME_PLANS.some((candidate) => candidate.id === game.id));
    if (index > 0) assert.ok(ranking[index - 1].count >= game.count);
  });
  assert.deepEqual(rankGamePlans(entries, () => true, importEntries), []);
});

test("shareable navigation hashes round-trip without progress data", () => {
  const globalHash = buildGlobalNavigationHash({
    query: "Raichu de Alola",
    missingOnly: true,
    homeChallengesOnly: false,
    pokewalkerOnly: true,
    sortMode: "pokedex",
    groupMode: "generation",
  });
  assert.deepEqual(parseSharedNavigationHash(globalHash), {
    kind: "global",
    query: "Raichu de Alola",
    missingOnly: true,
    homeChallengesOnly: false,
    pokewalkerOnly: true,
    sortMode: "pokedex",
    groupMode: "generation",
  });
  assert.equal(buildBoxNavigationHash(86, 13), "#box=87&slot=14");
  assert.deepEqual(parseSharedNavigationHash("#box=87&slot=14"), { kind: "box", boxIndex: 86, slotIndex: 13 });
  assert.equal(parseSharedNavigationHash("#ocr=transfer-payload"), null);
  assert.equal(globalHash.includes("owned"), false);
});

test("search and social metadata consistently reference the collection box preview", async () => {
  const html = await readFile(resolve("index.html"), "utf8");
  const previewUrl = "https://jacs720.github.io/Home-Checklist/assets/home-checklist-social-preview.png";

  assert.match(html, /name="robots" content="index, follow, max-image-preview:large"/);
  assert.match(html, /rel="icon"[^>]+home-checklist-social-preview\.png/);
  assert.match(html, /rel="image_src"[^>]+home-checklist-social-preview\.png/);
  assert.doesNotMatch(html, /strange-ball\.png/);

  const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(structuredData, "structured search metadata is missing");
  const schema = JSON.parse(structuredData);
  assert.equal(schema.image, previewUrl);
  assert.equal(schema.screenshot, previewUrl);
});

test("Vite configuration does not require undeclared Node globals in deployment", async () => {
  const config = await readFile(resolve("vite.config.ts"), "utf8");
  assert.doesNotMatch(config, /\bprocess\./);
  assert.match(config, /loadEnv\(mode,\s*["']\.["'],\s*["']["']\)/);
});

test("mobile releases preserve both HOME grids as six columns by five rows", async () => {
  const css = await readFile(resolve("src/styles/mobile.css"), "utf8");
  assert.match(css, /\.page-grid\s*\{[^}]*grid-template-columns:\s*repeat\(6,/s);
  assert.match(css, /\.box-grid\s*\{[^}]*grid-template-columns:\s*repeat\(6,/s);
  assert.match(css, /\.pokemon-slot small,[^}]*display:\s*none/s);
  assert.match(css, /\.slot-tooltip\s*\{\s*display:\s*none\s*!important;/s);
});

test("the Tauri adapter keeps native storage and exports outside shared UI code", async () => {
  const values = new Map<string, string>();
  const exports: string[] = [];
  const platform = createTauriPlatform("android", {
    storage: {
      async get(key) { return values.get(key) ?? null; },
      async set(key, value) { values.set(key, value); },
    },
    async saveText(filename) { exports.push(filename); },
  });

  await platform.storage.set("progress", "saved");
  await platform.files.saveText("backup.json", "{}", "application/json");
  assert.equal(platform.target, "android");
  assert.equal(await platform.storage.get("progress"), "saved");
  assert.deepEqual(exports, ["backup.json"]);
});

test("custom box cards separate artwork, marks and independent information buttons", async () => {
  const source = specialEntries.find((entry) => entry.dex === 493 && entry.collection === "event-dex" && entry.mark === "P");
  assert.ok(source);
  const entry: PlannedEntry = { ...source, planId: `${source.id}:normal`, variant: "normal", ownOt: false, groupKey: "P", groupLabel: "Pentagon" };
  const html = renderToStaticMarkup(createElement(DatabaseChoiceCard, {
    entry, name: "Arceus", form: null, selected: true, detailsLabel: "Open details", t: (key) => copy("ENG", key), onToggle() {}, onDetails() {},
  }));
  assert.match(html, /class="database-choice-card selected"/);
  assert.match(html, /class="database-choice-select" aria-pressed="true"/);
  assert.match(html, /class="database-pokemon-art"/);
  assert.match(html, /class="origin-mark-icon database-origin-mark"/);
  assert.match(html, /<\/button><button type="button" class="database-choice-info"/);
  assert.match(html, /aria-label="Open details: Arceus/);
  assert.equal((html.match(/<button\b/g) ?? []).length, 2);

  const css = await readFile(resolve("src/styles/controls.css"), "utf8");
  assert.doesNotMatch(css, /\.database-choice-grid\s*>\s*button\s*>\s*span/);
  assert.match(css, /\.database-choice-artwork > \.database-pokemon-art\s*\{[^}]*width:\s*72px/);
  assert.match(css, /\.database-origin-mark\s*\{[^}]*width:\s*18px;\s*height:\s*18px/);
});

test("database details retain exact event facts without inventing a box location", () => {
  const source = specialEntries.find((entry) => entry.dex === 493 && entry.collection === "event-dex" && entry.trainerId === "08016");
  assert.ok(source);
  const entry: PlannedEntry = { ...source, planId: `${source.id}:normal`, variant: "normal", ownOt: false, groupKey: "P", groupLabel: "Pentagon" };
  const app = {
    detailEntry: { entry }, locatedEntries: [], traitAvailability: new Map(), pokemonNames: names, language: "ENG", favorites: new Set(), homeChallengesByDex: new Map(),
    t: (key: string) => copy("ENG", key), displayName: () => "Arceus", displayForm: () => null, displayNote: (value: PokemonEntry) => value.note,
    setDetailEntry() {}, toggleFavorite() {},
  } as unknown as AppController;
  const html = renderToStaticMarkup(createElement(EntryDetails, { app }));
  assert.match(html, /Pokémon 20th Anniversary - Gamestop Event/);
  assert.match(html, /<dt>OT<\/dt><dd>GF<\/dd>/);
  assert.match(html, /<dt>Trainer ID<\/dt><dd>08016<\/dd>/);
  assert.match(html, /<dt>Event period<\/dt>/);
  assert.ok(html.includes(source.sourceUrl!));
  assert.doesNotMatch(html, /<dt>Location<\/dt>/);

  const box = { globalIndex: 0, groupKey: "P", number: 1, label: "Pentagon 01", entries: [entry] };
  const locatedHtml = renderToStaticMarkup(createElement(EntryDetails, { app: { ...app, detailEntry: { entry, box, slotIndex: 0 } } }));
  assert.match(locatedHtml, /<dt>Location<\/dt><dd>BOX 001 · SLOT 01<\/dd>/i);
});

test("required interface copy exists in every available language", async () => {
  const appSource = await readFile(resolve("src/App.tsx"), "utf8");
  const literalKeys = [...appSource.matchAll(/\bt\("([^"]+)"\)/g)].map((match) => match[1]);
  const dynamicKeys = [
    ...GAME_PLANS.map((game) => `game_${game.id}`),
    ...COLLECTION_PRESETS.flatMap((preset) => [`profile_${preset}`, `profile_${preset}_desc`]),
    "origin_mode_living_dex",
    "save_space",
    "mightiest_mark", "mightiest_source", "method_mightiest_raid", "why_mightiest_raid",
    "battle_bond_source", "battle_bond_ability", "battle_bond_origin", "method_battle_bond_demo", "why_battle_bond_demo",
    "best_games_to_progress", "obtainable_missing_count", "missing_obtainable", "open_game_planner", "no_game_recommendations",
  ];
  const requiredKeys = [...new Set([...literalKeys, ...dynamicKeys])];
  for (const { code } of LANGUAGE_OPTIONS) {
    for (const key of requiredKeys) assert.equal(hasCopy(code, key), true, `${code} is missing ${key}`);
  }
  const rankingKeys = ["best_games_to_progress", "obtainable_missing_count", "missing_obtainable", "open_game_planner", "no_game_recommendations"];
  for (const { code } of LANGUAGE_OPTIONS.filter(({ code }) => code !== "ENG")) {
    for (const key of rankingKeys) assert.notEqual(copy(code, key), copy("ENG", key), `${code} still falls back to English for ${key}`);
  }
  const mightiestKeys = ["mightiest_mark", "mightiest_source", "method_mightiest_raid", "why_mightiest_raid"];
  for (const { code } of LANGUAGE_OPTIONS.filter(({ code }) => code !== "ENG")) {
    for (const key of mightiestKeys) assert.notEqual(copy(code, key), copy("ENG", key), `${code} still falls back to English for ${key}`);
  }
  const battleBondKeys = ["battle_bond_source", "battle_bond_ability", "battle_bond_origin", "method_battle_bond_demo", "why_battle_bond_demo"];
  for (const { code } of LANGUAGE_OPTIONS.filter(({ code }) => code !== "ENG")) {
    for (const key of battleBondKeys) assert.notEqual(copy(code, key), copy("ENG", key), `${code} still falls back to English for ${key}`);
  }
  for (const { code } of LANGUAGE_OPTIONS) assert.match(copy(code, "game_gba"), /Pokémon|ポケットモンスター|포켓몬스터|宝可梦|寶可夢/);
});
import "./specimen-traits.test.mjs";
import "./specimen-trait-controls.test";
import "./sea-form-sprites.test.mjs";
import "./variant-selector.test";
import "./trade-ribbon-corrections.test";
import "./manual-box-packing.test";
