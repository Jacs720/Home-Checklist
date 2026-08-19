import { ChangeEvent, CSSProperties, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BoxTheme,
  BoxThemeConfig,
  DEFAULT_BOX_THEME,
  EMPTY_THEME_CONFIG,
  THEME_GAMES,
  ThemeGame,
  boxThemeKey,
  boxThemeStyle,
  createPresetTheme,
  parseThemeConfig,
  resolveBoxTheme,
} from "./box-themes";
import { LANGUAGE_OPTIONS, UiLanguage, copy, formName, groupName } from "./translations";

type PokemonEntry = {
  id: string;
  sourceNumber?: number;
  mark?: string;
  collection?: string;
  name: string;
  dex: number;
  form: string | null;
  types: string[];
  keyword: string;
  note: string;
  artId: number | null;
  shinyArtStyle?: "home";
  shinyEligible: boolean;
  shinyReview: "verified-correction" | "pending";
  availability: "standard" | "hypothetical" | "excluded";
  normalEligible?: boolean;
  ownOtNormal: boolean;
  ownOtShiny: boolean;
  dataStatus?: "source-backed" | "approximate";
  sourceLabel?: string;
  sourceUrl?: string;
  displayDetail?: string;
  trainerName?: string;
  nickname?: string;
  partnerRibbon?: boolean;
  acquisitionCategory?: "own" | "trade" | "event" | "external";
  gender?: "male" | "female";
  genderDifferenceTier?: "notable" | "all";
  genderVariant?: "base" | "extra";
};

type Dataset = {
  meta: { title: string; sourceDate: string; entryCount: number; caveat: string };
  entries: PokemonEntry[];
};

type SpecialDataset = {
  meta: { title: string; generatedAt: string; entryCount: number; caveat: string; counts: Record<string, number> };
  entries: PokemonEntry[];
};
type PokemonNames = Record<string, Partial<Record<UiLanguage, string>>>;

type Variant = "shiny" | "normal";
type Acquisition = "own" | "trade" | "event" | "external";
type GenderMode = "notable" | "all";
type FormOptions = { alternate: boolean; alcremie: boolean; minior: boolean };
type ThemeScope = "all" | "mark" | "box";
type ThemeTab = ThemeGame | "custom";
type PlannedEntry = PokemonEntry & { planId: string; variant: Variant; groupKey: string; groupLabel: string; ownOt: boolean };
type PlannedBox = { globalIndex: number; groupKey: string; number: number; label: string; entries: PlannedEntry[] };

const MARKS = ["Sin marca", "GB", "P", "USUM", "LGPE", "SwSh", "LA", "BDSP", "SV", "LZA", "GBA"];
const DEFAULT_MARKS = MARKS.filter((mark) => mark !== "GBA");
const COLLECTIONS = ["n", "dream", "radar", "shadow-colosseum", "shadow-xd", "cherish", "trades", "go"];
const DEFAULT_COLLECTIONS = [...COLLECTIONS];
const MARK_COLORS: Record<string, string> = {
  "Sin marca": "#9eb4b1", GB: "#e8cc67", P: "#74b7ea", USUM: "#b18bea", LGPE: "#efaa6f",
  SwSh: "#e57b9e", LA: "#72c8c2", BDSP: "#8fb5f2", SV: "#ef715f", LZA: "#68d2a4", GBA: "#c4e56f",
};
const GROUP_COLORS: Record<string, string> = {
  ...MARK_COLORS,
  n: "#8f80de",
  dream: "#7ec8ad",
  radar: "#5fd0d6",
  "shadow-colosseum": "#8a76a6",
  "shadow-xd": "#6679a9",
  cherish: "#e76d83",
  trades: "#e7a65f",
  go: "#57a6e6",
};
const STORAGE_KEY = "origin-marks-home-checklist-v1";
const THEME_STORAGE_KEY = "origin-marks-box-themes-v1";
const CATALOG_VERSION = 6;
const DEFAULT_FORM_OPTIONS: FormOptions = { alternate: true, alcremie: false, minior: false };
const COLLECTION_ACQUISITIONS: Record<string, Acquisition> = {
  n: "trade",
  trades: "trade",
  cherish: "event",
  events: "event",
  dream: "external",
  radar: "external",
  "shadow-colosseum": "external",
  "shadow-xd": "external",
  go: "external",
};

function CompactCheckbox({ checked, onChange, accent }: { checked: boolean; onChange: () => void; accent: string }) {
  return <span className="compact-checkbox" style={{ "--checkbox-accent": accent } as CSSProperties}><input type="checkbox" checked={checked} onChange={onChange} /></span>;
}

function GooeyCheckbox({ id, checked, onChange }: { id: string; checked: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const filterId = `goo-${useId().replace(/:/g, "")}`;
  return (
    <span className="gooey-checkbox">
      <span className="gooey-control">
        <input id={id} type="checkbox" checked={checked} onChange={onChange} />
        <span className="gooey-splash" style={{ filter: `url(#${filterId})` }} />
        <svg className="gooey-check" width="15" height="14" viewBox="0 0 15 14" fill="none" aria-hidden="true"><path d="M2 8.36364L6.23077 12L13 2" /></svg>
      </span>
      <svg className="gooey-filter" aria-hidden="true"><defs><filter id={filterId}><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" result="goo" /><feBlend in="SourceGraphic" in2="goo" /></filter></defs></svg>
    </span>
  );
}

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

async function prepareThemeImage(file: File) {
  if (!/^image\/(?:png|jpeg|webp)$/i.test(file.type) || file.size > 12_000_000) throw new Error("invalid-image");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("invalid-image"));
    reader.onerror = () => reject(new Error("invalid-image"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("invalid-image"));
    element.src = source;
  });
  const scale = Math.min(1, 1600 / image.naturalWidth, 900 / image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("invalid-image");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let prepared = canvas.toDataURL("image/webp", .78);
  if (prepared.length > 3_000_000) prepared = canvas.toDataURL("image/webp", .58);
  if (prepared.length > 3_500_000) throw new Error("invalid-image");
  return prepared;
}

// In the base catalog, only Bulbapedia's ✔ combinations belong to the player-OT shiny list.
// Event and transfer shinies (marked ~) remain in special-collections.json with their external OT.
const OWN_OT_SHINY_LOCKS_BY_MARK: Record<string, ReadonlySet<number>> = {
  P: new Set([382, 383, 384, 386]),
  USUM: new Set([151, 251, 385, 386, 490, 491, 492, 493, 494, 647, 648, 649, 718, 719, 720, 721, 785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807, 808, 809]),
  LGPE: new Set([151, 808, 809]),
  SwSh: new Set([151, 251, 385, 386, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 772, 773, 789, 790, 801, 802, 803, 804, 807, 808, 809, 888, 889, 890, 891, 892, 893, 896, 897, 898, 905]),
  LA: new Set([480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 641, 642, 645, 905]),
  BDSP: new Set([151, 251, 385, 386, 490, 494, 647, 648, 649, 719, 720, 721, 772, 773, 789, 790, 801, 802, 803, 804, 807, 808, 809, 888, 889, 890, 891, 892, 893, 896, 897, 898, 905]),
  SV: new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 380, 381, 382, 383, 385, 386, 480, 481, 482, 483, 484, 485, 486, 487, 488, 490, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 807, 808, 809, 888, 889, 890, 891, 892, 893, 896, 897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017, 1020, 1021, 1022, 1023, 1024, 1025]),
  LZA: new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 382, 383, 384, 385, 386, 480, 481, 482, 483, 484, 485, 486, 487, 488, 490, 491, 492, 493, 494, 641, 642, 643, 644, 645, 646, 647, 648, 649, 716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 807, 808, 809, 888, 889, 890, 891, 892, 893, 896, 897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017, 1020, 1021, 1022, 1023, 1024, 1025]),
};

