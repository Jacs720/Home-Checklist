type CatalogEntry = {
  id: string;
  name?: string;
  mark?: string | null;
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
};

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
