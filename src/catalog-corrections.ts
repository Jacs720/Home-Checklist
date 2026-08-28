type CatalogEntry = {
  id: string;
  name?: string;
  mark?: string;
  collection?: string;
  dex: number;
  form: string | null;
  keyword: string;
  sourceNumber?: number;
  note: string;
  shinyEligible: boolean;
  shinyReview: string;
  availability: string;
  normalEligible?: boolean;
  ownOtNormal: boolean;
  ownOtShiny: boolean;
  acquisitionCategory?: string;
  artId?: number | null;
  types?: string[];
  shinyArtStyle?: "home";
  gender?: "male" | "female";
};

const GO_SPECIES_WITH_SEPARATE_UNNAMED_BASE = new Set([128, 676, 720, 901]);
const GO_FORMS_THAT_DO_NOT_REACH_HOME = new Set(["647:Resolute", "718:0.1", "718:0.5"]);
const GO_ALCREMIE_CREAMS = ["Vanilla Cream", "Ruby Cream", "Matcha Cream", "Mint Cream", "Lemon Cream", "Salted Cream", "Ruby Swirl", "Caramel Swirl", "Rainbow Swirl"] as const;
const GO_ALCREMIE_SWEETS = ["Strawberry", "Berry", "Love", "Star", "Clover", "Flower", "Ribbon"] as const;
const GO_MINIOR_CORES = ["Red Core", "Orange Core", "Yellow Core", "Green Core", "Blue Core", "Indigo Core", "Violet Core"] as const;