const FORM_SPECIFIC_OWN_OT_SHINY_LOCKS = new Set([
  "USUM:666:Fancy", "USUM:666:Poké Ball",
  "SwSh:144:Galarian", "SwSh:145:Galarian", "SwSh:146:Galarian",
  "SV:901:Bloodmoon", "SV:999:Roaming Form",
  "LZA:901:Bloodmoon", "LZA:999:Roaming Form",
]);
const WHITE_STRIPE_BASCULIN_MARKS = new Set(["LA", "SV"]);
const LZA_SHINY_VIVILLON_FORMS = new Set(["Garden", "Meadow"]);
const VIVILLON_FORM_ART_IDS: Record<string, number> = {
  Meadow: 666, "Icy Snow": 10086, Polar: 10087, Tundra: 10088, Continental: 10089, Garden: 10090, Elegant: 10091,
  Modern: 10092, Marine: 10093, Archipelago: 10094, "High Plains": 10095, Sandstorm: 10096, River: 10097,
  Monsoon: 10098, Savanna: 10099, Sun: 10100, Ocean: 10101, Jungle: 10102, Fancy: 10161, "Poké Ball": 10162,
};
const VIVILLON_FORM_ORDER = [
  "Icy Snow", "Polar", "Tundra", "Continental", "Garden", "Elegant", "Meadow", "Modern", "Marine", "Archipelago",
  "High Plains", "Sandstorm", "River", "Monsoon", "Savanna", "Sun", "Ocean", "Jungle", "Fancy", "Poké Ball",
] as const;
const VIVILLON_FORM_INDEX = new Map<string, number>(VIVILLON_FORM_ORDER.map((form, index) => [form, index]));
const FURFROU_TRIM_ART_IDS = [
  ["Heart", 10067], ["Star", 10068], ["Diamond", 10069], ["Debutante", 10070], ["Matron", 10071],
  ["Dandy", 10072], ["La Reine", 10073], ["Kabuki", 10074], ["Pharaoh", 10075],
] as const;
const FURFROU_FORM_INDEX = new Map<string, number>([["", 0], ...FURFROU_TRIM_ART_IDS.map(([form], index) => [form, index + 1] as [string, number])]);
const ALCREMIE_CREAMS = ["Vanilla Cream", "Ruby Cream", "Matcha Cream", "Mint Cream", "Lemon Cream", "Salted Cream", "Ruby Swirl", "Caramel Swirl", "Rainbow Swirl"] as const;
const ALCREMIE_SWEETS = ["Strawberry", "Berry", "Love", "Star", "Clover", "Flower", "Ribbon"] as const;
const MINIOR_CORES = ["Red Core", "Orange Core", "Yellow Core", "Green Core", "Blue Core", "Indigo Core", "Violet Core"] as const;

function expandCollectibleForms(entries: PokemonEntry[]) {
  const expanded: PokemonEntry[] = [];
  const processed = new Set<string>();
  for (const entry of entries) {
    if (entry.dex !== 869 && entry.dex !== 774) {
      expanded.push(entry);
      continue;
    }
    const speciesKey = `${entry.mark ?? entry.collection ?? "catalog"}:${entry.dex}`;
    if (processed.has(speciesKey)) continue;
    processed.add(speciesKey);
    const templates = entries.filter((candidate) => candidate.dex === entry.dex && candidate.mark === entry.mark && candidate.collection === entry.collection);
    if (entry.dex === 869) {
      ALCREMIE_CREAMS.forEach((cream, creamIndex) => ALCREMIE_SWEETS.forEach((sweet, sweetIndex) => {
        const existing = sweetIndex === 0 ? templates.find((candidate) => candidate.form === `${cream}, Strawberry`) : undefined;
        const template = existing ?? templates[0] ?? entry;
        const legacySuffix = creamIndex === 0 ? "" : `-${creamIndex}`;
        const idSuffix = sweetIndex === 0 ? legacySuffix : `-${creamIndex}-${sweetIndex}`;
        expanded.push({
          ...template,
          id: `${entry.mark ?? entry.collection ?? "catalog"}:alcremie${idSuffix}`,
          sourceNumber: existing?.sourceNumber,
          form: `${cream}, ${sweet}`,
          artId: 869,
          keyword: `alcremie-${creamIndex}-${sweetIndex}`,
          note: `${template.note} · combinación de crema y dulce conservada en HOME`,
        });
      }));
      continue;
    }
    MINIOR_CORES.forEach((form, index) => {
      const template = templates.find((candidate) => candidate.form === form) ?? templates[0] ?? entry;
      expanded.push({
        ...template,
        id: index === 0 ? entry.id : `${entry.mark ?? entry.collection ?? "catalog"}:minior-${index}`,
        sourceNumber: index === 0 ? template.sourceNumber : undefined,
        form,
        artId: 10136 + index,
        keyword: `minior-${index}`,
        note: `${template.note} · color de núcleo conservado en HOME`,
      });
    });
  }
  return expanded;
}

function insertCatalogEntry(entries: PokemonEntry[], addition: PokemonEntry) {
  if (entries.some((entry) => entry.id === addition.id)) return entries;
  const insertionIndex = entries.findIndex((entry) => entry.mark === addition.mark && entry.dex > addition.dex);
  if (insertionIndex >= 0) return [...entries.slice(0, insertionIndex), addition, ...entries.slice(insertionIndex)];
  const lastMarkIndex = entries.map((entry) => entry.mark).lastIndexOf(addition.mark);
  return lastMarkIndex >= 0
    ? [...entries.slice(0, lastMarkIndex + 1), addition, ...entries.slice(lastMarkIndex + 1)]
    : [...entries, addition];
}

function applyCatalogCorrections(entries: PokemonEntry[]) {
  let correctedEntries = expandCollectibleForms(entries);
  const phioneTemplate = entries.find((entry) => entry.dex === 489);
  if (phioneTemplate) {
    const breedingMarks: Record<string, string> = {
      P: "Crianza en X/Y u ORAS · huevo con tu OT",
      USUM: "Crianza en SM/USUM · huevo con tu OT",
      BDSP: "Crianza en BDSP · huevo con tu OT",
    };
    for (const [mark, note] of Object.entries(breedingMarks)) {
      correctedEntries = insertCatalogEntry(correctedEntries, {
        ...phioneTemplate, id: `${mark}:phione`, sourceNumber: undefined, mark, note,
        shinyEligible: true, shinyReview: "verified-correction", availability: "standard",
        normalEligible: true, ownOtNormal: true, ownOtShiny: true,
      });
    }
  }

  for (const dex of [491, 492]) {
    const template = entries.find((entry) => entry.dex === dex);
    if (!template) continue;
    correctedEntries = insertCatalogEntry(correctedEntries, {
      ...template,
      id: `BDSP:${template.keyword}`,
      sourceNumber: undefined,
      mark: "BDSP",
      note: dex === 491
        ? "BDSP · Carné Socio por regalo misterioso · Newmoon Island · captura con tu OT"
        : "BDSP · Carta del Prof. Oak por regalo misterioso · Flower Paradise · captura con tu OT",
      shinyEligible: true,
      shinyReview: "verified-correction",
      availability: "standard",
      normalEligible: true,
      ownOtNormal: true,
      ownOtShiny: true,
    });
  }

  for (const mark of ["P", "USUM"]) {
    const base = correctedEntries.find((entry) => entry.id === `${mark}:furfrou`);
    if (!base) continue;
    FURFROU_TRIM_ART_IDS.forEach(([form, artId], index) => {
      correctedEntries = insertCatalogEntry(correctedEntries, {
        ...base, id: `${mark}:furfrou-${index + 1}`, sourceNumber: undefined, form, artId,
        keyword: `furfrou-${index + 1}`, note: `${base.note} · corte conservado en cajas mediante Legends: Z-A`,
      });
    });
  }

  return correctedEntries.map((entry) => {
    let correctedEntry = entry;
    if (correctedEntry.dex === 678 && correctedEntry.gender === "female") {
      correctedEntry = { ...correctedEntry, artId: 10025, shinyArtStyle: "home" as const };
    }
    const vivillonForm = correctedEntry.dex === 666 ? correctedEntry.form : null;
    if (vivillonForm && VIVILLON_FORM_ART_IDS[vivillonForm]) {
      correctedEntry = { ...correctedEntry, artId: VIVILLON_FORM_ART_IDS[vivillonForm] };
      if (correctedEntry.mark === "LZA" && !LZA_SHINY_VIVILLON_FORMS.has(vivillonForm)) {
        return { ...correctedEntry, shinyEligible: false, ownOtShiny: false, shinyReview: "verified-correction" as const };
      }
    }
    if (correctedEntry.dex === 676 && correctedEntry.form) {
      const trimArtId = FURFROU_TRIM_ART_IDS.find(([form]) => form === correctedEntry.form)?.[1];
      if (trimArtId) correctedEntry = { ...correctedEntry, artId: trimArtId };
    }
    if (correctedEntry.mark === "GBA" && correctedEntry.dex === 385) {
      return { ...correctedEntry, availability: "excluded" as const, shinyEligible: false, ownOtShiny: false, shinyReview: "verified-correction" as const };
    }
    if (correctedEntry.dex === 670 && correctedEntry.form === "Eternal Flower") {
      return {
        ...correctedEntry,
        availability: correctedEntry.mark === "LZA" ? "standard" as const : "excluded" as const,
        shinyEligible: false,
        ownOtShiny: false,
        shinyReview: "verified-correction" as const,
      };
    }
    if (correctedEntry.dex === 550 && correctedEntry.form === "White Stripe" && !WHITE_STRIPE_BASCULIN_MARKS.has(correctedEntry.mark ?? "")) {
      return { ...correctedEntry, availability: "excluded" as const, shinyEligible: false, ownOtShiny: false, shinyReview: "verified-correction" as const };
    }
    const formKey = `${correctedEntry.mark}:${correctedEntry.dex}:${correctedEntry.form ?? ""}`;
    const isLocked = Boolean(correctedEntry.mark && OWN_OT_SHINY_LOCKS_BY_MARK[correctedEntry.mark]?.has(correctedEntry.dex)) || FORM_SPECIFIC_OWN_OT_SHINY_LOCKS.has(formKey);
    if (!isLocked) return correctedEntry;
    return { ...correctedEntry, shinyEligible: false, ownOtShiny: false, shinyReview: "verified-correction" as const };
  });
}

