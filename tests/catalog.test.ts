import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { DEFAULT_MARKS, MARKS } from "../src/app-config";
import type { Acquisition, Dataset, FormOptions, GenderMode, PokemonNames, PokemonEntry, SpecialDataset, Variant } from "../src/app-types";
import { addGoStorableForms } from "../src/catalog-corrections";
import { applyCatalogCorrections, buildBoxes, isOwnOtShinyLocked } from "../src/catalog-planner";
import { COLLECTION_PRESETS, GAME_PLANS, UNIFIED_COLLECTION_PRESETS, rankGamePlans, type CollectionPreset, type SpeciesRulesDataset } from "../src/collection-features";
import { buildOwnedProgressCsv, matchCollectionRecords, parseCollectionCsv } from "../src/import-export";
import { buildBoxNavigationHash, buildGlobalNavigationHash, parseSharedNavigationHash } from "../src/navigation-url";
import { buildMightiestRaidEntries, type MightiestRaidsDataset } from "../src/mightiest-raids";
import { createTauriPlatform } from "../src/platform/tauri";
import { LANGUAGE_OPTIONS, copy, hasCopy } from "../src/translations";

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
const specialEntries = [...addGoStorableForms(rawSpecialDataset.entries, catalogEntries), ...mightiestEntries];
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
  "Living Form Lite": 1343,
  "Living Form Dex": 1447,
  "Shiny Living Dex": 981,
  "Shiny Final Form Dex": 563,
  "Shiny Living Dex + Regional Forms": 1035,
  "Shiny Living Form Lite": 1219,
  "Shiny Form Living Dex": 1323,
  "Origin Mark Dex": 5044,
  "Event Dex": 1880,
};

function profileEntries(profile: CanonicalProfile) {
  return canonicalProfiles[profile].flatMap((box) => box.entries);
}

test("catalog identities and origin keys are valid", () => {
  const ids = importEntries.map((entry) => entry.id);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicateIds, [], `duplicate raw catalog ids: ${duplicateIds.join(", ")}`);
  const allowedMarks = new Set(MARKS);
  const allowedCollections = new Set(["n", "dream", "radar", "shadow-colosseum", "shadow-xd", "cherish", "event-dex", "events", "mighty", "trades", "go"]);
  for (const entry of importEntries) {
    assert.ok(entry.dex > 0, `${entry.id} has invalid National Dex number ${entry.dex}`);
    if (entry.mark) assert.ok(allowedMarks.has(entry.mark), `${entry.id} has impossible Origin Mark ${entry.mark}`);
    if (entry.collection) assert.ok(allowedCollections.has(entry.collection), `${entry.id} has unknown collection ${entry.collection}`);
  }
  assert.equal(catalogEntries.some((entry) => entry.mark === "GBA" && entry.dex === 983), false, "Kingambit cannot retain a GBA origin");
});

test("Mightiest Mark collection contains only unique eligible raid specimens", () => {
  assert.equal(mightiestDataset.meta.specimenCount, 53);
  assert.equal(mightiestEntries.length, 53);
  assert.equal(new Set(mightiestEntries.map((entry) => `${entry.dex}:${entry.form ?? ""}`)).size, 53);
  assert.ok(mightiestEntries.some((entry) => entry.dex === 157 && entry.form === "Original"));
  assert.ok(mightiestEntries.some((entry) => entry.dex === 157 && entry.form === "Hisuian"));
  assert.ok(mightiestEntries.some((entry) => entry.dex === 1005));
  assert.ok(mightiestEntries.some((entry) => entry.dex === 1006));
  for (const entry of mightiestEntries) {
    assert.equal(entry.collection, "mighty");
    assert.equal(entry.mark, "SV");
    assert.equal(entry.shinyEligible, false);
    assert.equal(entry.ownOtNormal, true);
    assert.equal(entry.requirements?.encounterMark, "Mightiest Mark");
  }
});

test("own-OT shiny locks remain excluded", () => {
  const invalid = catalogEntries.filter((entry) => isOwnOtShinyLocked(entry) && (entry.shinyEligible || entry.ownOtShiny));
  assert.deepEqual(invalid.map((entry) => entry.id), []);
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

test("required interface copy exists in every available language", async () => {
  const appSource = await readFile(resolve("src/App.tsx"), "utf8");
  const literalKeys = [...appSource.matchAll(/\bt\("([^"]+)"\)/g)].map((match) => match[1]);
  const dynamicKeys = [
    ...GAME_PLANS.map((game) => `game_${game.id}`),
    ...COLLECTION_PRESETS.flatMap((preset) => [`profile_${preset}`, `profile_${preset}_desc`]),
    "origin_mode_living_dex",
    "mightiest_mark", "mightiest_source", "method_mightiest_raid", "why_mightiest_raid",
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
  for (const { code } of LANGUAGE_OPTIONS) assert.match(copy(code, "game_gba"), /Pokémon|ポケットモンスター|포켓몬스터|宝可梦|寶可夢/);
});
