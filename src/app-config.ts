import type { Acquisition, AvailabilityFilters, FormOptions } from "./app-types";

export const MARKS = ["Sin marca", "GB", "P", "USUM", "LGPE", "SwSh", "LA", "BDSP", "SV", "LZA", "GBA"];
export const DEFAULT_MARKS = MARKS.filter((mark) => mark !== "GBA");
export const COLLECTIONS = ["n", "dream", "radar", "shadow-colosseum", "shadow-xd", "cherish", "event-dex", "trades", "go"];
export const DEFAULT_COLLECTIONS = COLLECTIONS.filter((collection) => collection !== "event-dex");
export const MYTHICAL_DEX = new Set([
  151,  // Mew
  251,  // Celebi
  385,  // Jirachi
  386,  // Deoxys
  489,  // Phione
  490,  // Manaphy
  491,  // Darkrai
  492,  // Shaymin
  493,  // Arceus
  494,  // Victini
  647,  // Keldeo
  648,  // Meloetta
  649,  // Genesect
  719,  // Diancie
  720,  // Hoopa
  721,  // Volcanion
  801,  // Magearna
  802,  // Marshadow
  807,  // Zeraora
  808,  // Meltan
  809,  // Melmetal
  893,  // Zarude
  1025, // Pecharunt
]);

export const DEFAULT_AVAILABILITY_FILTERS: AvailabilityFilters = { current: true, legacy: true, historical: true, hypothetical: true };
export const MARK_COLORS: Record<string, string> = {
  "Sin marca": "#9eb4b1", GB: "#e8cc67", P: "#74b7ea", USUM: "#b18bea", LGPE: "#efaa6f",
  SwSh: "#e57b9e", LA: "#72c8c2", BDSP: "#8fb5f2", SV: "#ef715f", LZA: "#68d2a4", GBA: "#c4e56f",
};
export const GROUP_COLORS: Record<string, string> = {
  ...MARK_COLORS,
  n: "#8f80de",
  dream: "#7ec8ad",
  radar: "#5fd0d6",
  "shadow-colosseum": "#8a76a6",
  "shadow-xd": "#6679a9",
  cherish: "#e76d83",
  "event-dex": "#ef718d",
  trades: "#e7a65f",
  go: "#57a6e6",
  "profile-final": "#d6b466",
  "profile-regional": "#8fc9f0",
  "profile-forms_lite": "#9a8fe6",
  "profile-noah": "#67c99b",
  "region-kanto": "#e86e64",
  "region-johto": "#dfb95a",
  "region-hoenn": "#7faedc",
  "region-sinnoh": "#9a91d2",
  "region-unova": "#a9b3b6",
  "region-kalos": "#67b8df",
  "region-alola": "#f19d64",
  "region-galar": "#db789d",
  "region-paldea": "#9b7dd1",
};
export const ORIGIN_MARK_ICONS: Record<string, string> = {
  GB: "GB_icon_HOME.png",
  P: "pentagon_HOME.png",
  USUM: "Black_clover_HOME.png",
  LGPE: "Let's_Go_icon_HOME.png",
  SwSh: "Galar_symbol_HOME.png",
  LA: "Arceus_mark_HOME.png",
  BDSP: "BDSP_icon_HOME.png",
  SV: "Paldea_icon_HOME.png",
  LZA: "Z-A_icon_HOME.png",
  GBA: "GBA_icon_HOME.png",
  go: "GO_icon_HOME.png",
};

export const STORAGE_KEY = "origin-marks-home-checklist-v1";
export const THEME_STORAGE_KEY = "origin-marks-box-themes-v1";
export const CATALOG_VERSION = 6;
export const BACKUP_VERSION = 9;
export const DEFAULT_FORM_OPTIONS: FormOptions = { alternate: true, alcremie: false, minior: false };
export const COLLECTION_ACQUISITIONS: Record<string, Acquisition> = {
  n: "trade",
  trades: "trade",
  cherish: "event",
  events: "event",
  "event-dex": "event",
  dream: "external",
  radar: "external",
  "shadow-colosseum": "external",
  "shadow-xd": "external",
  go: "external",
};
