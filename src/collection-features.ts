export type AvailabilityStatus = "current" | "legacy" | "historical" | "hypothetical";
export type CollectionPreset =
  | "basic"
  | "final"
  | "regional"
  | "forms_lite"
  | "forms"
  | "shiny"
  | "origin"
  | "noah"
  | "original_generation"
  | "completionist"
  | "custom";
export type GamePlanId = "sv" | "lza" | "swsh" | "pla" | "bdsp" | "lgpe" | "usum" | "kalos_hoenn" | "bw2" | "gb" | "gba" | "colosseum" | "xd" | "go";

export type SpecimenRequirements = {
  gender?: "male" | "female" | "any";
  originGame?: string;
  originGeneration?: number;
  originRegion?: string;
  ball?: string;
  nature?: string;
  pokemonLanguage?: string;
  encounterMark?: string;
  ribbons?: string[];
  ability?: string;
  teraType?: string;
  heldItem?: string;
  moves?: string[];
  alpha?: boolean;
  gmaxFactor?: boolean;
};

export type SpeciesRule = {
  dex: number;
  generation: number;
  evolvesFrom: number | null;
  genderRate: number;
};

export type SpeciesRulesDataset = {
  meta: { source: string; sourceUrl: string; generatedAt: string; speciesCount: number };
  species: SpeciesRule[];
};

type SlotCandidate = {
  dex: number;
  form: string | null;
  variant: string;
  planId: string;
  mark?: string;
  gender?: "male" | "female";
  genderVariant?: "base" | "extra";
  requirements?: SpecimenRequirements;
};

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = ["current", "legacy", "historical", "hypothetical"];
export const COLLECTION_PRESETS: CollectionPreset[] = [
  "basic",
  "final",
  "regional",
  "forms_lite",
  "forms",
  "shiny",
  "origin",
  "noah",
  "original_generation",
  "completionist",
  "custom",
];
export const UNIFIED_COLLECTION_PRESETS = new Set<CollectionPreset>(["basic", "final", "regional", "forms_lite", "forms", "shiny", "noah", "original_generation"]);

const REGIONAL_FORM = /^(?:Alolan|Galarian|Hisuian|Paldean(?:\s|$))/i;
const REGION_KEYS = ["kanto", "johto", "hoenn", "sinnoh", "unova", "kalos", "alola", "galar", "paldea"] as const;
const ORIGINAL_MARK_PREFERENCE: Record<number, string[]> = {
  1: ["GB", "LGPE", "Sin marca", "GBA"],
  2: ["GB", "Sin marca", "GBA"],
  3: ["Sin marca", "GBA", "P"],
  4: ["Sin marca", "BDSP"],
  5: ["Sin marca"],
  6: ["P"],
  7: ["USUM", "LGPE"],
  8: ["SwSh", "LA", "BDSP"],
  9: ["SV", "LZA"],
};

export function isRegionalForm(form: string | null | undefined) {
  return Boolean(form && REGIONAL_FORM.test(form));
}

export function regionKeyForGeneration(generation: number) {
  return `region-${REGION_KEYS[generation - 1] ?? `gen-${generation}`}`;
}

function preferredCandidate<T extends SlotCandidate>(entries: T[], marks?: string[]) {
  return [...entries].sort((left, right) => {
    const leftMark = marks ? marks.indexOf(left.mark ?? "") : -1;
    const rightMark = marks ? marks.indexOf(right.mark ?? "") : -1;
    const leftRank = left.variant === "normal" ? 0 : 4;
    const rightRank = right.variant === "normal" ? 0 : 4;
    const leftGender = left.genderVariant === "extra" ? 2 : 0;
    const rightGender = right.genderVariant === "extra" ? 2 : 0;
    const leftOrigin = leftMark >= 0 ? leftMark : 99;
    const rightOrigin = rightMark >= 0 ? rightMark : 99;
    return leftRank + leftGender + leftOrigin - (rightRank + rightGender + rightOrigin);
  })[0];
}

