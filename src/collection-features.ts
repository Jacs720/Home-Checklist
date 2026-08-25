export type AvailabilityStatus = "current" | "legacy" | "historical" | "hypothetical";
export type CollectionPreset = "basic" | "forms" | "shiny" | "origin" | "completionist" | "custom";

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = ["current", "legacy", "historical", "hypothetical"];
export const COLLECTION_PRESETS: CollectionPreset[] = ["basic", "forms", "shiny", "origin", "completionist", "custom"];

type AccessEntry = {
  mark?: string;
  collection?: string;
  dex: number;
  availability?: "standard" | "hypothetical" | "excluded";
  game?: string;
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

function speciesGeneration(dex: number) {
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

export function requiresPokemonBank(entry: AccessEntry) {
  if (entry.mark && BANK_MARKS.has(entry.mark)) return true;
  if (entry.collection && BANK_COLLECTIONS.has(entry.collection)) return true;
  return entry.collection === "trades" && Boolean(entry.game && LEGACY_GAME.test(entry.game));
}

export function availabilityForEntry(entry: AccessEntry): AvailabilityStatus {
  if (entry.availability === "hypothetical") return "hypothetical";
  if (entry.collection === "dream") return "historical";
  return requiresPokemonBank(entry) ? "legacy" : "current";
}

export function isLaterGenerationEvolution(entry: AccessEntry) {
  const originKey = entry.mark ?? entry.collection ?? "";
  const originGeneration = ORIGIN_GENERATION[originKey];
  return Boolean(originGeneration && speciesGeneration(entry.dex) > originGeneration);
}

export function methodKeyForEntry(entry: AccessEntry) {
  if (isLaterGenerationEvolution(entry)) return "method_transfer_evolve";
  if (entry.collection === "dream") return "method_dream_world";
  if (entry.collection === "radar") return "method_dream_radar";
  if (entry.collection === "shadow-colosseum" || entry.collection === "shadow-xd") return "method_shadow";
  if (entry.collection === "n") return "method_n_pokemon";
  if (entry.collection === "go") return "method_go";
  if (entry.collection === "trades") return "method_trade";
  if (entry.collection === "cherish") return "method_event";
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
  if (entry.collection === "dream") return "transfer_existing_bank_home";
  if (requiresPokemonBank(entry)) return "transfer_bank_home";
  if (entry.collection === "go") return "transfer_go_home";
  if (entry.availability === "hypothetical") return "transfer_hypothetical";
  return "transfer_direct_home";
}
