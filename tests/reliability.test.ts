import assert from "node:assert/strict";
import test from "node:test";
import { buildOwnedProgressCsv, matchCollectionRecords, parseCollectionCsv, prepareCollectionImport, type ImportCatalogEntry } from "../src/import-export";
import { validateBackup, validateCollectionState } from "../src/backup-validation";
import { changeEntryProgress } from "../src/progress-state";
import type { PlannedEntry, ProgressSnapshot } from "../src/app-types";
import { buildGalleryRows, visibleGalleryRows } from "../src/global-window";
import { EMPTY_THEME_CONFIG } from "../src/box-themes";
import { LANGUAGE_OPTIONS, copy } from "../src/translations";
import { createTauriPlatform } from "../src/platform/tauri";
import { retryableResource } from "../src/platform/retryable-resource";

const catalog: ImportCatalogEntry[] = [{ id: "gba-bulba", dex: 1, name: "Bulbasaur", form: null, mark: "GBA", shinyEligible: true, normalEligible: true, availability: "standard" }];
test("Game Boy Advance aliases resolve to GBA rather than GB", () => {
  for (const origin of ["Game Boy Advance", "Gameboy Advance", "GBA"]) {
    const records = parseCollectionCsv(`No.,Species,OriginMark,Shiny\n1,Bulbasaur,${origin},No`);
    assert.deepEqual(matchCollectionRecords(records, catalog, {}, new Set()).newPlanIds, ["gba-bulba:normal"]);
  }
});
test("portable CSV round-trips origin, generic, Living Dex and missing exceptions", () => {
  const owned = new Set(["gba-bulba:shiny", "generic:normal:1:base:any"]);
  const living = new Set([1]);
  const exclusions = new Set(["living:1", "generic:shiny:1:base:any"]);
  const csv = buildOwnedProgressCsv(owned, catalog, living, exclusions);
  const imported = prepareCollectionImport(parseCollectionCsv(csv), catalog, {}, new Set());
  assert.deepEqual(new Set(imported.owned), owned);
  assert.deepEqual(new Set(imported.livingDexOwned), living);
  assert.deepEqual(new Set(imported.progressExclusions), exclusions);
  assert.equal(imported.summary.unmatched, 0);
});
test("CSV reports unknown IDs without silently discarding them on export", () => {
  const csv = buildOwnedProgressCsv(new Set(["retired-id:normal"]), catalog);
  assert.match(csv, /retired-id:normal/);
  assert.equal(prepareCollectionImport(parseCollectionCsv(csv), catalog, {}, new Set()).summary.unmatched, 1);
});
test("CSV validation rejects broken quotes, missing cells and excess rows before importing", () => {
  assert.throws(() => parseCollectionCsv('PlanId,Species\n"a,b'));
  assert.throws(() => parseCollectionCsv('PlanId,Species\na'));
  assert.throws(() => parseCollectionCsv('PlanId\n' + 'a\n'.repeat(100_001)));
});
test("backup validation is atomic across progress, options, boxes and themes", () => {
  const valid = { version: 9, progress: { owned: ["gba-bulba:normal"] }, configuration: { variants: { normal: true, shiny: false }, capacity: 6000 }, themes: EMPTY_THEME_CONFIG };
  assert.deepEqual(validateBackup(valid).state.livingDexOwned, []);
  const original = structuredClone(valid);
  for (const invalid of [
    { ...valid, progress: { owned: [123] } },
    { ...valid, configuration: { variants: { normal: "yes" } } },
    { ...valid, configuration: { customBoxes: [{ id: "x", name: "Box", planIds: [3] }] } },
    { ...valid, themes: { ...EMPTY_THEME_CONFIG, marks: { GBA: { kind: "invalid" } } } },
    { ...valid, version: 99 },
  ]) assert.throws(() => validateBackup(invalid));
  assert.deepEqual(valid, original);
  assert.throws(() => validateCollectionState({ owned: [], collectionNotes: {} }));
});
test("derived Living Dex and generic progress can be unmarked without deleting origin records", () => {
  for (const livingMode of [true, false]) {
    const entry = { planId: "generic:normal:1:base:any", dex: 1, genericEntry: true, variant: "normal" } as PlannedEntry;
    const state: ProgressSnapshot = { owned: new Set(["gba-bulba:normal"]), livingDexOwned: new Set([1]), progressExclusions: new Set() };
    changeEntryProgress(state, entry, false, livingMode);
    assert.equal(state.owned.has("gba-bulba:normal"), true);
    assert.equal(state.progressExclusions.has(livingMode ? "living:1" : entry.planId), true);
    changeEntryProgress(state, entry, true, livingMode);
    assert.equal(state.progressExclusions.size, 0);
  }
});
test("global window preserves every ordered entry while mounting bounded rows and focused items", () => {
  const groups = Array.from({ length: 20 }, (_, group) => ({ key: String(group), label: `Group ${group}`, entries: Array.from({ length: 1000 }, (_, index) => group * 1000 + index) }));
  const layout = buildGalleryRows(groups, 770, true);
  assert.deepEqual(layout.rows.flatMap((row) => row.entries), groups.flatMap((group) => group.entries));
  for (const top of [0, 5000, layout.height - 800]) {
    const visible = visibleGalleryRows(layout.rows, top, 800);
    assert.ok(visible.flatMap((row) => row.entries).length <= 190);
  }
  assert.ok(visibleGalleryRows(layout.rows, 0, 800, 19_999).some((row) => row.entries.includes(19_999)));
  assert.equal(buildGalleryRows(groups, 300, true).columns, 3);
});
test("native file cancellation and failures reach the caller", async () => {
  const platform = createTauriPlatform("desktop", { storage: { async get() { return null; }, async set() {} }, async saveText() { return false; } });
  assert.equal(await platform.files.saveText("backup.json", "{}", "application/json"), false);
  platform.files.saveText = async () => { throw new Error("disk-full"); };
  await assert.rejects(platform.files.saveText("backup.json", "{}", "application/json"), /disk-full/);
});
test("new persistence and import messages are available in every language", () => {
  for (const language of LANGUAGE_OPTIONS) for (const key of ["save_error", "save_protected", "save_retry", "import_preview", "import_review", "export_failed"]) assert.notEqual(copy(language.code, key), key);
});
test("native storage initialization retries failures and shares successful initialization", async () => {
  let attempts = 0;
  const resource = retryableResource(async () => { if (++attempts === 1) throw new Error("temporarily-unavailable"); return { ready: true }; });
  await assert.rejects(resource(), /temporarily-unavailable/);
  const [first, second] = await Promise.all([resource(), resource()]);
  assert.equal(first, second);
  assert.equal(attempts, 2);
  assert.equal(await resource(), first);
});