function groupedByDex<T extends SlotCandidate>(entries: T[]) {
  const groups = new Map<number, T[]>();
  for (const entry of entries) {
    const group = groups.get(entry.dex) ?? [];
    group.push(entry);
    groups.set(entry.dex, group);
  }
  return groups;
}

export function selectLivingDexWithRegionalForms<T extends SlotCandidate>(entries: T[]) {
  const selected: T[] = [];
  for (const candidates of groupedByDex(entries).values()) {
    const base = preferredCandidate(candidates.filter((entry) => !isRegionalForm(entry.form)));
    if (base) selected.push(base);
    const regionalForms = new Map<string, T[]>();
    for (const entry of candidates.filter((candidate) => isRegionalForm(candidate.form))) {
      const formCandidates = regionalForms.get(entry.form ?? "") ?? [];
      formCandidates.push(entry);
      regionalForms.set(entry.form ?? "", formCandidates);
    }
    for (const formCandidates of regionalForms.values()) {
      const regional = preferredCandidate(formCandidates);
      if (regional) selected.push(regional);
    }
  }
  return selected.sort((left, right) => left.dex - right.dex || (left.form ?? "").localeCompare(right.form ?? ""));
}

export function selectLivingFormLiteEntries<T extends SlotCandidate>(entries: T[]) {
  const forms = new Map<string, T[]>();
  for (const entry of entries) {
    if (entry.genderVariant === "extra") continue;
    const key = `${entry.dex}:${entry.form ?? ""}:${entry.variant}`;
    const candidates = forms.get(key) ?? [];
    candidates.push(entry);
    forms.set(key, candidates);
  }
  return [...forms.values()]
    .map((candidates) => preferredCandidate(candidates))
    .filter((entry): entry is T => Boolean(entry))
    .sort((left, right) => left.dex - right.dex || (left.form ?? "").localeCompare(right.form ?? ""));
}

export function selectLivingFormEntries<T extends SlotCandidate>(entries: T[]) {
  const forms = new Map<string, T[]>();
  for (const entry of entries) {
    const key = `${entry.dex}:${entry.form ?? ""}:${entry.genderVariant ?? "base"}:${entry.variant}`;
    const candidates = forms.get(key) ?? [];
    candidates.push(entry);
    forms.set(key, candidates);
  }
  const selected = [...forms.values()]
    .map((candidates) => preferredCandidate(candidates))
    .filter((entry): entry is T => Boolean(entry));
  const genderedForms = new Set(selected.filter((entry) => entry.genderVariant === "extra").map((entry) => `${entry.dex}:${entry.form ?? ""}:${entry.variant}`));
  return selected
    .map((entry) => genderedForms.has(`${entry.dex}:${entry.form ?? ""}:${entry.variant}`) && entry.gender
      ? { ...entry, requirements: { ...entry.requirements, gender: entry.gender } }
      : entry)
    .sort((left, right) => left.dex - right.dex || (left.form ?? "").localeCompare(right.form ?? "") || (left.requirements?.gender ?? "").localeCompare(right.requirements?.gender ?? ""));
}

export function genericSpecimenKey(entry: Pick<SlotCandidate, "dex" | "form" | "variant" | "requirements">) {
  const form = encodeURIComponent(entry.form ?? "base");
  const gender = entry.requirements?.gender ?? "any";
  return `generic:${entry.variant}:${entry.dex}:${form}:${gender}`;
}

export function selectFinalFormDexEntries<T extends SlotCandidate>(entries: T[], rules: Map<number, SpeciesRule>) {
  const evolvesFurther = new Set([...rules.values()].map((rule) => rule.evolvesFrom).filter((dex): dex is number => dex !== null));
  // These species only gain an evolution from a particular regional/form branch;
  // their original/base form remains a final form in its own evolutionary path.
  const baseFormRemainsFinal = new Set([83, 122, 211, 222, 264, 550]);
  return selectLivingDexWithRegionalForms(entries).filter((entry) => (
    !evolvesFurther.has(entry.dex)
    || (baseFormRemainsFinal.has(entry.dex) && !isRegionalForm(entry.form))
  ));
}