function buildBoxes(
  entries: PokemonEntry[],
  specialEntries: PokemonEntry[],
  selectedMarks: string[],
  selectedCollections: string[],
  variants: Record<Variant, boolean>,
  acquisitions: Record<Acquisition, boolean>,
  includeNonShinySpecials: boolean,
  genderMode: GenderMode,
  formOptions: FormOptions,
  language: UiLanguage,
) {
  const boxes: PlannedBox[] = [];
  const groups = [
    ...MARKS.filter((mark) => selectedMarks.includes(mark)).map((key) => ({
      key,
      label: groupName(language, key),
      entries: [...entries.filter((entry) => entry.mark === key), ...specialEntries.filter((entry) => entry.collection === "events" && entry.mark === key)],
      special: false,
    })),
    ...COLLECTIONS.filter((collection) => selectedCollections.includes(collection)).map((key) => ({ key, label: groupName(language, key), entries: specialEntries.filter((entry) => entry.collection === key), special: true })),
  ];

  for (const group of groups) {
    const planned: PlannedEntry[] = [];
    const seenSpecies = new Set<string>();
    for (const entry of group.entries) {
      if (entry.availability === "excluded") continue;
      if (entry.genderVariant === "extra" && entry.genderDifferenceTier === "all" && genderMode !== "all") continue;
      const speciesKey = `${entry.mark ?? entry.collection ?? group.key}:${entry.dex}:${entry.genderVariant ?? "species"}`;
      const firstSpeciesEntry = !seenSpecies.has(speciesKey);
      seenSpecies.add(speciesKey);
      if (!entry.collection && !firstSpeciesEntry) {
        if (entry.dex === 869 && !formOptions.alcremie) continue;
        if (entry.dex === 774 && !formOptions.minior) continue;
        if (entry.dex !== 869 && entry.dex !== 774 && !formOptions.alternate) continue;
      }
      const includeAsNormal = entry.normalEligible !== false && (variants.normal || (group.special && variants.shiny && includeNonShinySpecials && !entry.shinyEligible));
      if (includeAsNormal) {
        const ownOt = entry.ownOtNormal;
        const acquisition = entry.acquisitionCategory ?? COLLECTION_ACQUISITIONS[entry.collection ?? ""] ?? (ownOt ? "own" : "event");
        if (acquisitions[acquisition]) {
          planned.push({ ...entry, variant: "normal", ownOt, groupKey: group.key, groupLabel: group.label, planId: `${entry.id}:normal` });
        }
      }
      if (variants.shiny && entry.shinyEligible) {
        const ownOt = entry.ownOtShiny;
        const acquisition = entry.acquisitionCategory ?? COLLECTION_ACQUISITIONS[entry.collection ?? ""] ?? (ownOt ? "own" : "event");
        if (acquisitions[acquisition]) {
          planned.push({ ...entry, variant: "shiny", ownOt, groupKey: group.key, groupLabel: group.label, planId: `${entry.id}:shiny` });
        }
      }
    }
    chunk(planned, 30).forEach((boxEntries, index) => {
      boxes.push({ globalIndex: boxes.length, groupKey: group.key, number: index + 1, label: `${group.label} ${String(index + 1).padStart(2, "0")}`, entries: boxEntries });
    });
  }
  return boxes;
}

function unownSpriteKey(form: string | null) {
  if (form === "!") return "exclamation";
  if (form === "?") return "question";
  return form?.toLowerCase() ?? null;
}

function pokemonArtworkUrl(entry: PlannedEntry) {
  if (!entry.artId) return null;
  const vivillonIndex = entry.dex === 666 && entry.form ? VIVILLON_FORM_INDEX.get(entry.form) : undefined;
  const furfrouIndex = entry.dex === 676 ? FURFROU_FORM_INDEX.get(entry.form ?? "") : undefined;
  const alcremieCream = entry.dex === 869 && entry.form ? ALCREMIE_CREAMS.findIndex((cream) => entry.form?.startsWith(`${cream}, `)) : -1;
  const alcremieSweet = entry.dex === 869 && entry.form ? ALCREMIE_SWEETS.findIndex((sweet) => entry.form?.endsWith(`, ${sweet}`)) : -1;
  let customKey: string | null = null;
  if (vivillonIndex !== undefined) customKey = `0666-${String(vivillonIndex).padStart(2, "0")}`;
  if (furfrouIndex !== undefined) customKey = `0676-${String(furfrouIndex).padStart(2, "0")}`;
  if (alcremieCream >= 0 && alcremieSweet >= 0) customKey = entry.variant === "shiny" ? `0869-shiny-${alcremieSweet}` : `0869-${alcremieCream}-${alcremieSweet}`;
  if (entry.dex === 774 && entry.variant === "shiny") customKey = "10136";
  if (customKey) return assetUrl(`assets/pokemon/${entry.variant}/${customKey}.webp`);
  const unownForm = entry.dex === 201 ? unownSpriteKey(entry.form) : null;
  const suffix = unownForm ? `-${unownForm}` : entry.genderVariant === "extra" ? "-female" : "";
  const filename = `${String(entry.artId).padStart(4, "0")}${suffix}.webp`;
  return assetUrl(`assets/pokemon/${entry.variant}/${filename}`);
}

