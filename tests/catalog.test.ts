import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { DEFAULT_MARKS, MARKS } from "../src/app-config";
import type { Acquisition, Dataset, FormOptions, GenderMode, PokemonNames, PokemonEntry, SpecialDataset, Variant } from "../src/app-types";
import { addGoStorableForms } from "../src/catalog-corrections";
import { applyCatalogCorrections, buildBoxes, isOwnOtShinyLocked } from "../src/catalog-planner";
import { GAME_PLANS, rankGamePlans, type CollectionPreset, type SpeciesRulesDataset } from "../src/collection-features";
import { buildOwnedProgressCsv, matchCollectionRecords, parseCollectionCsv } from "../src/import-export";
import { buildBoxNavigationHash, buildGlobalNavigationHash, parseSharedNavigationHash } from "../src/navigation-url";
import { LANGUAGE_OPTIONS, copy, hasCopy } from "../src/translations";

const readJson = async <T>(path: string) => JSON.parse(await readFile(resolve(path), "utf8")) as T;
const [baseDataset, rawSpecialDataset, names, rulesDataset] = await Promise.all([
  readJson<Dataset>("public/data/pokemon-lite.json"),
  readJson<SpecialDataset>("public/data/special-collections.json"),
  readJson<PokemonNames>("public/data/pokemon-names.json"),
  readJson<SpeciesRulesDataset>("public/data/species-rules.json"),
]);

const catalogEntries = applyCatalogCorrections(baseDataset.entries);
const specialEntries = addGoStorableForms(rawSpecialDataset.entries, catalogEntries);
const importEntries = [...catalogEntries, ...specialEntries];
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
    options.preset,
    speciesRules,
    "ENG",
  );
}

const canonicalProfiles = {
  "Living Dex": buildProfile({ preset: "basic", normalLivingDex: true }),
  "Living Form Dex": buildProfile({ preset: "forms", gender: "all", forms: allForms }),
  "Shiny Living Dex": buildProfile({ preset: "shiny", variants: { normal: false, shiny: true }, gender: "all", forms: allForms }),
  "Origin Mark Dex": buildProfile({ preset: "origin", originMarkDex: true }),
  "Event Dex": buildProfile({ preset: "custom", marks: [], collections: ["event-dex"], variants: { normal: true, shiny: true }, acquisitions: allAcquisitions, includeNonShinySpecials: true, gender: "all", forms: allForms }),
};

const EXPECTED_PROFILE_COUNTS: Record<keyof typeof canonicalProfiles, number> = {
  "Living Dex": 1025,
  "Living Form Dex": 1447,
  "Shiny Living Dex": 1323,
  "Origin Mark Dex": 5044,
  "Event Dex": 1880,
};

function profileEntries(profile: keyof typeof canonicalProfiles) {
  return canonicalProfiles[profile].flatMap((box) => box.entries);
}

test("catalog identities and origin keys are valid", () => {
  const ids = importEntries.map((entry) => entry.id);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicateIds, [], `duplicate raw catalog ids: ${duplicateIds.join(", ")}`);
  const allowedMarks = new Set(MARKS);
  const allowedCollections = new Set(["n", "dream", "radar", "shadow-colosseum", "shadow-xd", "cherish", "event-dex", "events", "trades", "go"]);
  for (const entry of importEntries) {
    assert.ok(entry.dex > 0, `${entry.id} has invalid National Dex number ${entry.dex}`);
    if (entry.mark) assert.ok(allowedMarks.has(entry.mark), `${entry.id} has impossible Origin Mark ${entry.mark}`);
    if (entry.collection) assert.ok(allowedCollections.has(entry.collection), `${entry.id} has unknown collection ${entry.collection}`);
  }
  assert.equal(catalogEntries.some((entry) => entry.mark === "GBA" && entry.dex === 983), false, "Kingambit cannot retain a GBA origin");
});

test("own-OT shiny locks remain excluded", () => {
  const invalid = catalogEntries.filter((entry) => isOwnOtShinyLocked(entry) && (entry.shinyEligible || entry.ownOtShiny));
  assert.deepEqual(invalid.map((entry) => entry.id), []);
});

test("canonical profile counts match catalog snapshots", () => {
  const actual = Object.fromEntries(Object.keys(canonicalProfiles).map((profile) => [profile, profileEntries(profile as keyof typeof canonicalProfiles).length]));
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

test("all planned entries fit boxes, have unique planIds and deterministic order", () => {
  for (const [profile, boxes] of Object.entries(canonicalProfiles)) {
    const entries = boxes.flatMap((box) => box.entries);
    assert.equal(new Set(entries.map((entry) => entry.planId)).size, entries.length, `${profile} contains duplicate planIds`);
    boxes.forEach((box, index) => {
      assert.equal(box.globalIndex, index, `${profile} has a non-deterministic global box index`);
      assert.ok(box.entries.length <= 30, `${profile} overfilled box ${index + 1}`);
    });
    const rebuilt = buildProfile(profile === "Living Dex"
      ? { preset: "basic", normalLivingDex: true }
      : profile === "Living Form Dex"
        ? { preset: "forms", gender: "all", forms: allForms }
        : profile === "Shiny Living Dex"
          ? { preset: "shiny", variants: { normal: false, shiny: true }, gender: "all", forms: allForms }
          : profile === "Origin Mark Dex"
            ? { preset: "origin", originMarkDex: true }
            : { preset: "custom", marks: [], collections: ["event-dex"], variants: { normal: true, shiny: true }, acquisitions: allAcquisitions, includeNonShinySpecials: true, gender: "all", forms: allForms });
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

test("required interface copy exists in every available language", async () => {
  const appSource = await readFile(resolve("src/App.tsx"), "utf8");
  const literalKeys = [...appSource.matchAll(/\bt\("([^"]+)"\)/g)].map((match) => match[1]);
  const dynamicKeys = [
    ...GAME_PLANS.map((game) => `game_${game.id}`),
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
  for (const { code } of LANGUAGE_OPTIONS) assert.match(copy(code, "game_gba"), /Pokémon|ポケットモンスター|포켓몬스터|宝可梦|寶可夢/);
});
