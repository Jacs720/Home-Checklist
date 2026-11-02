import data from "../public/data/pokedex-orders.json";

export type PokedexOrder = "national" | "ingame";
export type PokedexOrganization = { order: PokedexOrder; onlyInGameDex: boolean };
export const DEFAULT_POKEDEX_ORGANIZATION: PokedexOrganization = { order: "national", onlyInGameDex: false };

export function parsePokedexOrganization(value: { pokedexOrder?: unknown; onlyInGameDex?: unknown }): PokedexOrganization {
  return { order: value.pokedexOrder === "ingame" ? "ingame" : "national", onlyInGameDex: value.onlyInGameDex === true };
}

// Shared marks use a deterministic union. Earlier Dex entries take precedence;
// expansions contribute only new species, with their original local numbers.
export const ORIGIN_POKEDEXES: Record<string, readonly string[]> = {
  "Sin marca": ["hoenn", "kanto", "extended-sinnoh", "updated-johto", "updated-unova"],
  GB: ["kanto", "original-johto"], GBA: ["hoenn", "kanto"],
  P: ["kalos-central", "kalos-coastal", "kalos-mountain", "updated-hoenn"],
  USUM: ["updated-alola"], LGPE: ["letsgo-kanto"],
  SwSh: ["galar", "isle-of-armor", "crown-tundra"],
  LA: ["hisui"], BDSP: ["original-sinnoh"],
  SV: ["paldea", "kitakami", "blueberry"], LZA: ["lumiose-city", "hyperspace"],
};
type DexReference = { id: string; number: number; section: number };
// These games also register species in their own National Pokédex.
// Later evolutions may retain the origin mark without being in that game's Dex.
const NATIONAL_POKEDEX_LIMITS: Record<string, number> = { "Sin marca": 649, GBA: 386, P: 721, BDSP: 493 };
const references = new Map<string, Map<number, DexReference>>();
const pokedexes = data.pokedexes as Record<string, { names: Record<string, string>; entries: number[][] }>;
for (const [mark, identifiers] of Object.entries(ORIGIN_POKEDEXES)) {
  const entries = new Map<number, DexReference>();
  identifiers.forEach((id, section) => {
    const dex = pokedexes[id];
    if (!dex) throw new Error(`Missing Pokédex ${id}`);
    for (const [species, number] of dex.entries) if (!entries.has(species)) entries.set(species, { id, number, section });
  });
  const nationalLimit = NATIONAL_POKEDEX_LIMITS[mark];
  if (nationalLimit) for (const [species, number] of pokedexes.national.entries) {
    if (species <= nationalLimit && !entries.has(species)) entries.set(species, { id: "national", number, section: identifiers.length });
  }
  references.set(mark, entries);
}

export function inGameDexReference(mark: string | undefined, dex: number) {
  return mark ? references.get(mark)?.get(dex) : undefined;
}

export function inGameDexName(id: string, language: string) {
  const names = pokedexes[id]?.names;
  return names?.[language] || (language === "ES-LA" ? names?.["ES-ES"] : undefined) || names?.ENG || id;
}

export function filterOriginPokedex<T extends { dex: number }>(entries: T[], mark: string, onlyInGameDex: boolean) {
  return onlyInGameDex && references.has(mark) ? entries.filter(entry => inGameDexReference(mark, entry.dex)) : entries;
}

/** Sorting never removes specimens, including those without a local Dex number. */
export function sortOriginPokedex<T extends { dex: number }>(entries: T[], mark: string, order: PokedexOrder) {
  if (!references.has(mark) || order === "national") return [{ entries, outside: false }];
  const inside: T[] = [], outside: T[] = [];
  for (const entry of entries) (inGameDexReference(mark, entry.dex) ? inside : outside).push(entry);
  inside.sort((a, b) => {
    const left = inGameDexReference(mark, a.dex)!, right = inGameDexReference(mark, b.dex)!;
    return left.section - right.section || left.number - right.number;
  });
  outside.sort((a, b) => a.dex - b.dex);
  return [{ entries: inside, outside: false }, ...(outside.length ? [{ entries: outside, outside: true }] : [])];
}

export function organizeOriginPokedex<T extends { dex: number }>(entries: T[], mark: string, options: PokedexOrganization) {
  return sortOriginPokedex(filterOriginPokedex(entries, mark, options.onlyInGameDex), mark, options.order);
}