export function selectNoahsArkEntries<T extends SlotCandidate>(entries: T[], rules: Map<number, SpeciesRule>) {
  const selected: T[] = [];
  for (const [dex, candidates] of groupedByDex(entries).entries()) {
    const baseCandidates = candidates.filter((entry) => !isRegionalForm(entry.form));
    const base = preferredCandidate(baseCandidates);
    if (!base) continue;
    const genderRate = rules.get(dex)?.genderRate ?? -1;
    const genders: SpecimenRequirements["gender"][] = genderRate === 0 ? ["male"] : genderRate === 8 ? ["female"] : genderRate < 0 ? ["any"] : ["male", "female"];
    for (const gender of genders) {
      const genderCandidate = gender === "any" ? base : preferredCandidate(baseCandidates.filter((entry) => entry.gender === gender)) ?? base;
      selected.push({
        ...genderCandidate,
        gender: gender === "any" ? genderCandidate.gender : gender,
        planId: `${genderCandidate.planId}:gender:${gender}`,
        requirements: { ...genderCandidate.requirements, gender },
      });
    }
  }
  return selected.sort((left, right) => left.dex - right.dex || (left.requirements?.gender ?? "").localeCompare(right.requirements?.gender ?? ""));
}

export function selectOriginalGenerationEntries<T extends SlotCandidate>(entries: T[], rules: Map<number, SpeciesRule>) {
  const selected: Array<T & { requirements: SpecimenRequirements }> = [];
  for (const [dex, candidates] of groupedByDex(entries).entries()) {
    const generation = rules.get(dex)?.generation ?? generationForDex(dex);
    const base = preferredCandidate(candidates.filter((entry) => !isRegionalForm(entry.form)), ORIGINAL_MARK_PREFERENCE[generation]);
    if (!base) continue;
    selected.push({
      ...base,
      planId: `${base.planId}:original-generation:${generation}`,
      requirements: { ...base.requirements, originGeneration: generation, originRegion: regionKeyForGeneration(generation) },
    });
  }
  return selected.sort((left, right) => left.dex - right.dex);
}
export const GAME_PLANS: Array<{ id: GamePlanId; marks?: string[]; collections?: string[]; gamePattern?: RegExp }> = [
  { id: "sv", marks: ["SV"], gamePattern: /Scarlet|Violet|Escarlata|P[uú]rpura/i },
  { id: "lza", marks: ["LZA"], gamePattern: /Legends.*Z-A|Leyendas.*Z-A/i },
  { id: "swsh", marks: ["SwSh"], gamePattern: /Sword|Shield|Espada|Escudo/i },
  { id: "pla", marks: ["LA"], gamePattern: /Legends.*Arceus|Leyendas.*Arceus/i },
  { id: "bdsp", marks: ["BDSP"], gamePattern: /Brilliant Diamond|Shining Pearl|Diamante Brillante|Perla Reluciente/i },
  { id: "lgpe", marks: ["LGPE"], gamePattern: /Let's Go/i },
  { id: "usum", marks: ["USUM"], gamePattern: /Sun|Moon|Sol|Luna/i },
  { id: "kalos_hoenn", marks: ["P"], gamePattern: /Pok[eé]mon X|Pok[eé]mon Y|Omega Ruby|Alpha Sapphire|Rub[ií] Omega|Zafiro Alfa/i },
  { id: "bw2", collections: ["n", "radar"], gamePattern: /Black 2|White 2|Negro 2|Blanco 2/i },
  { id: "gb", marks: ["GB"] },
  { id: "gba", marks: ["GBA"] },
  { id: "colosseum", collections: ["shadow-colosseum"] },
  { id: "xd", collections: ["shadow-xd"] },
  { id: "go", collections: ["go"] },
];

type AccessEntry = {
  mark?: string;
  collection?: string;
  dex: number;
  availability?: "standard" | "historical" | "hypothetical" | "excluded";
  game?: string;
  acquisitionCategory?: "own" | "trade" | "event" | "external";
};

const BANK_MARKS = new Set(["Sin marca", "GB", "P", "USUM"]);
const BANK_COLLECTIONS = new Set(["n", "dream", "radar", "shadow-colosseum", "shadow-xd"]);
const LEGACY_GAME = /\b(?:Red|Green|Blue|Yellow|Gold|Silver|Crystal|Ruby|Sapphire|Emerald|FireRed|LeafGreen|Diamond|Pearl|Platinum|HeartGold|SoulSilver|Black|White|X|Y|Sun|Moon|Ultra Sun|Ultra Moon)\b/i;

const ORIGIN_GENERATION: Record<string, number> = {
  "Sin marca": 5,
  GB: 2,
  P: 6,
  USUM: 7,
  LGPE: 7,
  SwSh: 8,
  LA: 8,
  BDSP: 8,
  SV: 9,
  LZA: 9,
  GBA: 3,
  n: 5,
  dream: 5,
  radar: 5,
  "shadow-colosseum": 3,
  "shadow-xd": 3,
};

export function generationForDex(dex: number) {
  if (dex <= 151) return 1;
  if (dex <= 251) return 2;
  if (dex <= 386) return 3;
  if (dex <= 493) return 4;
  if (dex <= 649) return 5;
  if (dex <= 721) return 6;
  if (dex <= 809) return 7;
  if (dex <= 905) return 8;
  return 9;
}

export function matchesGamePlan(entry: AccessEntry, planId: GamePlanId) {
  const plan = GAME_PLANS.find((candidate) => candidate.id === planId);
  if (!plan || entry.availability === "hypothetical" || entry.collection === "dream" || entry.collection === "events" || entry.collection === "cherish" || entry.acquisitionCategory === "event") return false;
  if (entry.mark && plan.marks?.includes(entry.mark)) return true;
  if (entry.collection && plan.collections?.includes(entry.collection)) return true;
  return entry.collection === "trades" && Boolean(entry.game && plan.gamePattern?.test(entry.game));
}

export function requiresPokemonBank(entry: AccessEntry) {
  if (entry.mark && BANK_MARKS.has(entry.mark)) return true;
  if (entry.collection && BANK_COLLECTIONS.has(entry.collection)) return true;
  return entry.collection === "trades" && Boolean(entry.game && LEGACY_GAME.test(entry.game));
}

export function availabilityForEntry(entry: AccessEntry): AvailabilityStatus {
  if (entry.availability === "hypothetical") return "hypothetical";
  if (entry.availability === "historical") return "historical";
  if (entry.collection === "dream") return "historical";
  return requiresPokemonBank(entry) ? "legacy" : "current";
}

export function isLaterGenerationEvolution(entry: AccessEntry) {
  const originKey = entry.mark ?? entry.collection ?? "";
  const originGeneration = ORIGIN_GENERATION[originKey];
  return Boolean(originGeneration && generationForDex(entry.dex) > originGeneration);
}

export function methodKeyForEntry(entry: AccessEntry) {
  if (isLaterGenerationEvolution(entry)) return "method_transfer_evolve";
  if (entry.collection === "dream") return "method_dream_world";
  if (entry.collection === "radar") return "method_dream_radar";
  if (entry.collection === "shadow-colosseum" || entry.collection === "shadow-xd") return "method_shadow";
  if (entry.collection === "n") return "method_n_pokemon";
  if (entry.collection === "go") return "method_go";
  if (entry.collection === "trades") return "method_trade";
  if (entry.collection === "cherish" || entry.collection === "event-dex") return "method_event";
  if (entry.availability === "hypothetical") return "method_hypothetical";
  return "method_source_game";
}

export function reasonKeyForEntry(entry: AccessEntry) {
  if (isLaterGenerationEvolution(entry)) return "why_transfer_evolution";
  if (entry.collection === "dream") return "why_dream_world";
  if (entry.availability === "hypothetical") return "why_hypothetical";
  return "why_valid_entry";
}

export function transferKeyForEntry(entry: AccessEntry) {
  if (entry.availability === "historical") return "transfer_unavailable_historical";
  if (entry.collection === "dream") return "transfer_existing_bank_home";
  if (requiresPokemonBank(entry)) return "transfer_bank_home";
  if (entry.collection === "go") return "transfer_go_home";
  if (entry.availability === "hypothetical") return "transfer_hypothetical";
  return "transfer_direct_home";
}
