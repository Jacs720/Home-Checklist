import { BACKUP_VERSION } from "./app-config";
import { parseThemeConfig, type BoxThemeConfig } from "./box-themes";
import { parseManualBoxMerges } from "./manual-box-packing";
import { COLLECTION_PRESETS, GAME_PLANS } from "./collection-features";
import { LANGUAGE_OPTIONS } from "./translations";

function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid-object");
  return value as Record<string, any>;
}
function strings(value: unknown) {
  if (!Array.isArray(value) || value.length > 100_000 || value.some((item) => typeof item !== "string" || item.length > 2000)) throw new Error("invalid-list");
}
export function validateCollectionState(raw: unknown) {
  const value = object(raw);
  strings(value.owned);
  for (const key of ["favorites", "progressExclusions", "selectedMarks", "selectedCollections"]) if (key in value) strings(value[key]);
  if ("livingDexOwned" in value && (!Array.isArray(value.livingDexOwned) || value.livingDexOwned.length > 10_000 || value.livingDexOwned.some((dex: unknown) => !Number.isInteger(dex) || Number(dex) < 1 || Number(dex) > 10_000))) throw new Error("invalid-living-dex");
  for (const key of ["includeNonShinySpecials", "includeEventMythicals", "normalLivingDex", "originMarkDex", "originIndependentDex", "favoritesOnly", "homeChallengesOnly", "pokewalkerOnly", "saveSpace", "missingOnly"]) if (key in value && typeof value[key] !== "boolean") throw new Error("invalid-option");
  for (const key of ["variants", "acquisitions", "formOptions", "availabilityFilters", "traitOptions"]) if (key in value && Object.values(object(value[key])).some((item) => typeof item !== "boolean")) throw new Error("invalid-options");
  for (const key of ["language", "genderMode", "viewMode", "collectionPreset", "selectedGamePlan", "collectionGoal", "collectionNotes"]) if (key in value && (typeof value[key] !== "string" || value[key].length > 2000)) throw new Error("invalid-text");
  const options: Record<string, readonly string[]> = { language: LANGUAGE_OPTIONS.map((option) => option.code), genderMode: ["notable", "all"], viewMode: ["boxes", "global", "summary"], collectionPreset: COLLECTION_PRESETS, selectedGamePlan: GAME_PLANS.map((game) => game.id) };
  for (const [key, choices] of Object.entries(options)) if (key in value && !choices.includes(value[key])) throw new Error("invalid-selection");
  for (const key of ["savedAt", "lastExternalBackupAt", "changesSinceBackup", "catalogVersion"]) if (key in value && value[key] !== null && (typeof value[key] !== "number" || !Number.isFinite(value[key]) || value[key] < 0)) throw new Error("invalid-number");
  if ("boxNameOverrides" in value && Object.values(object(value.boxNameOverrides)).some((name) => typeof name !== "string")) throw new Error("invalid-box-names");
  if ("traitOverrides" in value) for (const traits of Object.values(object(value.traitOverrides))) if (Object.values(object(traits)).some((flag) => typeof flag !== "boolean")) throw new Error("invalid-traits");
  if ("customBoxes" in value) {
    if (!Array.isArray(value.customBoxes) || value.customBoxes.length > 10_000) throw new Error("invalid-boxes");
    for (const box of value.customBoxes) { object(box); if (typeof box.id !== "string" || typeof box.name !== "string") throw new Error("invalid-box"); strings(box.planIds); if (box.planIds.length > 30) throw new Error("invalid-box-size"); }
  }
  if ("manualBoxMerges" in value) {
    if (!Array.isArray(value.manualBoxMerges)) throw new Error("invalid-merges");
    if (parseManualBoxMerges(value.manualBoxMerges).length !== value.manualBoxMerges.length) throw new Error("invalid-merges");
  }
  return value;
}

export function validateBackup(raw: unknown): { state: Record<string, any>; themes?: BoxThemeConfig } {
  const value = object(raw);
  if (value.type && !["home-checklist-backup", "origin-marks-home-checklist"].includes(value.type)) throw new Error("invalid-backup-type");
  if ("version" in value && (!Number.isInteger(value.version) || value.version < 1 || value.version > BACKUP_VERSION)) throw new Error("unsupported-backup");
  const progress = "progress" in value ? object(value.progress) : value;
  const configuration = "configuration" in value ? object(value.configuration) : value;
  const state = validateCollectionState({ ...configuration, ...progress, catalogVersion: value.catalogVersion ?? 0, lastExternalBackupAt: value.lastExternalBackupAt ?? null, changesSinceBackup: value.changesSinceBackup ?? 0 });
  let themes: BoxThemeConfig | undefined;
  if ("themes" in value) {
    themes = validateThemes(value.themes);
    if (!themes) throw new Error("invalid-themes");
  }
  return { state: { ...state, livingDexOwned: state.livingDexOwned ?? [], progressExclusions: state.progressExclusions ?? [], favorites: state.favorites ?? [] }, themes };
}

export function validateThemes(raw: unknown): BoxThemeConfig {
  const candidate = object(raw);
  const parsed = parseThemeConfig(candidate);
  if (!parsed) throw new Error("invalid-themes");
  for (const key of ["marks", "boxes"] as const) {
    const record = object(candidate[key]);
    if (Object.keys(record).length !== Object.keys(parsed[key]).length) throw new Error("invalid-theme-record");
  }
  return parsed;
}