function goFormSlug(form: string) {
  if (form === "!") return "exclamation";
  if (form === "?") return "question";
  return form.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Expands the GO planning collection with every distinct boxable form from the
 * normalized HOME catalog. Forms that revert or cannot be sent from GO are
 * intentionally omitted. The existing species entry becomes the first named
 * form unless the species also has a separate unnamed base form.
 */
export function addGoStorableForms<T extends CatalogEntry>(specialEntries: T[], catalogEntries: T[]) {
  const formsByDex = new Map<number, T[]>();
  for (const candidate of catalogEntries) {
    if (!candidate.form || candidate.availability === "excluded" || candidate.dex <= 0) continue;
    if (GO_FORMS_THAT_DO_NOT_REACH_HOME.has(`${candidate.dex}:${candidate.form}`)) continue;
    const forms = formsByDex.get(candidate.dex) ?? [];
    if (!forms.some((entry) => entry.form === candidate.form)) forms.push(candidate);
    formsByDex.set(candidate.dex, forms);
  }

  const alcremieTemplate = catalogEntries.find((entry) => entry.dex === 869);
  if (alcremieTemplate) {
    formsByDex.set(869, GO_ALCREMIE_CREAMS.flatMap((cream) => GO_ALCREMIE_SWEETS.map((sweet) => ({
      ...alcremieTemplate,
      form: `${cream}, ${sweet}`,
      artId: 869,
    } as T))));
  }
  const miniorTemplate = catalogEntries.find((entry) => entry.dex === 774);
  if (miniorTemplate) {
    formsByDex.set(774, GO_MINIOR_CORES.map((form, index) => ({
      ...miniorTemplate,
      form,
      artId: 10136 + index,
    } as T)));
  }

  const expanded: T[] = [];
  for (const entry of specialEntries) {
    if (entry.collection !== "go") {
      expanded.push(entry);
      continue;
    }
    const candidates = formsByDex.get(entry.dex) ?? [];
    const keepsUnnamedBase = GO_SPECIES_WITH_SEPARATE_UNNAMED_BASE.has(entry.dex);
    if (!candidates.length) {
      expanded.push(entry);
      continue;
    }

    const createFormEntry = (candidate: T, keepOriginalId: boolean) => {
      const form = candidate.form as string;
      return {
        ...entry,
        id: keepOriginalId ? entry.id : `go:${String(entry.dex).padStart(4, "0")}:${goFormSlug(form)}`,
        form,
        types: candidate.types ?? entry.types,
        artId: candidate.artId ?? entry.artId,
        shinyArtStyle: candidate.shinyArtStyle ?? entry.shinyArtStyle,
        keyword: `${entry.keyword}-${goFormSlug(form)}`,
      } as T;
    };

    if (keepsUnnamedBase) expanded.push(entry);
    candidates.forEach((candidate, index) => expanded.push(createFormEntry(candidate, !keepsUnnamedBase && index === 0)));
  }
  return expanded;
}

// These species evolve from non-regional forms in Legends: Arceus, preserving
// the Galar origin mark carried by the Pokémon obtained in Sword or Shield.
export const SWSH_HISUIAN_EVOLUTION_DEX = [549, 628, 705, 706, 713, 724] as const;

export function insertCatalogEntry<T extends CatalogEntry>(entries: T[], addition: T) {
  if (entries.some((entry) => entry.id === addition.id)) return entries;
  const insertionIndex = entries.findIndex((entry) => entry.mark === addition.mark && entry.dex > addition.dex);
  if (insertionIndex >= 0) return [...entries.slice(0, insertionIndex), addition, ...entries.slice(insertionIndex)];
  const lastMarkIndex = entries.map((entry) => entry.mark).lastIndexOf(addition.mark);
  return lastMarkIndex >= 0
    ? [...entries.slice(0, lastMarkIndex + 1), addition, ...entries.slice(lastMarkIndex + 1)]
    : [...entries, addition];
}

export function addSwShHisuianEvolutionEntries<T extends CatalogEntry>(entries: T[]) {
  let correctedEntries = entries;
  for (const dex of SWSH_HISUIAN_EVOLUTION_DEX) {
    const template = entries.find((entry) => entry.dex === dex && entry.form === "Hisuian");
    if (!template) continue;
    correctedEntries = insertCatalogEntry(correctedEntries, {
      ...template,
      id: `SwSh:${template.keyword}`,
      sourceNumber: undefined,
      mark: "SwSh",
      note: "Evolución en Legends: Arceus conservando la marca de origen de Sword / Shield",
      shinyEligible: true,
      shinyReview: "verified-correction",
      availability: "standard",
      normalEligible: true,
      ownOtNormal: true,
      ownOtShiny: true,
    });
  }
  return correctedEntries;
}

export function addStorableShayminSkyForms<T extends CatalogEntry>(entries: T[]) {
  let correctedEntries = entries;
  const landForms = entries.filter((entry) => entry.dex === 492 && entry.form !== "Sky");
  for (const template of landForms) {
    const origin = template.mark ?? "catalog";
    correctedEntries = insertCatalogEntry(correctedEntries, {
      ...template,
      id: `${origin}:shaymin-sky`,
      sourceNumber: undefined,
      form: "Sky",
      keyword: "shaymin-sky",
      artId: 10006,
      note: `${template.note} · Forma Cielo almacenable mediante Legends: Arceus y Pokémon HOME`,
      shinyReview: "verified-correction",
    });
  }
  return correctedEntries;
}

export function removeInvalidGbaKingambit<T extends CatalogEntry>(entries: T[]) {
  return entries.filter((entry) => !(entry.mark === "GBA" && entry.dex === 983));
}

export function markLgpeAlolanFormsAsInGameTrades<T extends CatalogEntry>(entries: T[]) {
  return entries.map((entry) => entry.mark === "LGPE" && entry.form === "Alolan" ? {
    ...entry,
    note: `${entry.note} · Forma de Alola obtenida mediante intercambio interno`,
    ownOtNormal: false,
    ownOtShiny: false,
    acquisitionCategory: "trade",
    shinyReview: "verified-correction",
  } : entry);
}

export function selectNormalLivingDexEntries<T extends { dex: number; variant: string }>(entries: T[]) {
  const selectedBySpecies = new Map<number, T>();
  for (const entry of entries) {
    const selected = selectedBySpecies.get(entry.dex);
    if (!selected || (selected.variant !== "normal" && entry.variant === "normal")) {
      selectedBySpecies.set(entry.dex, entry);
    }
  }
  return [...selectedBySpecies.values()].sort((left, right) => left.dex - right.dex);
}

export function correctBloodmoonUrsalunaDex<T extends CatalogEntry>(entries: T[]) {
  return entries.map((entry) => entry.dex === 0 && entry.name === "Ursaluna" && entry.form === "Bloodmoon"
    ? { ...entry, dex: 901 }
    : entry);
}