function PokemonArtwork({ entry, owned, displayName, language }: { entry: PlannedEntry; owned: boolean; displayName: string; language: UiLanguage }) {
  const [failed, setFailed] = useState(false);
  const url = pokemonArtworkUrl(entry);

  if (!url || failed) return <span className="art-placeholder" aria-label={copy(language, "official_art_pending")} />;
  return <img className="pokemon-art" src={url} alt={`${copy(language, "official_art")} ${displayName}`} onError={() => setFailed(true)} data-owned={owned} />;
}

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [specialDataset, setSpecialDataset] = useState<SpecialDataset | null>(null);
  const [pokemonNames, setPokemonNames] = useState<PokemonNames | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState<string[]>(DEFAULT_MARKS);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(DEFAULT_COLLECTIONS);
  const [variants, setVariants] = useState<Record<Variant, boolean>>({ shiny: true, normal: false });
  const [acquisitions, setAcquisitions] = useState<Record<Acquisition, boolean>>({ own: true, trade: true, event: true, external: true });
  const [includeNonShinySpecials, setIncludeNonShinySpecials] = useState(true);
  const [genderMode, setGenderMode] = useState<GenderMode>("notable");
  const [formOptions, setFormOptions] = useState<FormOptions>(DEFAULT_FORM_OPTIONS);
  const [language, setLanguage] = useState<UiLanguage>("ES-LA");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [capacity, setCapacity] = useState<6000 | 8000>(6000);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState<BoxThemeConfig>(EMPTY_THEME_CONFIG);
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeScope, setThemeScope] = useState<ThemeScope>("all");
  const [themeTab, setThemeTab] = useState<ThemeTab>("swsh");
  const [themeDraft, setThemeDraft] = useState<BoxTheme>(DEFAULT_BOX_THEME);
  const [customThemeDraft, setCustomThemeDraft] = useState<BoxTheme | null>(null);
  const [customColors, setCustomColors] = useState({ appColor: "#102e2a", primary: "#55e0c0", secondary: "#f3c857" });
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const themeImportRef = useRef<HTMLInputElement>(null);
  const themeImageRef = useRef<HTMLInputElement>(null);
  const languageOption = LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];
  const locale = languageOption.locale;
  const t = (key: string) => copy(language, key);
  const displayThemeName = (theme: BoxTheme) => theme.kind === "default" ? t("original_theme") : theme.kind === "custom" ? t("custom") : THEME_GAMES.find((game) => game.id === theme.game)?.label ?? theme.game;
  const displayName = (entry: PokemonEntry) => pokemonNames?.[String(entry.dex)]?.[language] ?? entry.name;
  const displayForm = (entry: PokemonEntry) => formName(language, entry.dex, entry.form);
  const displayNote = (entry: PokemonEntry) => language === "ES-ES"
    ? entry.note.replace(/shiny/gi, "variocolor")
    : language === "ES-LA" ? entry.note.replace(/shiny/gi, "brillante") : entry.note;

  useEffect(() => {
    Promise.all([fetch(assetUrl("data/pokemon-lite.json")), fetch(assetUrl("data/special-collections.json")), fetch(assetUrl("data/pokemon-names.json"))])
      .then(async ([baseResponse, specialResponse, namesResponse]) => {
        if (!baseResponse.ok || !specialResponse.ok || !namesResponse.ok) throw new Error("data");
        return Promise.all([baseResponse.json(), specialResponse.json(), namesResponse.json()]);
      })
      .then(([baseValue, specialValue, namesValue]: [Dataset, SpecialDataset, PokemonNames]) => {
        setDataset({ ...baseValue, entries: applyCatalogCorrections(baseValue.entries) });
        setSpecialDataset(specialValue);
        setPokemonNames(namesValue);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const value = JSON.parse(saved);
        if (Array.isArray(value.owned)) setOwned(new Set(value.owned));
        if (Array.isArray(value.selectedMarks)) setSelectedMarks(value.selectedMarks.filter((mark: string) => MARKS.includes(mark)));
        if (Array.isArray(value.selectedCollections)) {
          const savedCollections = value.selectedCollections.filter((collection: string) => COLLECTIONS.includes(collection));
          setSelectedCollections(value.catalogVersion >= CATALOG_VERSION ? savedCollections : [...new Set([...savedCollections, "radar"])]);
        }
        if (value.variants) setVariants({ shiny: Boolean(value.variants.shiny), normal: Boolean(value.variants.normal) });
        if (value.acquisitions) setAcquisitions({
          own: Boolean(value.acquisitions.own),
          trade: typeof value.acquisitions.trade === "boolean" ? value.acquisitions.trade : true,
          event: Boolean(value.acquisitions.event),
          external: typeof value.acquisitions.external === "boolean" ? value.acquisitions.external : true,
        });
        if (typeof value.includeNonShinySpecials === "boolean") setIncludeNonShinySpecials(value.includeNonShinySpecials);
        if (value.genderMode === "notable" || value.genderMode === "all") setGenderMode(value.genderMode);
        if (value.formOptions) setFormOptions({
          alternate: typeof value.formOptions.alternate === "boolean" ? value.formOptions.alternate : DEFAULT_FORM_OPTIONS.alternate,
          alcremie: typeof value.formOptions.alcremie === "boolean" ? value.formOptions.alcremie : DEFAULT_FORM_OPTIONS.alcremie,
          minior: typeof value.formOptions.minior === "boolean" ? value.formOptions.minior : DEFAULT_FORM_OPTIONS.minior,
        });
        if (LANGUAGE_OPTIONS.some((option) => option.code === value.language)) setLanguage(value.language);
        if (value.capacity === 6000 || value.capacity === 8000) setCapacity(value.capacity);
      }
      const savedThemes = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemes) {
        const parsedThemes = parseThemeConfig(JSON.parse(savedThemes));
        if (parsedThemes) setThemeConfig(parsedThemes);
      }
    } catch { /* A damaged local backup should never block the app. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ catalogVersion: CATALOG_VERSION, owned: [...owned], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, formOptions, language, capacity }));
  }, [owned, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, formOptions, language, capacity, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfig)); }
    catch { window.alert(copy(language, "theme_storage_error")); }
  }, [themeConfig, hydrated, language]);

  useEffect(() => {
    if (!themeOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setThemeOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [themeOpen]);

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? "es-MX";
  }, [language]);

  const boxes = useMemo(
    () => buildBoxes(dataset?.entries ?? [], specialDataset?.entries ?? [], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, formOptions, language),
    [dataset, specialDataset, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, formOptions, language],
  );
  const plannedEntries = useMemo(() => boxes.flatMap((box) => box.entries), [boxes]);
  const capacityBoxes = Math.ceil(capacity / 30);
  const totalPages = Math.max(1, Math.ceil(Math.max(boxes.length, capacityBoxes) / 30));
  const ownedCount = useMemo(() => plannedEntries.reduce((sum, entry) => sum + Number(owned.has(entry.planId)), 0), [plannedEntries, owned]);
  const progress = plannedEntries.length ? Math.round((ownedCount / plannedEntries.length) * 100) : 0;
  const selectedBox = selectedBoxIndex === null ? null : boxes[selectedBoxIndex];
  const activeBoxTheme = selectedBox ? resolveBoxTheme(themeConfig, selectedBox.groupKey, selectedBox.number) : themeConfig.global;
  const pageBoxes = Array.from({ length: 30 }, (_, offset) => boxes[pageIndex * 30 + offset] ?? null);
  const filterKey = `${selectedMarks.join("|")}:${selectedCollections.join("|")}:${variants.shiny}:${variants.normal}:${acquisitions.own}:${acquisitions.trade}:${acquisitions.event}:${acquisitions.external}:${includeNonShinySpecials}:${genderMode}:${formOptions.alternate}:${formOptions.alcremie}:${formOptions.minior}`;

  useEffect(() => {
    setPageIndex(0);
    setSelectedBoxIndex(null);
  }, [filterKey]);
  useEffect(() => setPageIndex((current) => Math.min(current, totalPages - 1)), [totalPages]);

  const matchesSearch = (entry: PlannedEntry) => {
    const matchesQuery = !query || normalize(`${displayName(entry)} ${entry.name} ${displayForm(entry) ?? ""} ${entry.form ?? ""} ${entry.gender ? t(entry.gender) : ""} ${entry.dex} ${entry.mark ?? ""} ${entry.groupLabel} ${entry.trainerName ?? ""} ${entry.nickname ?? ""} ${entry.ownOt ? t("your_ot") : t("foreign_ot")}`).includes(normalize(query));
    return matchesQuery && (!missingOnly || !owned.has(entry.planId));
  };

  const toggleOwned = (planId: string) => setOwned((current) => {
    const next = new Set(current);
    if (next.has(planId)) next.delete(planId); else next.add(planId);
    return next;
  });

  const toggleEntries = (entries: PlannedEntry[]) => setOwned((current) => {
    const next = new Set(current);
    const allOwned = entries.length > 0 && entries.every((entry) => next.has(entry.planId));
    entries.forEach((entry) => allOwned ? next.delete(entry.planId) : next.add(entry.planId));
    return next;
  });

  const toggleMark = (mark: string) => setSelectedMarks((current) => current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark]);
  const toggleCollection = (collection: string) => setSelectedCollections((current) => current.includes(collection) ? current.filter((item) => item !== collection) : [...current, collection]);
  const setVariant = (variant: Variant) => setVariants((current) => {
    const next = { ...current, [variant]: !current[variant] };
    return next.shiny || next.normal ? next : current;
  });
  const setAcquisition = (acquisition: Acquisition) => setAcquisitions((current) => {
    const next = { ...current, [acquisition]: !current[acquisition] };
    return next.own || next.trade || next.event || next.external ? next : current;
  });

  const applyPreset = (preset: "shiny" | "special" | "normal") => {
    if (preset === "shiny") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); }
    if (preset === "special") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: true, event: true, external: true }); setIncludeNonShinySpecials(true); setSelectedMarks([]); setSelectedCollections(DEFAULT_COLLECTIONS); }
    if (preset === "normal") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); }
  };

  const openThemeDialog = () => {
    const current = selectedBox ? resolveBoxTheme(themeConfig, selectedBox.groupKey, selectedBox.number) : themeConfig.global;
    setThemeScope(selectedBox ? "box" : "all");
    setThemeDraft(current);
    if (current.kind === "preset") setThemeTab(current.game);
    if (current.kind === "custom") {
      setThemeTab("custom");
      setCustomThemeDraft(current);
      setCustomColors({ appColor: current.appColor, primary: current.primary, secondary: current.secondary });
    }
    setThemeOpen(true);
  };

  const chooseThemeTab = (tab: ThemeTab) => {
    setThemeTab(tab);
    if (tab === "custom") {
      if (customThemeDraft?.kind === "custom") setThemeDraft(customThemeDraft);
      return;
    }
    setThemeDraft(createPresetTheme(tab));
  };

  const chooseWallpaper = (game: ThemeGame, wallpaper: string) => {
    setThemeTab(game);
    setThemeDraft(createPresetTheme(game, wallpaper));
  };

  const importCustomThemeImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const wallpaper = await prepareThemeImage(file);
      const customTheme: BoxTheme = { kind: "custom", wallpaper, ...customColors };
      setCustomThemeDraft(customTheme);
      setThemeDraft(customTheme);
      setThemeTab("custom");
    } catch { window.alert(t("theme_image_error")); }
    event.target.value = "";
  };

  const updateCustomColor = (key: "appColor" | "primary" | "secondary", value: string) => {
    setCustomColors((current) => ({ ...current, [key]: value }));
    setCustomThemeDraft((current) => current?.kind === "custom" ? { ...current, [key]: value } : current);
    setThemeDraft((current) => current.kind === "custom" ? { ...current, [key]: value } : current);
  };

  const applyBoxTheme = () => {
    if (themeTab === "custom" && themeDraft.kind !== "custom") return;
    setThemeConfig((current) => {
      if (themeScope === "all") return { global: themeDraft, marks: {}, boxes: {} };
      if (!selectedBox) return current;
      if (themeScope === "mark") {
        const prefix = `${selectedBox.groupKey}:`;
        return { ...current, marks: { ...current.marks, [selectedBox.groupKey]: themeDraft }, boxes: Object.fromEntries(Object.entries(current.boxes).filter(([key]) => !key.startsWith(prefix))) };
      }
      return { ...current, boxes: { ...current.boxes, [boxThemeKey(selectedBox.groupKey, selectedBox.number)]: themeDraft } };
    });
    setThemeOpen(false);
  };

  const resetBoxTheme = () => {
    setThemeConfig((current) => {
      if (themeScope === "all") return { global: DEFAULT_BOX_THEME, marks: {}, boxes: {} };
      if (!selectedBox) return current;
      if (themeScope === "mark") {
        const prefix = `${selectedBox.groupKey}:`;
        return { ...current, marks: { ...current.marks, [selectedBox.groupKey]: DEFAULT_BOX_THEME }, boxes: Object.fromEntries(Object.entries(current.boxes).filter(([key]) => !key.startsWith(prefix))) };
      }
      return { ...current, boxes: { ...current.boxes, [boxThemeKey(selectedBox.groupKey, selectedBox.number)]: DEFAULT_BOX_THEME } };
    });
    setThemeDraft(DEFAULT_BOX_THEME);
    setThemeOpen(false);
  };

  const exportBackup = () => {
    const payload = { version: 6, catalogVersion: CATALOG_VERSION, exportedAt: new Date().toISOString(), owned: [...owned], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, formOptions, language, capacity };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    link.download = "origin-marks-checklist-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportThemeBackup = () => {
    const payload = { type: "origin-marks-box-themes", version: 1, exportedAt: new Date().toISOString(), themes: themeConfig };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    link.download = "origin-marks-themes-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importThemeBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const value = JSON.parse(text);
        if (value.type !== "origin-marks-box-themes") throw new Error("invalid");
        const themes = parseThemeConfig(value.themes);
        if (!themes) throw new Error("invalid");
        setThemeConfig(themes);
      } catch { window.alert(t("invalid_theme_backup")); }
    });
    event.target.value = "";
  };

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const value = JSON.parse(text);
        if (!Array.isArray(value.owned)) throw new Error("invalid");
        setOwned(new Set(value.owned.filter((id: unknown) => typeof id === "string")));
        if (Array.isArray(value.selectedMarks)) setSelectedMarks(value.selectedMarks.filter((mark: string) => MARKS.includes(mark)));
        if (Array.isArray(value.selectedCollections)) {
          const savedCollections = value.selectedCollections.filter((collection: string) => COLLECTIONS.includes(collection));
          setSelectedCollections(value.catalogVersion >= CATALOG_VERSION ? savedCollections : [...new Set([...savedCollections, "radar"])]);
        }
        if (value.variants) setVariants({ shiny: Boolean(value.variants.shiny), normal: Boolean(value.variants.normal) });
        if (value.acquisitions) setAcquisitions({
          own: Boolean(value.acquisitions.own),
          trade: typeof value.acquisitions.trade === "boolean" ? value.acquisitions.trade : true,
          event: Boolean(value.acquisitions.event),
          external: typeof value.acquisitions.external === "boolean" ? value.acquisitions.external : true,
        });
        if (typeof value.includeNonShinySpecials === "boolean") setIncludeNonShinySpecials(value.includeNonShinySpecials);
        if (value.genderMode === "notable" || value.genderMode === "all") setGenderMode(value.genderMode);
        if (value.formOptions) setFormOptions({
          alternate: typeof value.formOptions.alternate === "boolean" ? value.formOptions.alternate : DEFAULT_FORM_OPTIONS.alternate,
          alcremie: typeof value.formOptions.alcremie === "boolean" ? value.formOptions.alcremie : DEFAULT_FORM_OPTIONS.alcremie,
          minior: typeof value.formOptions.minior === "boolean" ? value.formOptions.minior : DEFAULT_FORM_OPTIONS.minior,
        });
        if (LANGUAGE_OPTIONS.some((option) => option.code === value.language)) setLanguage(value.language);
        if (value.capacity === 6000 || value.capacity === 8000) setCapacity(value.capacity);
      } catch { window.alert(t("invalid_backup")); }
    });
    event.target.value = "";
  };

  if (loadError) return <main className="state-screen"><img className="brand-ball" src={assetUrl("assets/strange-ball.png")} alt="" /><h1>{t("load_error")}</h1><p>{t("reload")}</p></main>;
  if (!dataset || !specialDataset || !pokemonNames) return <main className="state-screen"><img className="brand-ball loading" src={assetUrl("assets/strange-ball.png")} alt="" /><p>{t("loading")}</p></main>;

  const markCounts = Object.fromEntries(MARKS.map((mark) => {
    const entriesForMark = buildBoxes(dataset.entries, specialDataset.entries, [mark], [], variants, acquisitions, includeNonShinySpecials, genderMode, formOptions, language).flatMap((box) => box.entries);
    return [mark, entriesForMark.length];
  }));
  const collectionCounts = Object.fromEntries(COLLECTIONS.map((collection) => {
    const entriesForCollection = buildBoxes([], specialDataset.entries, [], [collection], variants, acquisitions, includeNonShinySpecials, genderMode, formOptions, language).flatMap((box) => box.entries);
    return [collection, entriesForCollection.length];
  }));
  const visiblePageEntries = pageBoxes.flatMap((box) => box?.entries ?? []);
  const pageAllOwned = visiblePageEntries.length > 0 && visiblePageEntries.every((entry) => owned.has(entry.planId));
  const themeGameOption = themeTab === "custom" ? null : THEME_GAMES.find((game) => game.id === themeTab) ?? THEME_GAMES[0];
  const themeCanApply = themeTab !== "custom" || themeDraft.kind === "custom";

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mobile-filter" onClick={() => setFiltersOpen(true)} aria-label={t("open_filters")}>☰</button>
        <div className="brand-lockup"><a className="brand-link" href="https://github.com/Jacs720/Home-Checklist" target="_blank" rel="noreferrer" aria-label={t("github_repo")}><img className="brand-ball" src={assetUrl("assets/strange-ball.png")} alt="" /></a><h1>Home checklist</h1></div>
        <div className="top-actions">
          <div className="language-menu">
            <button className="language-trigger" type="button" aria-label={t("language")} aria-expanded={languageOpen} onClick={() => setLanguageOpen((value) => !value)}>
              <img src={assetUrl(`languages/${language}.png`)} alt="" /><span>{languageOption.label}</span><b>⌄</b>
            </button>
            {languageOpen && <div className="language-options" role="listbox" aria-label={t("language")}>
              {LANGUAGE_OPTIONS.map((option) => <button type="button" role="option" aria-selected={language === option.code} className={language === option.code ? "active" : ""} key={option.code} onClick={() => { setLanguage(option.code); setLanguageOpen(false); }}><img src={assetUrl(`languages/${option.code}.png`)} alt="" /><span>{option.label}</span></button>)}
            </div>}
          </div>
          <div className="progress-summary" aria-label={`${progress}%`}>
            <div><strong>{ownedCount.toLocaleString(locale)}</strong><span>{t("of")} {plannedEntries.length.toLocaleString(locale)}</span></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div><b>{progress}%</b>
          </div>
        </div>
      </header>

      {themeOpen && (
        <div className="theme-modal-layer">
          <button className="theme-modal-scrim" aria-label={t("close_theme")} onClick={() => setThemeOpen(false)} />
          <section className="theme-dialog" role="dialog" aria-modal="true" aria-labelledby="theme-dialog-title">
            <header className="theme-dialog-header">
              <div><p className="eyebrow teal">{t("box_appearance")}</p><h2 id="theme-dialog-title">{t("theme_title")}</h2><p>{t("theme_intro")}</p></div>
              <button className="theme-close" aria-label={t("close_theme")} onClick={() => setThemeOpen(false)}>×</button>
            </header>
            <div className="theme-scope-section">
              <span className="theme-section-label">{t("apply_to")}</span>
              <div className="theme-scope-options">
                <button className={themeScope === "all" ? "active" : ""} onClick={() => setThemeScope("all")}><b>{t("all_boxes")}</b><small>{t("all_boxes_desc")}</small></button>
                <button className={themeScope === "mark" ? "active" : ""} disabled={!selectedBox} onClick={() => setThemeScope("mark")}><b>{t("origin_mark_boxes")}</b><small>{selectedBox ? groupName(language, selectedBox.groupKey) : t("open_a_box")}</small></button>
                <button className={themeScope === "box" ? "active" : ""} disabled={!selectedBox} onClick={() => setThemeScope("box")}><b>{t("this_box")}</b><small>{selectedBox?.label ?? t("open_a_box")}</small></button>
              </div>
            </div>
            <div className="theme-picker-layout">
              <div className={`theme-live-preview ${themeDraft.kind === "default" ? "is-default" : "is-themed"}`} style={boxThemeStyle(themeDraft)}>
                <span>{t("preview")}</span><b>{displayThemeName(themeDraft)}</b><div>{Array.from({ length: 30 }, (_, index) => <i key={index} />)}</div>
              </div>
              <div className="theme-picker-content">
                <div className="theme-tabs" role="tablist" aria-label={t("theme_games")}>
                  {THEME_GAMES.map((game) => <button role="tab" aria-selected={themeTab === game.id} className={themeTab === game.id ? "active" : ""} key={game.id} onClick={() => chooseThemeTab(game.id)}>{game.id === "swsh" ? "SwSh" : game.id.toUpperCase()}</button>)}
                  <button role="tab" aria-selected={themeTab === "custom"} className={themeTab === "custom" ? "active" : ""} onClick={() => chooseThemeTab("custom")}>{t("custom")}</button>
                </div>
                {themeGameOption ? (
                  <div className="wallpaper-gallery" role="tabpanel" aria-label={themeGameOption.label}>
                    {themeGameOption.wallpapers.map((wallpaper, index) => <button aria-label={`${themeGameOption.label} · ${t("wallpaper")} ${index + 1}`} aria-pressed={themeDraft.kind === "preset" && themeDraft.wallpaper === wallpaper} className={themeDraft.kind === "preset" && themeDraft.wallpaper === wallpaper ? "active" : ""} key={wallpaper} onClick={() => chooseWallpaper(themeGameOption.id, wallpaper)} style={{ backgroundImage: `linear-gradient(rgba(4, 14, 13, .08), rgba(4, 14, 13, .08)), url("${wallpaper}")` }}><span>{String(index + 1).padStart(2, "0")}</span></button>)}
                  </div>
                ) : (
                  <div className="custom-theme-panel" role="tabpanel">
                    <button className="custom-upload" onClick={() => themeImageRef.current?.click()}><span>＋</span><b>{customThemeDraft ? t("change_background") : t("upload_background")}</b><small>{t("theme_image_types")}</small></button>
                    <input ref={themeImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={importCustomThemeImage} hidden />
                    <div className="theme-color-grid">
                      <label><span>{t("app_color")}</span><div><input type="color" value={customColors.appColor} onChange={(event) => updateCustomColor("appColor", event.target.value)} /><code>{customColors.appColor}</code></div></label>
                      <label><span>{t("primary_highlight")}</span><div><input type="color" value={customColors.primary} onChange={(event) => updateCustomColor("primary", event.target.value)} /><code>{customColors.primary}</code></div></label>
                      <label><span>{t("secondary_highlight")}</span><div><input type="color" value={customColors.secondary} onChange={(event) => updateCustomColor("secondary", event.target.value)} /><code>{customColors.secondary}</code></div></label>
                    </div>
                    <p className="custom-theme-note">{t("custom_color_note")}</p>
                  </div>
                )}
              </div>
            </div>
            <footer className="theme-dialog-actions"><button className="reset-theme" onClick={resetBoxTheme}>{t("reset_original")}</button><button className="apply-theme" onClick={applyBoxTheme} disabled={!themeCanApply}>{themeCanApply ? t("apply_theme") : t("upload_to_continue")}</button></footer>
          </section>
        </div>
      )}

      <div className="workspace">
        {filtersOpen && <button className="drawer-scrim" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)} />}
        <aside className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="filter-title-row"><button className="close-drawer" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)}>×</button></div>

          <div className="preset-grid">
            <button className={`preset shiny-preset ${variants.shiny && !variants.normal && acquisitions.own && !acquisitions.trade && !acquisitions.event && !acquisitions.external && selectedMarks.length > 1 && selectedCollections.length === 0 ? "active" : ""}`} onClick={() => applyPreset("shiny")}><span><img className="shiny-symbol" src={assetUrl("assets/shiny.png")} alt="" /></span><b>{t("preset_shiny")}</b></button>
            <button className={!variants.shiny && variants.normal && acquisitions.own && !acquisitions.trade && !acquisitions.event && !acquisitions.external && selectedCollections.length === 0 ? "preset active" : "preset"} onClick={() => applyPreset("normal")}><span>◌</span><b>{t("preset_normal")}</b></button>
            <button className={selectedMarks.length === 0 && selectedCollections.length === COLLECTIONS.length ? "preset active" : "preset"} onClick={() => applyPreset("special")}><span>◎</span><b>{t("preset_special")}</b></button>
          </div>

          <section className="filter-section">
            <p className="panel-label">{t("variants")}</p>
            <label className="switch-row" htmlFor="variant-shiny" aria-label={t("shiny_possible")}><span><b className="shiny-label"><img className="shiny-symbol small" src={assetUrl("assets/shiny.png")} alt="" />{t("shiny_possible")}</b></span><GooeyCheckbox id="variant-shiny" checked={variants.shiny} onChange={() => setVariant("shiny")} /></label>
            <label className="switch-row" htmlFor="variant-normal" aria-label={t("non_shiny")}><span><b>{t("non_shiny")}</b></span><GooeyCheckbox id="variant-normal" checked={variants.normal} onChange={() => setVariant("normal")} /></label>
            <label className="switch-row special-normal-row" htmlFor="special-non-shiny" aria-label={t("special_non_shiny")}><span><b>{t("special_non_shiny")}</b></span><GooeyCheckbox id="special-non-shiny" checked={includeNonShinySpecials} onChange={(event) => setIncludeNonShinySpecials(event.target.checked)} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("form_differences")}</p>
            <label className="switch-row" htmlFor="alternate-forms" aria-label={t("alternate_forms")}><span><b>{t("alternate_forms")}</b></span><GooeyCheckbox id="alternate-forms" checked={formOptions.alternate} onChange={(event) => setFormOptions((current) => ({ ...current, alternate: event.target.checked }))} /></label>
            <label className="switch-row" htmlFor="all-alcremie-forms" aria-label={t("all_alcremie_forms")}><span><b>{t("all_alcremie_forms")}</b></span><GooeyCheckbox id="all-alcremie-forms" checked={formOptions.alcremie} onChange={(event) => setFormOptions((current) => ({ ...current, alcremie: event.target.checked }))} /></label>
            <label className="switch-row" htmlFor="all-minior-forms" aria-label={t("all_minior_forms")}><span><b>{t("all_minior_forms")}</b></span><GooeyCheckbox id="all-minior-forms" checked={formOptions.minior} onChange={(event) => setFormOptions((current) => ({ ...current, minior: event.target.checked }))} /></label>
            <label className="switch-row" htmlFor="all-gender-differences" aria-label={t("all_gender_differences")}><span><b>{t("all_gender_differences")}</b></span><GooeyCheckbox id="all-gender-differences" checked={genderMode === "all"} onChange={(event) => setGenderMode(event.target.checked ? "all" : "notable")} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("acquisition")}</p>
            <label className="switch-row" htmlFor="acquisition-own" aria-label={t("own_ot")}><span><b>{t("own_ot")}</b></span><GooeyCheckbox id="acquisition-own" checked={acquisitions.own} onChange={() => setAcquisition("own")} /></label>
            <label className="switch-row" htmlFor="acquisition-trade" aria-label={t("in_game_trades")}><span><b>{t("in_game_trades")}</b></span><GooeyCheckbox id="acquisition-trade" checked={acquisitions.trade} onChange={() => setAcquisition("trade")} /></label>
            <label className="switch-row" htmlFor="acquisition-event" aria-label={t("events")}><span><b>{t("events")}</b></span><GooeyCheckbox id="acquisition-event" checked={acquisitions.event} onChange={() => setAcquisition("event")} /></label>
            <label className="switch-row" htmlFor="acquisition-external" aria-label={t("other_games_apps")}><span><b>{t("other_games_apps")}</b></span><GooeyCheckbox id="acquisition-external" checked={acquisitions.external} onChange={() => setAcquisition("external")} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("origin_marks")}</p>
            {MARKS.map((mark) => (
              <label className="mark-row" key={mark}>
                <CompactCheckbox checked={selectedMarks.includes(mark)} onChange={() => toggleMark(mark)} accent={MARK_COLORS[mark]} />
                <span>{groupName(language, mark)}</span><em>{markCounts[mark]?.toLocaleString(locale) ?? 0}</em>
              </label>
            ))}
            {selectedMarks.includes("GBA") && <div className="sub-rule static-rule"><span aria-hidden="true">↗</span><span><b>{t("gba_ports")}</b><small>{t("gba_ports_desc")}</small></span></div>}
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("special_collections")}</p>
            {COLLECTIONS.map((collection) => (
              <label className="mark-row" key={collection}>
                <CompactCheckbox checked={selectedCollections.includes(collection)} onChange={() => toggleCollection(collection)} accent={GROUP_COLORS[collection]} />
                <span>{groupName(language, collection)}</span><em>{collectionCounts[collection]?.toLocaleString(locale) ?? 0}</em>
              </label>
            ))}
            <div className="catalog-caveat"><b>{groupName(language, "cherish")}</b><span>{t("cherish_beta")}</span></div>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("capacity")}</p>
            <div className="capacity-toggle">
              <button className={capacity === 6000 ? "active" : ""} onClick={() => setCapacity(6000)}>{(6000).toLocaleString(locale)}<small>{t("current")}</small></button>
              <button className={capacity === 8000 ? "active" : ""} onClick={() => setCapacity(8000)}>{(8000).toLocaleString(locale)}<small>{t("future")}</small></button>
            </div>
          </section>

          <div className="backup-actions">
            <span>{t("checklist_backup")}</span>
            <button onClick={exportBackup}>{t("export")}</button><button onClick={() => importRef.current?.click()}>{t("import")}</button><input ref={importRef} type="file" accept="application/json" onChange={importBackup} hidden />
            <span>{t("theme_backup")}</span>
            <button onClick={exportThemeBackup}>{t("export_themes")}</button><button onClick={() => themeImportRef.current?.click()}>{t("import_themes")}</button><input ref={themeImportRef} type="file" accept="application/json" onChange={importThemeBackup} hidden />
          </div>
        </aside>

        <section className="collection-view">
          <div className="utility-row">
            <nav className="breadcrumbs">
              <button className={!selectedBox ? "current" : ""} onClick={() => setSelectedBoxIndex(null)}>{t("page")} {pageIndex + 1}</button>
              {selectedBox && <><span>/</span><strong>{selectedBox.label}</strong></>}
            </nav>
            <div className="search-tools">
              <button className="theme-trigger" onClick={openThemeDialog}><span>◈</span><b>{t("theme")}</b><small>{displayThemeName(activeBoxTheme)}</small></button>
              <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} /></label>
              <label className="missing-filter"><GooeyCheckbox id="missing-only" checked={missingOnly} onChange={(event) => setMissingOnly(event.target.checked)} /><span>{t("missing_only")}</span></label>
            </div>
          </div>

          {!selectedBox ? (
            <>
              <div className="view-heading page-heading">
                <div><p className="eyebrow teal">{t("page_view")}</p><h2>{t("page")} {pageIndex + 1}</h2><p>{t("page_desc")}</p></div>
                <div className="heading-metrics"><span><b>{boxes.length.toLocaleString(locale)}</b> {t("boxes_plan")}</span><span className={boxes.length > capacityBoxes ? "warning" : ""}><b>{capacityBoxes.toLocaleString(locale)}</b> {t("available")}</span></div>
              </div>

              <div className="page-grid" aria-label={`${t("page_view")} ${pageIndex + 1}`}>
                {pageBoxes.map((box, offset) => {
                  const globalIndex = pageIndex * 30 + offset;
                  const beyondCapacity = globalIndex >= capacityBoxes;
                  const matchCount = box?.entries.filter(matchesSearch).length ?? 0;
                  const boxOwned = box?.entries.filter((entry) => owned.has(entry.planId)).length ?? 0;
                  if (!box) return (
                    <div className={`box-tile empty ${beyondCapacity ? "locked" : ""}`} key={globalIndex}>
                      <span className="box-position">{String(offset + 1).padStart(2, "0")}</span><strong>{beyondCapacity ? t("no_capacity") : t("free")}</strong><small>{beyondCapacity ? t("outside_home") : t("box_available")}</small>
                    </div>
                  );
                  const previewLabel = box.entries.map((entry) => `${displayName(entry)}${displayForm(entry) ? ` ${displayForm(entry)}` : ""}`).join(", ");
                  const tileTheme = resolveBoxTheme(themeConfig, box.groupKey, box.number);
                  return (
                    <button aria-label={`${box.label}: ${previewLabel}`} className={`box-tile ${tileTheme.kind === "default" ? "" : "themed-box-tile"} ${beyondCapacity ? "overflow" : ""} ${(query || missingOnly) && !matchCount ? "filtered-out" : ""}`} key={box.label} onClick={() => setSelectedBoxIndex(globalIndex)} style={boxThemeStyle(tileTheme)}>
                      <span className="box-position">{String(offset + 1).padStart(2, "0")}</span>
                      <span className="mark-accent" style={{ background: GROUP_COLORS[box.groupKey] }} />
                      <strong>{box.label}</strong><small>{boxOwned.toLocaleString(locale)} / {box.entries.length.toLocaleString(locale)} {t("obtained")}</small>
                      <span className="mini-grid">{Array.from({ length: 30 }, (_, index) => { const entry = box.entries[index]; return <i className={entry ? owned.has(entry.planId) ? "owned" : "pending" : "vacant"} key={index} />; })}</span>
                      <span className="box-preview" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => { const entry = box.entries[index]; const url = entry ? pokemonArtworkUrl(entry) : null; return <span className={entry && owned.has(entry.planId) ? "owned" : ""} key={index}>{url && <img src={url} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</span>; })}</span>
                      {beyondCapacity && <em>{t("overflow")}</em>}
                    </button>
                  );
                })}
              </div>

              <footer className="view-footer">
                <button onClick={() => setPageIndex((value) => Math.max(0, value - 1))} disabled={pageIndex === 0}>{t("previous_page")}</button>
                <div className="page-dots">{Array.from({ length: totalPages }, (_, index) => <button aria-label={`${t("page")} ${index + 1}`} className={index === pageIndex ? "active" : ""} onClick={() => setPageIndex(index)} key={index}>{index + 1}</button>)}</div>
                <button onClick={() => setPageIndex((value) => Math.min(totalPages - 1, value + 1))} disabled={pageIndex === totalPages - 1}>{t("next_page")}</button>
                <button className="primary-action" onClick={() => toggleEntries(visiblePageEntries)}>{pageAllOwned ? t("unmark_page") : t("mark_page")}</button>
              </footer>
            </>
          ) : (
            <>
              <div className="view-heading box-detail-heading">
                <div><p className="eyebrow teal">{t("page").toUpperCase()} {Math.floor(selectedBox.globalIndex / 30) + 1} · {t("box")} {String((selectedBox.globalIndex % 30) + 1).padStart(2, "0")}</p><h2>{selectedBox.label}</h2><p>{t("box_instruction")}</p></div>
                <div className="detail-nav"><button onClick={() => setSelectedBoxIndex(Math.max(0, selectedBox.globalIndex - 1))} disabled={selectedBox.globalIndex === 0}>←</button><button onClick={() => setSelectedBoxIndex(null)}>{t("page_view_button")}</button><button onClick={() => setSelectedBoxIndex(Math.min(boxes.length - 1, selectedBox.globalIndex + 1))} disabled={selectedBox.globalIndex === boxes.length - 1}>→</button></div>
              </div>

              <div className={`box-theme-stage ${activeBoxTheme.kind === "default" ? "is-default" : "is-themed"}`} style={boxThemeStyle(activeBoxTheme)}>
                <div className="box-grid" aria-label={selectedBox.label}>
                {Array.from({ length: 30 }, (_, index) => {
                  const entry = selectedBox.entries[index];
                  if (!entry) return <div className="pokemon-slot vacant" key={index}><span className="slot-number">{String(index + 1).padStart(2, "0")}</span><span>{t("empty")}</span></div>;
                  const isOwned = owned.has(entry.planId);
                  const visible = matchesSearch(entry);
                  const localizedName = displayName(entry);
                  const localizedForm = displayForm(entry);
                  const genderDetail = entry.gender ? t(entry.gender) : null;
                  const detail = [entry.displayDetail || localizedForm || `#${String(entry.dex).padStart(4, "0")}`, genderDetail].filter(Boolean).join(" · ");
                  return (
                    <button className={`pokemon-slot ${isOwned ? "owned" : "pending"} ${visible ? "" : "filtered-out"}`} key={entry.planId} onClick={() => toggleOwned(entry.planId)} title={`${localizedName}${localizedForm ? ` · ${localizedForm}` : ""}${genderDetail ? ` · ${genderDetail}` : ""}\n${displayNote(entry)}`} aria-pressed={isOwned}>
                      <span className="slot-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className={`variant-badge ${entry.variant}`}>{entry.variant === "shiny" && <img className="shiny-symbol badge" src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</span>
                      <PokemonArtwork entry={entry} owned={isOwned} displayName={localizedName} language={language} />
                      <strong>{localizedName}</strong><small>{detail} · {entry.ownOt ? t("your_ot") : t("foreign_ot")}</small>
                      <span className="status-dot">{isOwned ? "✓" : ""}</span>
                    </button>
                  );
                })}
                </div>
              </div>

              <footer className="box-footer">
                <span><b>{selectedBox.entries.filter((entry) => owned.has(entry.planId)).length.toLocaleString(locale)}</b> {t("obtained")}</span><span><b>{selectedBox.entries.filter((entry) => !owned.has(entry.planId)).length.toLocaleString(locale)}</b> {t("pending")}</span>
                <button className="primary-action" onClick={() => toggleEntries(selectedBox.entries)}>{selectedBox.entries.every((entry) => owned.has(entry.planId)) ? t("unmark_box") : t("mark_box")}</button>
              </footer>
            </>
          )}

          <section className="data-note">
            <div className="source-links"><a href="https://bulbapedia.bulbagarden.net/wiki/N%27s_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("n_source")}</a><a href="https://www.serebii.net/blackwhite/dreamworldpokemon.shtml" target="_blank" rel="noreferrer">{t("dream_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Dream_Radar#Pok%C3%A9mon_encounters" target="_blank" rel="noreferrer">{t("radar_source")}</a><a href="https://www.serebii.net/events/shiny.shtml" target="_blank" rel="noreferrer">{t("event_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("shadow_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/In-game_trade" target="_blank" rel="noreferrer">{t("trade_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_gender_differences" target="_blank" rel="noreferrer">{t("gender_source")}</a><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">{t("art_source")}</a></div>
          </section>
        </section>
      </div>
    </main>
  );
}
