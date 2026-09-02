export const SPECIMEN_TRAITS = ["alpha", "gmaxFactor"] as const;
export type SpecimenTrait = typeof SPECIMEN_TRAITS[number];
export type TraitOptions = Record<SpecimenTrait, boolean>;
export type TraitOverrides = Record<string, Partial<TraitOptions>>;
export const DEFAULT_TRAIT_OPTIONS: TraitOptions = { alpha: false, gmaxFactor: false };
export const TRAIT_LABELS = { alpha: "alpha", gmaxFactor: "gmax_factor" } as const;
export const TRAIT_ICONS = { alpha: "alpha.png", gmaxFactor: "gigantamax.png" } as const;

type TraitEntry = {
  dex: number; form: string | null; mark?: string; collection?: string;
  variant?: string; genericEntry?: boolean; shinyEligible?: boolean; normalEligible?: boolean;
  availability?: string; trainerName?: string; trainerId?: string; displayDetail?: string;
  requirements?: { alpha?: boolean; gmaxFactor?: boolean; originGeneration?: number; originGame?: string };
};

// Sources: https://bulbapedia.bulbagarden.net/wiki/Alpha_Pok%C3%A9mon
// and https://bulbapedia.bulbagarden.net/wiki/Gigantamax (checked 2026-09-02).
const NON_ALPHA_SPECIES = new Set([
  144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,
  480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,638,639,640,641,642,643,
  644,645,646,647,648,649,716,717,718,719,720,721,772,773,785,786,787,788,789,790,791,
  792,800,801,802,807,808,809,888,889,890,891,892,893,894,895,896,897,898,905,
  1001,1002,1003,1004,1007,1008,1014,1015,1016,1017,1024,1025,
]);
const GMAX_SPECIES = new Set([
  3,6,9,12,25,52,68,94,99,131,133,143,569,809,812,815,818,823,826,834,839,841,842,
  844,849,851,858,861,869,879,884,892,
]);
// These can carry the factor without being able to Gigantamax yet.
const GMAX_GIFT_STARTERS = new Set([1,2,4,5,7,8]);
const GMAX_EVENT_RAIDS = new Set([857,868]);
const baseForm = (form: string | null) => !form || /^(original|normal|standard|kantonian)$/i.test(form);
const speciesKey = (entry: TraitEntry) => `${entry.dex}:${baseForm(entry.form) ? "" : entry.form?.toLowerCase()}:${entry.variant ?? "normal"}`;
export type TraitAvailability = Map<string, TraitOptions>;

function originTraitEligible(entry: TraitEntry, trait: SpecimenTrait): boolean {
  if (entry.availability === "excluded") return false;
  if (trait === "alpha") {
    if (NON_ALPHA_SPECIES.has(entry.dex)) return false;
    if (entry.mark !== "LA" && entry.mark !== "LZA") return false;
    if (entry.mark === "LA" && (entry.dex === 37 || entry.dex === 38) && /alolan/i.test(entry.form ?? "")) return false;
    if (entry.dex === 670 && /eternal/i.test(entry.form ?? "")) return false;
    // A specific gift/trade is not interchangeable with a wild alpha of the same species.
    return !entry.collection || entry.requirements?.alpha === true;
  }
  if (entry.dex === 809) {
    // Only HOME's GO-transfer gift, never a GO-caught or Let's Go Melmetal.
    return entry.variant !== "shiny" && entry.trainerName === "HOME" &&
      entry.requirements?.originGame === "HOME";
  }
  if (entry.mark !== "SwSh") return false;
  if (entry.dex === 25 && (!baseForm(entry.form) || /201023|970401/.test(entry.trainerId ?? "") ||
    /\b(cap|ash|satoshi)\b|サトシ/i.test(`${entry.displayDetail ?? ""} ${entry.trainerName ?? ""}`))) return false;
  if (entry.dex === 52 && !baseForm(entry.form)) return false;
  if (GMAX_GIFT_STARTERS.has(entry.dex)) return entry.variant !== "shiny" && !entry.collection;
  if (GMAX_EVENT_RAIDS.has(entry.dex)) return !entry.collection;
  return GMAX_SPECIES.has(entry.dex);
}

export function createTraitAvailability(entries: readonly TraitEntry[]): TraitAvailability {
  const result: TraitAvailability = new Map();
  for (const entry of entries) {
    for (const variant of ["normal", "shiny"]) {
      if (variant === "normal" ? entry.normalEligible === false : !entry.shinyEligible) continue;
      const candidate = { ...entry, variant };
      const key = speciesKey(candidate);
      const previous = result.get(key) ?? DEFAULT_TRAIT_OPTIONS;
      result.set(key, {
        alpha: previous.alpha || originTraitEligible(candidate, "alpha"),
        gmaxFactor: previous.gmaxFactor || originTraitEligible(candidate, "gmaxFactor"),
      });
    }
  }
  return result;
}

export function traitEligible(entry: TraitEntry, trait: SpecimenTrait, availability?: TraitAvailability): boolean {
  if (entry.genericEntry) {
    if (trait === "alpha" && entry.requirements?.originGeneration && entry.requirements.originGeneration < 8) return false;
    return availability?.get(speciesKey(entry))?.[trait] === true;
  }
  return originTraitEligible(entry, trait);
}

// Requirements do not change planId, box positions, favorites, or obtained progress.
export function applySpecimenTraits<T extends TraitEntry & { planId: string }>(
  entry: T, options: TraitOptions, overrides: TraitOverrides, availability?: TraitAvailability,
): T {
  const requirements = { ...entry.requirements };
  for (const trait of SPECIMEN_TRAITS) {
    if (!traitEligible(entry, trait, availability)) continue;
    requirements[trait] = overrides[entry.planId]?.[trait] ?? (options[trait] || entry.requirements?.[trait] === true);
  }
  return { ...entry, requirements };
}

export function parseTraitOptions(value: unknown): TraitOptions {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { alpha: record.alpha === true, gmaxFactor: record.gmaxFactor === true };
}

export function parseTraitOverrides(value: unknown): TraitOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id, raw]) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const traits = Object.fromEntries(SPECIMEN_TRAITS.flatMap((trait) => {
      const flag = (raw as Record<string, unknown>)[trait];
      return typeof flag === "boolean" ? [[trait, flag]] : [];
    }));
    return Object.keys(traits).length ? [[id, traits]] : [];
  }));
}

