import { ChangeEvent, CSSProperties, ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BoxTheme,
  BoxThemeConfig,
  BOX_THEME_GAMES,
  CONCEPT_ART_GAMES,
  DEFAULT_BOX_THEME,
  EMPTY_THEME_CONFIG,
  THEME_GAMES,
  ThemeGame,
  boxThemeKey,
  boxThemeStyle,
  createPresetTheme,
  parseThemeConfig,
  presetThemeName,
  resolveBoxTheme,
} from "./box-themes";
import { LANGUAGE_OPTIONS, UiLanguage, copy, formName, groupName, localizeCatalogText } from "./translations";
import { HomeChallenge, HomeChallengesDataset, localizeHomeChallengeTitle } from "./home-challenges";
import { addGoStorableForms, addStorableShayminSkyForms, addSwShHisuianEvolutionEntries, correctBloodmoonUrsalunaDex, insertCatalogEntry, markLgpeAlolanFormsAsInGameTrades, removeInvalidGbaKingambit, selectNormalLivingDexEntries } from "./catalog-corrections";
import { AustinJohnImportError, buildAustinJohnPreview, parseAustinJohnWorkbook, type AustinJohnPreview } from "./austin-john-import";
import {
  AVAILABILITY_STATUSES,
  COLLECTION_PRESETS,
  GAME_PLANS,
  UNIFIED_COLLECTION_PRESETS,
  AvailabilityStatus,
  CollectionPreset,
  GamePlanId,
  SpeciesRule,
  SpeciesRulesDataset,
  SpecimenRequirements,
  availabilityForEntry,
  genericSpecimenKey,
  generationForDex,
  matchesGamePlan,
  methodKeyForEntry,
  reasonKeyForEntry,
  regionKeyForGeneration,
  requiresPokemonBank,
  selectFinalFormDexEntries,
  selectLivingDexWithRegionalForms,
  selectLivingFormEntries,
  selectLivingFormLiteEntries,
  selectNoahsArkEntries,
  selectOriginalGenerationEntries,
  transferKeyForEntry,
} from "./collection-features";
import { buildOwnedProgressCsv, decodeOcrTransferHash, matchCollectionRecords, parseCollectionCsv, parseCompactTransfer, type CollectionRecord, type ImportCatalogEntry, type ImportMatchSummary } from "./import-export";

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
  availability: "standard" | "historical" | "hypothetical" | "excluded";
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
  game?: string;
  gender?: "male" | "female";
  genderDifferenceTier?: "notable" | "all";
  genderVariant?: "base" | "extra";
  requirements?: SpecimenRequirements;
  level?: number;
  trainerId?: string;
  ball?: string;
  nature?: string;
  ability?: string;
  heldItem?: string;
  moves?: string[];
  ribbons?: string[];
  eventYear?: number;
  eventLocation?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  genericEntry?: boolean;
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
type CollectionViewMode = "boxes" | "global" | "summary";
type ThemeScope = "all" | "mark" | "box";
type ThemeTab = ThemeGame | "concept" | "custom";
type PlannedEntry = PokemonEntry & { planId: string; variant: Variant; groupKey: string; groupLabel: string; ownOt: boolean };
type PlannedBox = { globalIndex: number; groupKey: string; number: number; label: string; entries: PlannedEntry[] };
type LocatedEntry = { entry: PlannedEntry; box: PlannedBox; slotIndex: number };
type GlobalTooltip = { located: LocatedEntry; left: number; top: number; above: boolean };
type AvailabilityFilters = Record<AvailabilityStatus, boolean>;
type SelectOption<T extends string | number> = { value: T; label: string; icon?: ReactNode };
type CustomBox = { id: string; name: string; planIds: string[] };
type ImportNotice = ImportMatchSummary & { source: "ocr" | "csv" };
type AustinAppliedNotice = { imported: number; newOwned: number; mode: "merge" | "replace" };
type ProgressSnapshot = { owned: Set<string>; livingDexOwned: Set<number> };

const MARKS = ["Sin marca", "GB", "P", "USUM", "LGPE", "SwSh", "LA", "BDSP", "SV", "LZA", "GBA"];
const DEFAULT_MARKS = MARKS.filter((mark) => mark !== "GBA");
const COLLECTIONS = ["n", "dream", "radar", "shadow-colosseum", "shadow-xd", "cherish", "event-dex", "trades", "go"];
const MYTHICAL_DEX = new Set([
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
const DEFAULT_COLLECTIONS = COLLECTIONS.filter((collection) => collection !== "event-dex");
const DEFAULT_AVAILABILITY_FILTERS: AvailabilityFilters = { current: true, legacy: true, historical: true, hypothetical: true };
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
const ORIGIN_MARK_ICONS: Record<string, string> = {
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
const STORAGE_KEY = "origin-marks-home-checklist-v1";
const THEME_STORAGE_KEY = "origin-marks-box-themes-v1";
const CATALOG_VERSION = 6;
const BACKUP_VERSION = 8;
const DEFAULT_FORM_OPTIONS: FormOptions = { alternate: true, alcremie: false, minior: false };
const COLLECTION_ACQUISITIONS: Record<string, Acquisition> = {
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

function CompactCheckbox({ checked, onChange, accent }: { checked: boolean; onChange: () => void; accent: string }) {
  return <span className="compact-checkbox" style={{ "--checkbox-accent": accent } as CSSProperties}><input type="checkbox" checked={checked} onChange={onChange} /></span>;
}

function originMarkIconUrl(mark?: string) {
  const filename = mark ? ORIGIN_MARK_ICONS[mark] : undefined;
  return filename ? assetUrl(`assets/origin-marks/${filename}`) : null;
}

function OriginMarkIcon({ mark, label, className = "" }: { mark: string; label: string; className?: string }) {
  const src = originMarkIconUrl(mark);
  if (!src) return <span className={className}>{label}</span>;
  return <span className={`origin-mark-icon ${className}`} title={label}><img src={src} alt="" /><span className="sr-only">{label}</span></span>;
}

function FavoriteButton({ active, label, onClick, className = "" }: { active: boolean; label: string; onClick: () => void; className?: string }) {
  return <button type="button" className={`favorite-star ${active ? "active" : ""} ${className}`} aria-pressed={active} aria-label={label} title={label} onClick={onClick}>
    <img src={assetUrl("assets/favorite-star.png")} alt="" />
  </button>;
}

function BankBadge({ label, className = "" }: { label: string; className?: string }) {
  return <span className={`bank-badge ${className}`} title={label}><img src={assetUrl("assets/bank.png")} alt="" /><span>{label}</span></span>;
}

function StyledSelect<T extends string | number>({ value, options, onChange, ariaLabel, className = "", placeholder }: { value: T; options: SelectOption<T>[]; onChange: (value: T) => void; ariaLabel: string; className?: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); window.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  return <div className={`styled-select ${open ? "open" : ""} ${className}`} ref={rootRef}>
    <button type="button" className="styled-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <span>{selected?.icon}{selected?.label ?? placeholder ?? ariaLabel}</span><b aria-hidden="true">⌄</b>
    </button>
    {open && <div className="styled-select-options" role="listbox" aria-label={ariaLabel}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "active" : ""} key={String(option.value)} onClick={() => { onChange(option.value); setOpen(false); }}>{option.icon}<span>{option.label}</span></button>)}</div>}
  </div>;
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

function downloadText(filename: string, text: string, type: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
}
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
const FLOWER_COLOR_INDEX = new Map<string, number>([
  ["Red Flower", 0], ["Yellow Flower", 1], ["Orange Flower", 2], ["Blue Flower", 3], ["White Flower", 4],
]);
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

function applyCatalogCorrections(entries: PokemonEntry[]) {
  let correctedEntries = correctBloodmoonUrsalunaDex(addSwShHisuianEvolutionEntries(expandCollectibleForms(entries)));
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

  correctedEntries = addStorableShayminSkyForms(correctedEntries);

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
  
  const alolanFormsWithoutGenderDifference = new Set([19, 20, 26]);

  correctedEntries = correctedEntries
  .filter((entry) =>
    !(
      entry.form === "Alolan" &&
      alolanFormsWithoutGenderDifference.has(entry.dex) &&
      entry.genderVariant === "extra"
    )
  )
  .map((entry) =>
    entry.form === "Alolan" &&
    alolanFormsWithoutGenderDifference.has(entry.dex)
      ? {
          ...entry,
          gender: undefined,
          genderDifferenceTier: undefined,
          genderVariant: undefined,
        }
      : entry
  );
  return markLgpeAlolanFormsAsInGameTrades(removeInvalidGbaKingambit(correctedEntries)).map((entry) => {
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

function asGenericSpecimen(entry: PlannedEntry): PlannedEntry {
  const requirements: SpecimenRequirements = {
    gender: entry.requirements?.gender,
    originGeneration: entry.requirements?.originGeneration,
    originRegion: entry.requirements?.originRegion,
    alpha: entry.requirements?.alpha,
    gmaxFactor: entry.requirements?.gmaxFactor,
  };
  const cleanRequirements = Object.fromEntries(Object.entries(requirements).filter(([, value]) => value !== undefined)) as SpecimenRequirements;
  const genericEntry = { ...entry, requirements: cleanRequirements };
  const planId = genericSpecimenKey(genericEntry);
  return {
    ...genericEntry,
    id: planId,
    sourceNumber: undefined,
    mark: undefined,
    collection: undefined,
    note: "",
    sourceLabel: undefined,
    sourceUrl: undefined,
    trainerName: undefined,
    trainerId: undefined,
    nickname: undefined,
    partnerRibbon: undefined,
    ball: undefined,
    nature: undefined,
    ability: undefined,
    heldItem: undefined,
    moves: undefined,
    ribbons: undefined,
    eventYear: undefined,
    eventLocation: undefined,
    eventType: undefined,
    startDate: undefined,
    endDate: undefined,
    acquisitionCategory: "own",
    game: undefined,
    gender: cleanRequirements.gender === "male" || cleanRequirements.gender === "female" ? cleanRequirements.gender : undefined,
    genderVariant: cleanRequirements.gender === "male" || cleanRequirements.gender === "female" ? entry.genderVariant : undefined,
    availability: "standard",
    ownOtNormal: true,
    ownOtShiny: true,
    ownOt: true,
    planId,
    genericEntry: true,
  };
}
function eventMythicalsForMark(
  mark: string,
  normalEntries: PokemonEntry[],
  specialEntries: PokemonEntry[],
) {
  const existing = new Set(
    normalEntries
      .filter((entry) => entry.mark === mark)
      .flatMap((entry) => [
        ...(entry.normalEligible !== false ? [`${entry.dex}:${entry.form ?? ""}:normal`] : []),
        ...(entry.shinyEligible ? [`${entry.dex}:${entry.form ?? ""}:shiny`] : []),
      ])
  );

  const seen = new Set<string>();

  return specialEntries
    .filter((entry) =>
      entry.collection === "event-dex" &&
      entry.mark === mark &&
      MYTHICAL_DEX.has(entry.dex)
    )
    .filter((entry) => {
      const variant = entry.shinyEligible ? "shiny" : "normal";
      const key = `${entry.dex}:${entry.form ?? ""}:${variant}`;

      if (existing.has(key)) return false;
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .map((entry) => {
      const variant = entry.shinyEligible ? "shiny" : "normal";
      return {
        ...entry,
        id: `${mark}:historical-event:${entry.dex}:${entry.form ?? "base"}:${variant}`,
        collection: undefined,
        acquisitionCategory: "event" as const,
        availability: "historical" as const,
        normalEligible: variant === "normal",
        shinyEligible: variant === "shiny",
        ownOtNormal: false,
        ownOtShiny: false,
      };
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
  includeEventMythicals: boolean,
  genderMode: GenderMode,
  formOptions: FormOptions,
  normalLivingDex: boolean,
  originMarkDex: boolean,
  collectionPreset: CollectionPreset,
  speciesRules: Map<number, SpeciesRule>,
  language: UiLanguage,
) {
  const boxes: PlannedBox[] = [];
  const unifiedCandidates: PlannedEntry[] = [];
  const unifiedProfile = normalLivingDex || UNIFIED_COLLECTION_PRESETS.has(collectionPreset);
  const groups = [
  ...MARKS.filter((mark) => selectedMarks.includes(mark)).map((key) => ({
    key,
    label: groupName(language, key),
    entries: [
      ...entries.filter((entry) => entry.mark === key),
      ...(includeEventMythicals
        ? eventMythicalsForMark(key, entries, specialEntries)
        : []),
    ].sort((a, b) => {
      if (a.dex !== b.dex) return a.dex - b.dex;

      return (a.form ?? "").localeCompare(b.form ?? "");
    }),
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
        const acquisition =
          entry.acquisitionCategory ??
          COLLECTION_ACQUISITIONS[entry.collection ?? ""] ??
          (ownOt ? "own" : "event");

        const isHistoricalEventMythical =
          entry.id.includes(":historical-event:");

        if (
          acquisitions[acquisition] ||
          (includeEventMythicals && isHistoricalEventMythical)
        ) {
          planned.push({
            ...entry,
            variant: "normal",
            ownOt,
            groupKey: group.key,
            groupLabel: group.label,
            planId: `${entry.id}:normal`,
          });
        }
      }
      if (variants.shiny && entry.shinyEligible) {
        const ownOt = entry.ownOtShiny;

        const acquisition =
          entry.acquisitionCategory ??
          COLLECTION_ACQUISITIONS[entry.collection ?? ""] ??
          (ownOt ? "own" : "event");

        const isHistoricalEventMythical =
          entry.id.includes(":historical-event:");

        if (
          acquisitions[acquisition] ||
          (includeEventMythicals && isHistoricalEventMythical)
        ) {
          planned.push({
            ...entry,
            variant: "shiny",
            ownOt,
            groupKey: group.key,
            groupLabel: group.label,
            planId: `${entry.id}:shiny`,
          });
        }
      }
    }
    if (unifiedProfile) unifiedCandidates.push(...planned);
    else chunk(originMarkDex ? selectNormalLivingDexEntries(planned) : planned, 30).forEach((boxEntries, index) => {
      boxes.push({ globalIndex: boxes.length, groupKey: group.key, number: index + 1, label: `${group.label} ${String(index + 1).padStart(2, "0")}`, entries: boxEntries });
    });
  }
  if (unifiedProfile) {
    if (collectionPreset === "original_generation") {
      const originalEntries = selectOriginalGenerationEntries(unifiedCandidates, speciesRules);
      for (let generation = 1; generation <= 9; generation += 1) {
        const groupKey = regionKeyForGeneration(generation);
        const groupLabel = groupName(language, groupKey);
        const regionEntries = originalEntries
          .filter((entry) => entry.requirements.originGeneration === generation)
          .map((entry) => asGenericSpecimen({ ...entry, groupKey, groupLabel }));
        chunk(regionEntries, 30).forEach((boxEntries, index) => {
          boxes.push({ globalIndex: boxes.length, groupKey, number: index + 1, label: `${groupLabel} ${String(index + 1).padStart(2, "0")}`, entries: boxEntries });
        });
      }
    } else {
      const selected = collectionPreset === "final"
        ? selectFinalFormDexEntries(unifiedCandidates, speciesRules)
        : collectionPreset === "regional"
          ? selectLivingDexWithRegionalForms(unifiedCandidates)
          : collectionPreset === "forms_lite"
            ? selectLivingFormLiteEntries(unifiedCandidates)
            : collectionPreset === "forms" || collectionPreset === "shiny"
              ? selectLivingFormEntries(unifiedCandidates)
            : collectionPreset === "noah"
              ? selectNoahsArkEntries(unifiedCandidates, speciesRules)
              : selectNormalLivingDexEntries(unifiedCandidates);
      const groupKey = normalLivingDex ? "living-dex" : `profile-${collectionPreset}`;
      const groupLabel = normalLivingDex ? copy(language, "normal_living_dex") : copy(language, `profile_${collectionPreset}`);
      chunk(selected.map((entry) => asGenericSpecimen({ ...entry, groupKey, groupLabel })), 30).forEach((boxEntries, index) => {
        boxes.push({ globalIndex: boxes.length, groupKey, number: index + 1, label: `${groupLabel} ${String(index + 1).padStart(2, "0")}`, entries: boxEntries });
      });
    }
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
  const flowerIndex = entry.form ? FLOWER_COLOR_INDEX.get(entry.form) : undefined;
  const alcremieCream = entry.dex === 869 && entry.form ? ALCREMIE_CREAMS.findIndex((cream) => entry.form?.startsWith(`${cream}, `)) : -1;
  const alcremieSweet = entry.dex === 869 && entry.form ? ALCREMIE_SWEETS.findIndex((sweet) => entry.form?.endsWith(`, ${sweet}`)) : -1;
  let customKey: string | null = null;
  if (vivillonIndex !== undefined) customKey = `0666-${String(vivillonIndex).padStart(2, "0")}`;
  if (furfrouIndex !== undefined) customKey = `0676-${String(furfrouIndex).padStart(2, "0")}`;
  if (entry.dex >= 669 && entry.dex <= 671 && flowerIndex !== undefined) customKey = `${String(entry.dex).padStart(4, "0")}-${String(flowerIndex).padStart(2, "0")}`;
  if (entry.dex === 670 && entry.form === "Eternal Flower" && entry.variant === "normal") customKey = "0670-05";
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
  const [speciesRules, setSpeciesRules] = useState<Map<number, SpeciesRule>>(new Map());
  const [homeChallenges, setHomeChallenges] = useState<HomeChallenge[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState<string[]>(DEFAULT_MARKS);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(DEFAULT_COLLECTIONS);
  const [variants, setVariants] = useState<Record<Variant, boolean>>({ shiny: true, normal: false });
  const [acquisitions, setAcquisitions] = useState<Record<Acquisition, boolean>>({ own: true, trade: true, event: true, external: true });
  const [includeNonShinySpecials, setIncludeNonShinySpecials] = useState(true);
  const [includeEventMythicals, setIncludeEventMythicals] = useState(false);
  const [genderMode, setGenderMode] = useState<GenderMode>("notable");
  const [formOptions, setFormOptions] = useState<FormOptions>(DEFAULT_FORM_OPTIONS);
  const [normalLivingDex, setNormalLivingDex] = useState(false);
  const [originMarkDex, setOriginMarkDex] = useState(false);
  const [collectionPreset, setCollectionPreset] = useState<CollectionPreset>("custom");
  const [availabilityFilters, setAvailabilityFilters] = useState<AvailabilityFilters>(DEFAULT_AVAILABILITY_FILTERS);
  const [language, setLanguage] = useState<UiLanguage>("ES-LA");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [capacity, setCapacity] = useState<6000 | 8000>(6000);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [livingDexOwned, setLivingDexOwned] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<CollectionViewMode>("boxes");
  const [selectedGamePlan, setSelectedGamePlan] = useState<GamePlanId>("usum");
  const [gameResultLimit, setGameResultLimit] = useState(24);
  const [undoDepth, setUndoDepth] = useState(0);
  const [keyboardSlotIndex, setKeyboardSlotIndex] = useState(0);
  const [boxNameOverrides, setBoxNameOverrides] = useState<Record<string, string>>({});
  const [customBoxes, setCustomBoxes] = useState<CustomBox[]>([]);
  const [customBoxEditorId, setCustomBoxEditorId] = useState<string | null>(null);
  const [customBoxQuery, setCustomBoxQuery] = useState("");
  const [renameBoxIndex, setRenameBoxIndex] = useState(0);
  const [highlightedPlanId, setHighlightedPlanId] = useState<string | null>(null);
  const [locationAnnouncement, setLocationAnnouncement] = useState("");
  const [globalTooltip, setGlobalTooltip] = useState<GlobalTooltip | null>(null);
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [homeChallengesOnly, setHomeChallengesOnly] = useState(false);
  const [detailEntry, setDetailEntry] = useState<LocatedEntry | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState<BoxThemeConfig>(EMPTY_THEME_CONFIG);
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeScope, setThemeScope] = useState<ThemeScope>("all");
  const [themeTab, setThemeTab] = useState<ThemeTab>("swsh");
  const [conceptGame, setConceptGame] = useState<ThemeGame>("concept-bdsp");
  const [themeDraft, setThemeDraft] = useState<BoxTheme>(DEFAULT_BOX_THEME);
  const [customThemeDraft, setCustomThemeDraft] = useState<BoxTheme | null>(null);
  const [customColors, setCustomColors] = useState({ appColor: "#102e2a", primary: "#55e0c0", secondary: "#f3c857" });
  const [collectionGoal, setCollectionGoal] = useState("");
  const [collectionNotes, setCollectionNotes] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [importNotice, setImportNotice] = useState<ImportNotice | null>(null);
  const [austinPreview, setAustinPreview] = useState<AustinJohnPreview | null>(null);
  const [austinImportBusy, setAustinImportBusy] = useState(false);
  const [austinNotice, setAustinNotice] = useState<AustinAppliedNotice | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const austinImportRef = useRef<HTMLInputElement>(null);
  const themeImportRef = useRef<HTMLInputElement>(null);
  const themeImageRef = useRef<HTMLInputElement>(null);
  const highlightedEntryRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const progressHistoryRef = useRef<ProgressSnapshot[]>([]);
  const livingDexProgressStoredRef = useRef(false);
  const livingDexMigrationCheckedRef = useRef(false);
  const transferProcessedRef = useRef(false);
  const languageOption = LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];
  const locale = languageOption.locale;
  const t = (key: string) => copy(language, key);
  const displayThemeName = (theme: BoxTheme) => theme.kind === "default" ? t("original_theme") : theme.kind === "custom" ? t("custom") : presetThemeName(theme.game, theme.wallpaper);
  const displayName = (entry: PokemonEntry) => pokemonNames?.[String(entry.dex)]?.[language] ?? entry.name;
  const displayForm = (entry: PokemonEntry) => formName(language, entry.dex, entry.form);
  const displayNote = (entry: PokemonEntry) => localizeCatalogText(language, entry.note);

  useEffect(() => {
    Promise.all([fetch(assetUrl("data/pokemon-lite.json")), fetch(assetUrl("data/special-collections.json")), fetch(assetUrl("data/pokemon-names.json")), fetch(assetUrl("data/species-rules.json")), fetch(assetUrl("data/home-challenges.json"))])
      .then(async ([baseResponse, specialResponse, namesResponse, rulesResponse, challengesResponse]) => {
        if (!baseResponse.ok || !specialResponse.ok || !namesResponse.ok || !rulesResponse.ok || !challengesResponse.ok) throw new Error("data");
        return Promise.all([baseResponse.json(), specialResponse.json(), namesResponse.json(), rulesResponse.json(), challengesResponse.json()]);
      })
      .then(([baseValue, specialValue, namesValue, rulesValue, challengesValue]: [Dataset, SpecialDataset, PokemonNames, SpeciesRulesDataset, HomeChallengesDataset]) => {
        const correctedEntries = applyCatalogCorrections(baseValue.entries);
        const correctedSpecialEntries = addGoStorableForms(specialValue.entries, correctedEntries);
        setDataset({ ...baseValue, entries: correctedEntries });
        setSpecialDataset({ ...specialValue, meta: { ...specialValue.meta, entryCount: correctedSpecialEntries.length, counts: { ...specialValue.meta.counts, go: correctedSpecialEntries.filter((entry) => entry.collection === "go").length } }, entries: correctedSpecialEntries });
        setPokemonNames(namesValue);
        setSpeciesRules(new Map(rulesValue.species.map((rule) => [rule.dex, rule])));
        setHomeChallenges(challengesValue.challenges);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const value = JSON.parse(saved);
        if (Array.isArray(value.owned)) setOwned(new Set(value.owned));
        if (Object.hasOwn(value, "livingDexOwned")) livingDexProgressStoredRef.current = true;
        if (Array.isArray(value.livingDexOwned)) setLivingDexOwned(new Set(value.livingDexOwned.filter((dex: unknown) => typeof dex === "number" && Number.isInteger(dex) && dex > 0)));
        if (Array.isArray(value.favorites)) setFavorites(new Set(value.favorites.filter((id: unknown) => typeof id === "string")));
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
        if (typeof value.includeEventMythicals === "boolean")
           setIncludeEventMythicals(value.includeEventMythicals);
        if (value.genderMode === "notable" || value.genderMode === "all") setGenderMode(value.genderMode);
        if (value.formOptions) setFormOptions({
          alternate: typeof value.formOptions.alternate === "boolean" ? value.formOptions.alternate : DEFAULT_FORM_OPTIONS.alternate,
          alcremie: typeof value.formOptions.alcremie === "boolean" ? value.formOptions.alcremie : DEFAULT_FORM_OPTIONS.alcremie,
          minior: typeof value.formOptions.minior === "boolean" ? value.formOptions.minior : DEFAULT_FORM_OPTIONS.minior,
        });
        if (typeof value.normalLivingDex === "boolean") setNormalLivingDex(value.normalLivingDex);
        if (typeof value.originMarkDex === "boolean") setOriginMarkDex(value.originMarkDex);
        if (COLLECTION_PRESETS.includes(value.collectionPreset)) setCollectionPreset(value.collectionPreset);
        if (value.availabilityFilters) setAvailabilityFilters(Object.fromEntries(AVAILABILITY_STATUSES.map((status) => [status, value.availabilityFilters[status] !== false])) as AvailabilityFilters);
        if (typeof value.favoritesOnly === "boolean") setFavoritesOnly(value.favoritesOnly);
        if (typeof value.homeChallengesOnly === "boolean") setHomeChallengesOnly(value.homeChallengesOnly);
        if (LANGUAGE_OPTIONS.some((option) => option.code === value.language)) setLanguage(value.language);
        if (value.capacity === 6000 || value.capacity === 8000) setCapacity(value.capacity);
        if (value.viewMode === "boxes" || value.viewMode === "global" || value.viewMode === "summary") setViewMode(value.viewMode);
        if (typeof value.missingOnly === "boolean") setMissingOnly(value.missingOnly);
        if (GAME_PLANS.some((game) => game.id === value.selectedGamePlan)) setSelectedGamePlan(value.selectedGamePlan);
        if (value.boxNameOverrides && typeof value.boxNameOverrides === "object") setBoxNameOverrides(Object.fromEntries(Object.entries(value.boxNameOverrides).filter(([, name]) => typeof name === "string").map(([key, name]) => [key, (name as string).slice(0, 48)])));
        if (Array.isArray(value.customBoxes)) setCustomBoxes(value.customBoxes.filter((box: unknown): box is CustomBox => Boolean(box && typeof box === "object" && typeof (box as CustomBox).id === "string" && typeof (box as CustomBox).name === "string" && Array.isArray((box as CustomBox).planIds))).map((box: CustomBox) => ({ id: box.id, name: box.name.slice(0, 48), planIds: box.planIds.filter((id) => typeof id === "string").slice(0, 30) })));
        if (typeof value.collectionGoal === "string") setCollectionGoal(value.collectionGoal.slice(0, 8));
        if (typeof value.collectionNotes === "string") setCollectionNotes(value.collectionNotes.slice(0, 2_000));
        if (typeof value.savedAt === "number") setLastSavedAt(value.savedAt);
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
    const savedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ catalogVersion: CATALOG_VERSION, savedAt, owned: [...owned], livingDexOwned: [...livingDexOwned], favorites: [...favorites], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, collectionPreset, availabilityFilters, favoritesOnly, homeChallengesOnly, language, capacity, viewMode, missingOnly, selectedGamePlan, collectionGoal, collectionNotes, boxNameOverrides, customBoxes }));
      setLastSavedAt(savedAt);
    } catch { /* Keep the in-memory session usable if browser storage is full. */ }
  }, [owned, livingDexOwned, favorites, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, collectionPreset, availabilityFilters, favoritesOnly, homeChallengesOnly, language, capacity, viewMode, missingOnly, selectedGamePlan, collectionGoal, collectionNotes, boxNameOverrides, customBoxes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfig)); }
    catch { window.alert(copy(language, "theme_storage_error")); }
  }, [themeConfig, hydrated, language]);

  useEffect(() => {
    if (!themeOpen && !detailEntry && !austinPreview) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setThemeOpen(false); setDetailEntry(null); setAustinPreview(null); } };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [austinPreview, themeOpen, detailEntry]);

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? "es-MX";
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const boxes = useMemo(() => buildBoxes(dataset?.entries ?? [], specialDataset?.entries ?? [], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, collectionPreset, speciesRules, language).map((box) => ({
    ...box,
    label: boxNameOverrides[`${box.groupKey}:${box.number}`] || box.label,
  })), [dataset, specialDataset, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, collectionPreset, speciesRules, language, boxNameOverrides]);
  useEffect(() => setRenameBoxIndex((current) => Math.min(current, Math.max(0, boxes.length - 1))), [boxes.length]);
  const allImportEntries = useMemo<ImportCatalogEntry[]>(() => [
    ...(dataset?.entries ?? []),
    ...(specialDataset?.entries ?? []),
  ], [dataset, specialDataset]);
  const databaseChoices = useMemo<PlannedEntry[]>(() => {
    const choices = new Map<string, PlannedEntry>();
    [...(dataset?.entries ?? []), ...(specialDataset?.entries ?? [])].forEach((entry) => {
      if (entry.availability === "excluded") return;
      const groupKey = entry.mark ?? entry.collection ?? "Sin marca";
      const groupLabel = groupName(language, groupKey);
      if (entry.normalEligible !== false) choices.set(`${entry.id}:normal`, { ...entry, variant: "normal", ownOt: entry.ownOtNormal, groupKey, groupLabel, planId: `${entry.id}:normal` });
      if (entry.shinyEligible) choices.set(`${entry.id}:shiny`, { ...entry, variant: "shiny", ownOt: entry.ownOtShiny, groupKey, groupLabel, planId: `${entry.id}:shiny` });
    });
    return [...choices.values()].sort((a, b) => a.dex - b.dex || a.name.localeCompare(b.name) || a.planId.localeCompare(b.planId));
  }, [dataset, specialDataset, language]);
  const databaseChoiceByPlanId = useMemo(() => new Map(databaseChoices.map((entry) => [entry.planId, entry])), [databaseChoices]);
  const derivedGenericProgress = useMemo(() => {
    const keys = new Set<string>();
    const normalSpecies = new Set<number>();
    for (const planId of owned) {
      if (planId.startsWith("generic:")) continue;
      let entry = databaseChoiceByPlanId.get(planId);
      const legacyGender = planId.match(/^(.*):gender:(male|female|any)$/);
      if (!entry && legacyGender) entry = databaseChoiceByPlanId.get(legacyGender[1]);
      const legacyOriginalGeneration = planId.match(/^(.*):original-generation:\d+$/);
      if (!entry && legacyOriginalGeneration) entry = databaseChoiceByPlanId.get(legacyOriginalGeneration[1]);
      if (!entry) continue;
      keys.add(genericSpecimenKey({ ...entry, requirements: {} }));
      const knownGender = legacyGender?.[2] as SpecimenRequirements["gender"] | undefined ?? entry.gender;
      if (knownGender) keys.add(genericSpecimenKey({ ...entry, requirements: { gender: knownGender } }));
      if (entry.variant === "normal") normalSpecies.add(entry.dex);
    }
    return { keys, normalSpecies };
  }, [databaseChoiceByPlanId, owned]);
  useEffect(() => {
    if (!hydrated || !databaseChoiceByPlanId.size || livingDexMigrationCheckedRef.current) return;
    livingDexMigrationCheckedRef.current = true;
    if (livingDexProgressStoredRef.current || !normalLivingDex || !owned.size) return;
    const migrated = new Set<number>();
    owned.forEach((planId) => {
      const dex = databaseChoiceByPlanId.get(planId)?.dex;
      if (dex) migrated.add(dex);
    });
    if (migrated.size) setLivingDexOwned(migrated);
  }, [databaseChoiceByPlanId, hydrated, normalLivingDex, owned]);
  const plannedEntries = useMemo(() => boxes.flatMap((box) => box.entries), [boxes]);
  const locatedEntries = useMemo(() => boxes.flatMap((box) => box.entries.map((entry, slotIndex) => ({ entry, box, slotIndex }))), [boxes]);
  const homeChallengesByDex = useMemo(() => {
    const byDex = new Map<number, HomeChallenge[]>();
    for (const challenge of homeChallenges) {
      for (const dex of challenge.dexes) byDex.set(dex, [...(byDex.get(dex) ?? []), challenge]);
    }
    return byDex;
  }, [homeChallenges]);
  const homeChallengeDexes = useMemo(() => new Set(homeChallengesByDex.keys()), [homeChallengesByDex]);
  const supportedLivingDexDexes = useMemo(() => new Set(allImportEntries
    .filter((entry) => !entry.collection && entry.availability !== "excluded" && entry.normalEligible !== false)
    .map((entry) => entry.dex)), [allImportEntries]);
  const entryIsOwned = useCallback((entry: PlannedEntry) => {
    if (normalLivingDex) return livingDexOwned.has(entry.dex) || derivedGenericProgress.normalSpecies.has(entry.dex);
    if (!entry.genericEntry) return owned.has(entry.planId);
    if (owned.has(entry.planId) || derivedGenericProgress.keys.has(entry.planId)) return true;
    const genderSpecific = entry.requirements?.gender === "male" || entry.requirements?.gender === "female";
    return entry.variant === "normal" && !entry.form && !genderSpecific && livingDexOwned.has(entry.dex);
  }, [derivedGenericProgress, livingDexOwned, normalLivingDex, owned]);
  const generationSummary = useMemo(() => Array.from({ length: 9 }, (_, index) => {
    const generation = index + 1;
    const entries = plannedEntries.filter((entry) => generationForDex(entry.dex) === generation);
    const registered = entries.filter(entryIsOwned).length;
    return { generation, total: entries.length, registered, progress: entries.length ? Math.round((registered / entries.length) * 100) : 0 };
  }).filter((item) => item.total > 0), [entryIsOwned, plannedEntries]);
  const originSummary = useMemo(() => {
    const groups = new Map<string, { key: string; total: number; registered: number }>();
    plannedEntries.forEach((entry) => {
      const key = normalLivingDex ? "living-dex" : entry.groupKey;
      const current = groups.get(key) ?? { key, total: 0, registered: 0 };
      current.total += 1;
      current.registered += Number(entryIsOwned(entry));
      groups.set(key, current);
    });
    return [...groups.values()].sort((a, b) => b.total - a.total);
  }, [entryIsOwned, normalLivingDex, plannedEntries]);
  const availabilitySummary = useMemo(() => AVAILABILITY_STATUSES.map((status) => {
    const entries = plannedEntries.filter((entry) => availabilityForEntry(entry) === status);
    return { status, total: entries.length, registered: entries.filter(entryIsOwned).length };
  }), [entryIsOwned, plannedEntries]);
  const gameMissingEntries = useMemo(() => locatedEntries.filter(({ entry }) => !entryIsOwned(entry) && matchesGamePlan(entry, selectedGamePlan)), [entryIsOwned, locatedEntries, selectedGamePlan]);
  const capacityBoxes = Math.ceil(capacity / 30);
  const totalPages = Math.max(1, Math.ceil(Math.max(boxes.length, capacityBoxes) / 30));
  const ownedCount = useMemo(() => plannedEntries.reduce((sum, entry) => sum + Number(entryIsOwned(entry)), 0), [entryIsOwned, plannedEntries]);
  const progress = plannedEntries.length ? Math.round((ownedCount / plannedEntries.length) * 100) : 0;
  const selectedBox = selectedBoxIndex === null ? null : boxes[selectedBoxIndex];
  const activeBoxTheme = selectedBox ? resolveBoxTheme(themeConfig, selectedBox.groupKey, selectedBox.number) : themeConfig.global;
  const pageBoxes = Array.from({ length: 30 }, (_, offset) => boxes[pageIndex * 30 + offset] ?? null);
  const filterKey = `${selectedMarks.join("|")}:${selectedCollections.join("|")}:${variants.shiny}:${variants.normal}:${acquisitions.own}:${acquisitions.trade}:${acquisitions.event}:${acquisitions.external}:${includeNonShinySpecials}:${includeEventMythicals}:${genderMode}:${formOptions.alternate}:${formOptions.alcremie}:${formOptions.minior}:${normalLivingDex}:${originMarkDex}:${collectionPreset}:${homeChallengesOnly}`;

  const applyCollectionRecords = useCallback((records: CollectionRecord[], source: ImportNotice["source"]) => {
    const summary = matchCollectionRecords(records, allImportEntries, pokemonNames ?? {}, owned);
    if (summary.newPlanIds.length) {
      const importedIds = new Set(summary.newPlanIds);
      const importedEntries = allImportEntries.filter((entry) => importedIds.has(`${entry.id}:normal`) || importedIds.has(`${entry.id}:shiny`));
      setOwned((current) => new Set([...current, ...summary.newPlanIds]));
      progressHistoryRef.current = [];
      setUndoDepth(0);
      setCollectionPreset("custom");
      setSelectedMarks((current) => [...new Set([...current, ...importedEntries.map((entry) => entry.mark).filter((mark): mark is string => Boolean(mark))])]);
      setSelectedCollections((current) => [...new Set([...current, ...importedEntries.map((entry) => entry.collection).filter((collection): collection is string => Boolean(collection && COLLECTIONS.includes(collection)))])]);
      setVariants((current) => ({
        normal: current.normal || summary.newPlanIds.some((id) => id.endsWith(":normal")),
        shiny: current.shiny || summary.newPlanIds.some((id) => id.endsWith(":shiny")),
      }));
      setAcquisitions({ own: true, trade: true, event: true, external: true });
      setAvailabilityFilters(DEFAULT_AVAILABILITY_FILTERS);
      if (importedEntries.some((entry) => entry.genderVariant === "extra")) setGenderMode("all");
      if (importedEntries.some((entry) => entry.form)) setFormOptions((current) => ({
        ...current,
        alternate: true,
        alcremie: current.alcremie || importedEntries.some((entry) => entry.dex === 869),
        minior: current.minior || importedEntries.some((entry) => entry.dex === 774),
      }));
      if (importedEntries.some((entry) => entry.collection && !entry.shinyEligible)) setIncludeNonShinySpecials(true);
    }
    setImportNotice({ ...summary, source });
  }, [allImportEntries, owned, pokemonNames]);

  useEffect(() => {
    if (!hydrated || !dataset || !specialDataset || !pokemonNames || transferProcessedRef.current) return;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (!params.has("ocr")) { transferProcessedRef.current = true; return; }
    transferProcessedRef.current = true;
    const clearTransferFragment = () => {
      params.delete("ocr");
      const nextHash = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ""}`);
    };
    decodeOcrTransferHash(window.location.hash)
      .then((records) => { if (records) applyCollectionRecords(records, "ocr"); })
      .catch(() => window.alert(copy(language, "invalid_collection")))
      .finally(clearTransferFragment);
  }, [applyCollectionRecords, dataset, hydrated, language, pokemonNames, specialDataset]);

  useEffect(() => {
    setPageIndex(0);
    setSelectedBoxIndex(null);
    setHighlightedPlanId(null);
    setDetailEntry(null);
  }, [filterKey]);
  useEffect(() => setPageIndex((current) => Math.min(current, totalPages - 1)), [totalPages]);

  useEffect(() => {
    if (viewMode !== "boxes" || selectedBoxIndex === null || !highlightedPlanId) return;
    const frame = window.requestAnimationFrame(() => highlightedEntryRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
      inline: "center",
    }));
    const timer = window.setTimeout(() => setHighlightedPlanId(null), 2800);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [viewMode, selectedBoxIndex, highlightedPlanId]);

  useEffect(() => {
    if (viewMode !== "global") return;
    const closeTooltip = () => setGlobalTooltip(null);
    window.addEventListener("scroll", closeTooltip, true);
    window.addEventListener("resize", closeTooltip);
    return () => {
      window.removeEventListener("scroll", closeTooltip, true);
      window.removeEventListener("resize", closeTooltip);
    };
  }, [viewMode]);

  const matchesSearch = (entry: PlannedEntry) => {
    const matchesQuery = !query || normalize(`${displayName(entry)} ${entry.name} ${displayForm(entry) ?? ""} ${entry.form ?? ""} ${entry.displayDetail ?? ""} ${entry.note ?? ""} ${entry.gender ? t(entry.gender) : ""} ${entry.dex} ${String(entry.dex).padStart(3, "0")} ${String(entry.dex).padStart(4, "0")} ${entry.mark ?? ""} ${entry.groupLabel} ${entry.trainerName ?? ""} ${entry.trainerId ?? ""} ${entry.nickname ?? ""} ${entry.ball ?? ""} ${entry.nature ?? ""} ${entry.ability ?? ""} ${entry.heldItem ?? ""} ${entry.eventYear ?? ""} ${entry.eventLocation ?? ""} ${entry.eventType ?? ""} ${(entry.moves ?? []).join(" ")} ${(entry.ribbons ?? []).join(" ")} ${JSON.stringify(entry.requirements ?? {})} ${entry.ownOt ? t("your_ot") : t("foreign_ot")}`).includes(normalize(query));
    return matchesQuery
      && (!missingOnly || !entryIsOwned(entry))
      && (!favoritesOnly || favorites.has(entry.planId))
      && (!homeChallengesOnly || homeChallengeDexes.has(entry.dex))
      && availabilityFilters[availabilityForEntry(entry)];
  };

  const visibleGlobalEntries = locatedEntries.filter(({ entry }) => matchesSearch(entry));
  const visibleGlobalOwned = visibleGlobalEntries.reduce((sum, { entry }) => sum + Number(entryIsOwned(entry)), 0);

  const showGlobalTooltip = (element: HTMLButtonElement, located: LocatedEntry) => {
    const rect = element.getBoundingClientRect();
    const width = Math.min(236, window.innerWidth - 32);
    const left = Math.max(16, Math.min(window.innerWidth - width - 16, rect.left + (rect.width - width) / 2));
    const above = rect.bottom + 245 > window.innerHeight && rect.top > 245;
    setGlobalTooltip({ located, left, top: above ? rect.top - 10 : rect.bottom + 10, above });
  };

  const locateEntryInBoxes = (located: LocatedEntry) => {
    setGlobalTooltip(null);
    setPageIndex(Math.floor(located.box.globalIndex / 30));
    setSelectedBoxIndex(located.box.globalIndex);
    setKeyboardSlotIndex(located.slotIndex);
    setHighlightedPlanId(located.entry.planId);
    setLocationAnnouncement(`${displayName(located.entry)} · ${t("box")} ${String(located.box.globalIndex + 1).padStart(3, "0")} · ${t("slot")} ${String(located.slotIndex + 1).padStart(2, "0")}`);
    setViewMode("boxes");
  };

  const rememberProgressChange = useCallback((nextOwned: Set<string>, nextLivingDexOwned: Set<number>) => {
    progressHistoryRef.current = [...progressHistoryRef.current.slice(-29), { owned: new Set(owned), livingDexOwned: new Set(livingDexOwned) }];
    setUndoDepth(progressHistoryRef.current.length);
    setOwned(nextOwned);
    setLivingDexOwned(nextLivingDexOwned);
  }, [livingDexOwned, owned]);

  const undoOwned = useCallback(() => {
    const previous = progressHistoryRef.current.pop();
    if (!previous) return;
    setOwned(previous.owned);
    setLivingDexOwned(previous.livingDexOwned);
    setUndoDepth(progressHistoryRef.current.length);
  }, []);

  const toggleOwned = useCallback((entry: PlannedEntry) => {
    const nextOwned = new Set(owned);
    const nextLivingDexOwned = new Set(livingDexOwned);
    const currentlyOwned = entryIsOwned(entry);
    if (normalLivingDex) {
      if (currentlyOwned) nextLivingDexOwned.delete(entry.dex); else nextLivingDexOwned.add(entry.dex);
    } else {
      if (currentlyOwned) nextOwned.delete(entry.planId); else nextOwned.add(entry.planId);
      if (entry.genericEntry && entry.variant === "normal") {
        if (currentlyOwned) nextLivingDexOwned.delete(entry.dex); else nextLivingDexOwned.add(entry.dex);
      }
    }
    rememberProgressChange(nextOwned, nextLivingDexOwned);
  }, [entryIsOwned, livingDexOwned, normalLivingDex, owned, rememberProgressChange]);

  const toggleFavorite = (planId: string) => setFavorites((current) => {
    const next = new Set(current);
    if (next.has(planId)) next.delete(planId); else next.add(planId);
    return next;
  });

  const toggleEntries = (entries: PlannedEntry[]) => {
    const allOwned = entries.length > 0 && entries.every(entryIsOwned);
    const affected = entries.filter(entryIsOwned).length;
    if (allOwned && affected >= 30 && !window.confirm(t("confirm_unmark_many").replace("{count}", affected.toLocaleString(locale)))) return;
    const nextOwned = new Set(owned);
    const nextLivingDexOwned = new Set(livingDexOwned);
    entries.forEach((entry) => {
      if (normalLivingDex) {
        if (allOwned) nextLivingDexOwned.delete(entry.dex); else nextLivingDexOwned.add(entry.dex);
        return;
      }
      if (allOwned) nextOwned.delete(entry.planId); else nextOwned.add(entry.planId);
      if (entry.genericEntry && entry.variant === "normal") {
        if (allOwned) nextLivingDexOwned.delete(entry.dex); else nextLivingDexOwned.add(entry.dex);
      }
    });
    if (entries.length) rememberProgressChange(nextOwned, nextLivingDexOwned);
  };

  const resetProgress = () => {
    const currentSize = owned.size + livingDexOwned.size;
    if (!currentSize || !window.confirm(t("confirm_reset_progress").replace("{count}", currentSize.toLocaleString(locale)))) return;
    rememberProgressChange(new Set(), new Set());
  };

  const renamePlannedBox = (box: PlannedBox, name: string) => setBoxNameOverrides((current) => {
    const key = `${box.groupKey}:${box.number}`;
    const next = { ...current };
    const trimmed = name.slice(0, 48);
    if (trimmed) next[key] = trimmed; else delete next[key];
    return next;
  });

  const createCustomBox = () => {
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `custom-${Date.now()}`;
    const next: CustomBox = { id, name: `${t("custom_box")} ${customBoxes.length + 1}`, planIds: [] };
    setCustomBoxes((current) => [...current, next]);
    setCustomBoxQuery("");
    setCustomBoxEditorId(id);
  };

  const deleteCustomBox = (box: CustomBox) => {
    if (!window.confirm(t("confirm_delete_custom_box").replace("{name}", box.name))) return;
    setCustomBoxes((current) => current.filter((item) => item.id !== box.id));
    if (customBoxEditorId === box.id) setCustomBoxEditorId(null);
  };

  const updateCustomBox = (id: string, update: (box: CustomBox) => CustomBox) => setCustomBoxes((current) => current.map((box) => box.id === id ? update(box) : box));

  const toggleCustomBoxEntry = (boxId: string, planId: string) => updateCustomBox(boxId, (box) => {
    if (box.planIds.includes(planId)) return { ...box, planIds: box.planIds.filter((id) => id !== planId) };
    if (box.planIds.length >= 30) { window.alert(t("custom_box_full")); return box; }
    return { ...box, planIds: [...box.planIds, planId] };
  });

  const markProfileCustom = () => { setCollectionPreset("custom"); setNormalLivingDex(false); setOriginMarkDex(false); };
  const toggleMark = (mark: string) => { markProfileCustom(); setSelectedMarks((current) => current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark]); };
  const toggleCollection = (collection: string) => { markProfileCustom(); setSelectedCollections((current) => current.includes(collection) ? current.filter((item) => item !== collection) : [...current, collection]); };
  const setVariant = (variant: Variant) => {
    markProfileCustom();
    setVariants((current) => {
      const next = { ...current, [variant]: !current[variant] };
      return next.shiny || next.normal ? next : current;
    });
  };
  const setAcquisition = (acquisition: Acquisition) => {
    markProfileCustom();
    setAcquisitions((current) => {
      const next = { ...current, [acquisition]: !current[acquisition] };
      return next.own || next.trade || next.event || next.external ? next : current;
    });
  };

  const applyCollectionPreset = (preset: CollectionPreset) => {
    setCollectionPreset(preset);
    if (preset === "custom") return;
    setAvailabilityFilters(DEFAULT_AVAILABILITY_FILTERS);
    setFavoritesOnly(false);
    setHomeChallengesOnly(false);
    setNormalLivingDex(preset === "basic");
    setOriginMarkDex(preset === "origin");
    if (preset === "basic") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: false, alcremie: false, minior: false }); }
    if (preset === "final") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: true, alcremie: false, minior: false }); }
    if (preset === "regional") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: true, alcremie: false, minior: false }); }
    if (preset === "forms_lite") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("all"); setFormOptions({ alternate: true, alcremie: true, minior: true }); }
    if (preset === "forms") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("all"); setFormOptions({ alternate: true, alcremie: true, minior: true }); }
    if (preset === "shiny") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("all"); setFormOptions({ alternate: true, alcremie: true, minior: true }); }
    if (preset === "origin") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: false, alcremie: false, minior: false }); }
    if (preset === "noah") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("all"); setFormOptions({ alternate: false, alcremie: false, minior: false }); }
    if (preset === "original_generation") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: false, alcremie: false, minior: false }); }
    if (preset === "completionist") { setVariants({ shiny: true, normal: true }); setAcquisitions({ own: true, trade: true, event: true, external: true }); setIncludeNonShinySpecials(true); setSelectedMarks(MARKS); setSelectedCollections(COLLECTIONS); setGenderMode("all"); setFormOptions({ alternate: true, alcremie: true, minior: true }); }
  };

  const toggleAvailability = (status: AvailabilityStatus) => setAvailabilityFilters((current) => {
    const next = { ...current, [status]: !current[status] };
    return AVAILABILITY_STATUSES.some((key) => next[key]) ? next : current;
  });

  const jumpToBox = (globalIndex: number) => {
    setPageIndex(Math.floor(globalIndex / 30));
    setSelectedBoxIndex(globalIndex);
    setKeyboardSlotIndex(0);
    setViewMode("boxes");
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = Boolean(target?.matches("input, textarea, select") || target?.isContentEditable);
      if (isTyping || themeOpen || detailEntry) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoOwned();
        return;
      }
      if (event.key === "/" && viewMode !== "summary") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (viewMode !== "boxes") return;
      if (event.key === "PageUp" || event.key === "PageDown") {
        event.preventDefault();
        const direction = event.key === "PageDown" ? 1 : -1;
        if (selectedBox) jumpToBox(Math.max(0, Math.min(boxes.length - 1, selectedBox.globalIndex + direction)));
        else setPageIndex((current) => Math.max(0, Math.min(totalPages - 1, current + direction)));
        return;
      }
      if (!selectedBox) return;
      const movement: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 };
      if (event.key in movement) {
        event.preventDefault();
        setKeyboardSlotIndex((current) => Math.max(0, Math.min(29, current + movement[event.key])));
        return;
      }
      const entry = selectedBox.entries[keyboardSlotIndex];
      if (!entry) return;
      if (event.code === "Space") { event.preventDefault(); toggleOwned(entry); }
      if (event.key.toLowerCase() === "f") { event.preventDefault(); toggleFavorite(entry.planId); }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [boxes.length, detailEntry, keyboardSlotIndex, selectedBox, themeOpen, toggleOwned, totalPages, undoOwned, viewMode, favorites]);

  const openThemeDialog = () => {
    const current = selectedBox ? resolveBoxTheme(themeConfig, selectedBox.groupKey, selectedBox.number) : themeConfig.global;
    setThemeScope(selectedBox ? "box" : "all");
    setThemeDraft(current);
    if (current.kind === "preset") {
      const game = THEME_GAMES.find((option) => option.id === current.game);
      if (game?.category === "concept") {
        setConceptGame(current.game);
        setThemeTab("concept");
      } else setThemeTab(current.game);
    }
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
    if (tab === "concept") {
      setThemeDraft(createPresetTheme(conceptGame));
      return;
    }
    setThemeDraft(createPresetTheme(tab));
  };

  const chooseConceptGame = (game: ThemeGame) => {
    setConceptGame(game);
    setThemeTab("concept");
    setThemeDraft(createPresetTheme(game));
  };

  const chooseWallpaper = (game: ThemeGame, wallpaper: string) => {
    const option = THEME_GAMES.find((candidate) => candidate.id === game);
    if (option?.category === "concept") {
      setConceptGame(game);
      setThemeTab("concept");
    } else setThemeTab(game);
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

  const createBackupPayload = () => ({
    type: "home-checklist-backup",
    version: BACKUP_VERSION,
    catalogVersion: CATALOG_VERSION,
    exportedAt: new Date().toISOString(),
    progress: { owned: [...owned], livingDexOwned: [...livingDexOwned], favorites: [...favorites] },
    configuration: {
      selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials,
      genderMode, formOptions, normalLivingDex, originMarkDex, collectionPreset,
      availabilityFilters, favoritesOnly, homeChallengesOnly, language, capacity, viewMode, missingOnly,
      selectedGamePlan, collectionGoal, collectionNotes, boxNameOverrides, customBoxes,
    },
    themes: themeConfig,
  });

  const exportBackup = (format: "json" | "project") => {
    const projectFile = format === "project";
    downloadText(
      projectFile ? "home-checklist-backup.homechecklist" : "home-checklist-backup.json",
      JSON.stringify(createBackupPayload(), null, 2),
      projectFile ? "application/vnd.home-checklist+json" : "application/json",
    );
  };

  const exportProgressCsv = () => downloadText("home-checklist-progress.csv", buildOwnedProgressCsv(owned, allImportEntries), "text/csv;charset=utf-8");

  const restoreBackup = (raw: unknown) => {
    if (!raw || typeof raw !== "object") throw new Error("invalid");
    const value = raw as Record<string, unknown>;
    const progress = (value.progress && typeof value.progress === "object" ? value.progress : value) as Record<string, unknown>;
    const configuration = (value.configuration && typeof value.configuration === "object" ? value.configuration : value) as Record<string, unknown>;
    if (!Array.isArray(progress.owned)) throw new Error("invalid");
    const restoredOwned = new Set(progress.owned.filter((id): id is string => typeof id === "string"));
    const restoredLivingDexOwned = new Set(Array.isArray(progress.livingDexOwned)
      ? progress.livingDexOwned.filter((dex): dex is number => typeof dex === "number" && Number.isInteger(dex) && dex > 0)
      : configuration.normalLivingDex === true
        ? [...restoredOwned].map((planId) => databaseChoiceByPlanId.get(planId)?.dex).filter((dex): dex is number => Boolean(dex))
        : []);
    setOwned(restoredOwned);
    setLivingDexOwned(restoredLivingDexOwned);
    livingDexProgressStoredRef.current = true;
    livingDexMigrationCheckedRef.current = true;
    progressHistoryRef.current = [];
    setUndoDepth(0);
    if (Array.isArray(progress.favorites)) setFavorites(new Set(progress.favorites.filter((id): id is string => typeof id === "string")));
    if (Array.isArray(configuration.selectedMarks)) setSelectedMarks(configuration.selectedMarks.filter((mark): mark is string => typeof mark === "string" && MARKS.includes(mark)));
    if (Array.isArray(configuration.selectedCollections)) {
      const savedCollections = configuration.selectedCollections.filter((collection): collection is string => typeof collection === "string" && COLLECTIONS.includes(collection));
      setSelectedCollections(Number(value.catalogVersion) >= CATALOG_VERSION ? savedCollections : [...new Set([...savedCollections, "radar"])]);
    }
    const savedVariants = configuration.variants as Record<string, unknown> | undefined;
    if (savedVariants) setVariants({ shiny: Boolean(savedVariants.shiny), normal: Boolean(savedVariants.normal) });
    const savedAcquisitions = configuration.acquisitions as Record<string, unknown> | undefined;
    if (savedAcquisitions) setAcquisitions({
      own: Boolean(savedAcquisitions.own),
      trade: typeof savedAcquisitions.trade === "boolean" ? savedAcquisitions.trade : true,
      event: Boolean(savedAcquisitions.event),
      external: typeof savedAcquisitions.external === "boolean" ? savedAcquisitions.external : true,
    });
    if (typeof configuration.includeNonShinySpecials === "boolean") setIncludeNonShinySpecials(configuration.includeNonShinySpecials);
    if (configuration.genderMode === "notable" || configuration.genderMode === "all") setGenderMode(configuration.genderMode);
    const savedFormOptions = configuration.formOptions as Record<string, unknown> | undefined;
    if (savedFormOptions) setFormOptions({
      alternate: typeof savedFormOptions.alternate === "boolean" ? savedFormOptions.alternate : DEFAULT_FORM_OPTIONS.alternate,
      alcremie: typeof savedFormOptions.alcremie === "boolean" ? savedFormOptions.alcremie : DEFAULT_FORM_OPTIONS.alcremie,
      minior: typeof savedFormOptions.minior === "boolean" ? savedFormOptions.minior : DEFAULT_FORM_OPTIONS.minior,
    });
    if (typeof configuration.normalLivingDex === "boolean") setNormalLivingDex(configuration.normalLivingDex);
    if (typeof configuration.originMarkDex === "boolean") setOriginMarkDex(configuration.originMarkDex);
    if (typeof configuration.collectionPreset === "string" && COLLECTION_PRESETS.includes(configuration.collectionPreset as CollectionPreset)) setCollectionPreset(configuration.collectionPreset as CollectionPreset);
    const savedAvailabilityFilters = configuration.availabilityFilters as Record<string, unknown> | undefined;
    if (savedAvailabilityFilters) setAvailabilityFilters(Object.fromEntries(AVAILABILITY_STATUSES.map((status) => [status, savedAvailabilityFilters[status] !== false])) as AvailabilityFilters);
    if (typeof configuration.favoritesOnly === "boolean") setFavoritesOnly(configuration.favoritesOnly);
    if (typeof configuration.homeChallengesOnly === "boolean") setHomeChallengesOnly(configuration.homeChallengesOnly);
    if (LANGUAGE_OPTIONS.some((option) => option.code === configuration.language)) setLanguage(configuration.language as UiLanguage);
    if (configuration.capacity === 6000 || configuration.capacity === 8000) setCapacity(configuration.capacity);
    if (configuration.viewMode === "boxes" || configuration.viewMode === "global" || configuration.viewMode === "summary") setViewMode(configuration.viewMode);
    if (typeof configuration.missingOnly === "boolean") setMissingOnly(configuration.missingOnly);
    if (typeof configuration.selectedGamePlan === "string" && GAME_PLANS.some((game) => game.id === configuration.selectedGamePlan)) setSelectedGamePlan(configuration.selectedGamePlan as GamePlanId);
    if (typeof configuration.collectionGoal === "string") setCollectionGoal(configuration.collectionGoal.slice(0, 8));
    if (typeof configuration.collectionNotes === "string") setCollectionNotes(configuration.collectionNotes.slice(0, 2_000));
    if (configuration.boxNameOverrides && typeof configuration.boxNameOverrides === "object") setBoxNameOverrides(Object.fromEntries(Object.entries(configuration.boxNameOverrides).filter(([, name]) => typeof name === "string").map(([key, name]) => [key, (name as string).slice(0, 48)])));
    if (Array.isArray(configuration.customBoxes)) setCustomBoxes(configuration.customBoxes.filter((box: unknown): box is CustomBox => Boolean(box && typeof box === "object" && typeof (box as CustomBox).id === "string" && typeof (box as CustomBox).name === "string" && Array.isArray((box as CustomBox).planIds))).map((box: CustomBox) => ({ id: box.id, name: box.name.slice(0, 48), planIds: box.planIds.filter((id) => typeof id === "string").slice(0, 30) })));
    const parsedThemes = parseThemeConfig(value.themes);
    if (parsedThemes) setThemeConfig(parsedThemes);
    setLocationAnnouncement(t("backup_imported"));
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const looksJson = file.name.endsWith(".json") || file.name.endsWith(".homechecklist") || text.trimStart().startsWith("{");
      if (looksJson) {
        const value = JSON.parse(text);
        if (value?.s === "pokemon-home-ocr") applyCollectionRecords(parseCompactTransfer(value), "csv");
        else restoreBackup(value);
      } else {
        applyCollectionRecords(parseCollectionCsv(text), "csv");
      }
    } catch { window.alert(t("invalid_collection")); }
    event.target.value = "";
  };

  const importAustinJohnData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAustinImportBusy(true);
    setAustinNotice(null);
    setImportNotice(null);
    try {
      const workbook = parseAustinJohnWorkbook(await file.arrayBuffer());
      setAustinPreview(buildAustinJohnPreview(workbook, supportedLivingDexDexes, livingDexOwned));
    } catch (error) {
      const key = error instanceof AustinJohnImportError
        ? error.code === "shiny-workbook" ? "austin_shiny_not_supported" : error.code === "file-too-large" ? "austin_file_too_large" : "austin_invalid_workbook"
        : "austin_invalid_workbook";
      window.alert(t(key));
    } finally {
      setAustinImportBusy(false);
      event.target.value = "";
    }
  };

  const applyAustinJohnImport = (mode: "merge" | "replace") => {
    if (!austinPreview) return;
    const currentPreview = buildAustinJohnPreview(austinPreview, supportedLivingDexDexes, livingDexOwned);
    const importedOwned = new Set(currentPreview.matchedOwnedDexes);
    const next = mode === "merge" ? new Set([...livingDexOwned, ...importedOwned]) : importedOwned;
    rememberProgressChange(new Set(owned), next);
    applyCollectionPreset("basic");
    setAustinNotice({ imported: importedOwned.size, newOwned: currentPreview.newOwned, mode });
    setAustinPreview(null);
    setLocationAnnouncement(t("austin_import_complete"));
  };

  const exportThemeBackup = () => {
    const payload = { type: "origin-marks-box-themes", version: 1, exportedAt: new Date().toISOString(), themes: themeConfig };
    downloadText("origin-marks-themes-backup.json", JSON.stringify(payload, null, 2), "application/json");
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

  if (loadError) return <main className="state-screen"><img className="brand-ball" src={assetUrl("assets/strange-ball.png")} alt="" /><h1>{t("load_error")}</h1><p>{t("reload")}</p></main>;
  if (!dataset || !specialDataset || !pokemonNames) return <main className="state-screen"><img className="brand-ball loading" src={assetUrl("assets/strange-ball.png")} alt="" /><p>{t("loading")}</p></main>;

  const markCounts = Object.fromEntries(MARKS.map((mark) => {
    const entriesForMark = buildBoxes(dataset.entries, specialDataset.entries, [mark], [], variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, collectionPreset, speciesRules, language).flatMap((box) => box.entries);
    return [mark, entriesForMark.length];
  }));
  const collectionCounts = Object.fromEntries(COLLECTIONS.map((collection) => {
    const entriesForCollection = buildBoxes([], specialDataset.entries, [], [collection], variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, collectionPreset, speciesRules, language).flatMap((box) => box.entries);
    return [collection, entriesForCollection.length];
  }));
  const availabilityCounts = Object.fromEntries(AVAILABILITY_STATUSES.map((status) => [status, plannedEntries.filter((entry) => availabilityForEntry(entry) === status).length])) as Record<AvailabilityStatus, number>;
  const favoriteCount = plannedEntries.filter((entry) => favorites.has(entry.planId)).length;
  const availabilityFiltering = AVAILABILITY_STATUSES.some((status) => !availabilityFilters[status]);
  const visiblePageEntries = pageBoxes.flatMap((box) => box?.entries ?? []);
  const pageAllOwned = visiblePageEntries.length > 0 && visiblePageEntries.every(entryIsOwned);
  const themeGameOption = themeTab === "custom" ? null : themeTab === "concept" ? CONCEPT_ART_GAMES.find((game) => game.id === conceptGame) ?? CONCEPT_ART_GAMES[0] : BOX_THEME_GAMES.find((game) => game.id === themeTab) ?? BOX_THEME_GAMES[0];
  const themeCanApply = themeTab !== "custom" || themeDraft.kind === "custom";
  const savedMinutesAgo = lastSavedAt ? Math.max(0, Math.floor((clock - lastSavedAt) / 60_000)) : null;
  const savedWhen = savedMinutesAgo === null
    ? t("not_saved_yet")
    : savedMinutesAgo < 1 ? t("saved_now") : new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-savedMinutesAgo, "minute");
  const boxBeingRenamed = boxes[renameBoxIndex] ?? null;
  const customBoxEditor = customBoxes.find((box) => box.id === customBoxEditorId) ?? null;
  const normalizedCustomBoxQuery = normalize(customBoxQuery);
  const customBoxSearchResults = databaseChoices.filter((entry) => !normalizedCustomBoxQuery || normalize(`${displayName(entry)} ${displayForm(entry) ?? ""} ${entry.dex} ${entry.groupLabel}`).includes(normalizedCustomBoxQuery)).slice(0, 120);

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mobile-filter" onClick={() => setFiltersOpen(true)} aria-label={t("open_filters")}>☰</button>
        <div className="brand-lockup"><a className="brand-link" href="https://github.com/Jacs720/Home-Checklist" target="_blank" rel="noreferrer" aria-label={t("github_repo")}><img className="brand-ball" src={assetUrl("assets/strange-ball.png")} alt="" /></a><h1>Home checklist</h1></div>
        <div className="top-actions">
          <div className="progress-summary" aria-label={`${progress}%`}>
            <div><strong>{ownedCount.toLocaleString(locale)}</strong><span>{t("of")} {plannedEntries.length.toLocaleString(locale)}</span></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div><b>{progress}%</b>
          </div>
          <div className="top-view-control">
            <button type="button" className={`summary-header-action ${viewMode === "summary" ? "active" : ""}`} aria-pressed={viewMode === "summary"} onClick={() => { setViewMode("summary"); setGlobalTooltip(null); }}><span aria-hidden="true">◫</span><b>{t("summary_view")}</b></button>
            {viewMode === "summary" && <button type="button" className="top-view-close" aria-label={t("close_view")} title={t("close_view")} onClick={() => { setViewMode("boxes"); setGlobalTooltip(null); }}>×</button>}
          </div>
          <div className="language-menu">
            <button className="language-trigger" type="button" aria-label={t("language")} aria-expanded={languageOpen} onClick={() => setLanguageOpen((value) => !value)}>
              <img src={assetUrl(`languages/${language}.png`)} alt="" /><span>{languageOption.label}</span><b>⌄</b>
            </button>
            {languageOpen && <div className="language-options" role="listbox" aria-label={t("language")}>
              {LANGUAGE_OPTIONS.map((option) => <button type="button" role="option" aria-selected={language === option.code} className={language === option.code ? "active" : ""} key={option.code} onClick={() => { setLanguage(option.code); setLanguageOpen(false); }}><img src={assetUrl(`languages/${option.code}.png`)} alt="" /><span>{option.label}</span></button>)}
            </div>}
          </div>
        </div>
      </header>
      <span className="sr-only" role="status" aria-live="polite">{locationAnnouncement}</span>

      {importNotice && <section className="import-notice" role="status" aria-live="polite">
        <span className="import-notice-icon" aria-hidden="true">✓</span>
        <div>
          <strong>{importNotice.source === "ocr" ? t("ocr_import_complete") : t("collection_import_complete")}</strong>
          <p>{t("identified")}: <b>{importNotice.rowsRead.toLocaleString(locale)}</b> · {t("matched")}: <b>{importNotice.matchedRows.toLocaleString(locale)}</b> · {t("new_entries")}: <b>{importNotice.newPlanIds.length.toLocaleString(locale)}</b>{importNotice.alreadyOwned ? ` · ${t("already_marked")}: ${importNotice.alreadyOwned.toLocaleString(locale)}` : ""}{importNotice.unmatched ? ` · ${t("unmatched")}: ${importNotice.unmatched.toLocaleString(locale)}` : ""}{importNotice.ambiguous ? ` · ${t("ambiguous")}: ${importNotice.ambiguous.toLocaleString(locale)}` : ""}</p>
        </div>
        <button aria-label={t("close_import_summary")} onClick={() => setImportNotice(null)}>×</button>
      </section>}

      {austinNotice && <section className="import-notice" role="status" aria-live="polite">
        <span className="import-notice-icon" aria-hidden="true">✓</span>
        <div>
          <strong>{t("austin_import_complete")}</strong>
          <p>{t("austin_owned_imported")}: <b>{austinNotice.imported.toLocaleString(locale)}</b> · {t("new_entries")}: <b>{austinNotice.newOwned.toLocaleString(locale)}</b> · {t(austinNotice.mode === "merge" ? "austin_merge" : "austin_replace")} · {t("austin_origin_unchanged")}</p>
        </div>
        <button aria-label={t("close_import_summary")} onClick={() => setAustinNotice(null)}>×</button>
      </section>}

      {austinPreview && <div className="theme-modal-layer austin-modal-layer">
        <button className="theme-modal-scrim" aria-label={t("austin_cancel")} onClick={() => setAustinPreview(null)} />
        <section className="austin-dialog" role="dialog" aria-modal="true" aria-labelledby="austin-dialog-title">
          <header className="austin-dialog-header">
            <div><p className="eyebrow teal">{t("austin_detected")}</p><h2 id="austin-dialog-title">Austin John Plays HOME Organizer</h2><p>{t("austin_preview_intro")}</p></div>
            <button className="theme-close" aria-label={t("austin_cancel")} onClick={() => setAustinPreview(null)}>×</button>
          </header>
          <div className="austin-dialog-body">
            <dl className="austin-source">
              <div><dt>{t("austin_source_sheet")}</dt><dd>{austinPreview.sheetName}</dd></div>
              {austinPreview.versionLabel && <div><dt>{t("austin_version")}</dt><dd>{austinPreview.versionLabel}</dd></div>}
              <div><dt>{t("austin_import_to")}</dt><dd>{t("normal_living_dex")}</dd></div>
            </dl>
            <div className="austin-stat-grid">
              <div><span>{t("austin_matched")}</span><b>{austinPreview.matched.toLocaleString(locale)}</b></div>
              <div><span>{t("austin_owned")}</span><b>{austinPreview.owned.toLocaleString(locale)}</b></div>
              <div><span>{t("austin_missing")}</span><b>{austinPreview.missing.toLocaleString(locale)}</b></div>
              <div className={austinPreview.unmatched ? "warning" : ""}><span>{t("unmatched")}</span><b>{austinPreview.unmatched.toLocaleString(locale)}</b></div>
            </div>
            <p className="austin-origin-note"><b>{t("austin_origin_unknown")}:</b> {t("austin_origin_note")}</p>
            {austinPreview.replaceRemovals > 0 && <p className="austin-replace-note">{t("austin_replace_removes").replace("{count}", austinPreview.replaceRemovals.toLocaleString(locale))}</p>}
          </div>
          <footer className="austin-dialog-actions">
            <button onClick={() => setAustinPreview(null)}>{t("austin_cancel")}</button>
            <button onClick={() => applyAustinJohnImport("merge")}>{t("austin_merge")}</button>
            <button className="austin-replace" onClick={() => applyAustinJohnImport("replace")}>{t("austin_replace")}</button>
          </footer>
        </section>
      </div>}

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
                  {BOX_THEME_GAMES.map((game) => <button role="tab" aria-selected={themeTab === game.id} className={themeTab === game.id ? "active" : ""} key={game.id} onClick={() => chooseThemeTab(game.id)}>{game.shortLabel}</button>)}
                  <button role="tab" aria-selected={themeTab === "concept"} className={themeTab === "concept" ? "active" : ""} onClick={() => chooseThemeTab("concept")}>{t("concept_art")}</button>
                  <button role="tab" aria-selected={themeTab === "custom"} className={themeTab === "custom" ? "active" : ""} onClick={() => chooseThemeTab("custom")}>{t("custom")}</button>
                </div>
                {themeGameOption ? (
                  <div role="tabpanel" aria-label={themeGameOption.label}>
                    {themeTab === "concept" && <div className="concept-game-tabs" aria-label={t("concept_art_games")}>{CONCEPT_ART_GAMES.map((game) => <button className={conceptGame === game.id ? "active" : ""} key={game.id} onClick={() => chooseConceptGame(game.id)}>{game.shortLabel}</button>)}</div>}
                    <div className={`wallpaper-gallery ${themeTab === "concept" ? "concept-gallery" : ""}`}>
                      {themeGameOption.wallpapers.map((wallpaper, index) => {
                        const wallpaperLabel = themeGameOption.wallpaperLabels?.[index] ?? String(index + 1).padStart(2, "0");
                        const active = themeDraft.kind === "preset" && themeDraft.wallpaper === wallpaper;
                        return <button aria-label={`${themeGameOption.label} · ${wallpaperLabel}`} aria-pressed={active} className={`${themeTab === "concept" ? "concept-wallpaper " : ""}${active ? "active" : ""}`} key={wallpaper} onClick={() => chooseWallpaper(themeGameOption.id, wallpaper)} style={{ backgroundImage: `linear-gradient(rgba(4, 14, 13, .08), rgba(4, 14, 13, .08)), url("${wallpaper}")` }}><span>{wallpaperLabel}</span></button>;
                      })}
                    </div>
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

      {detailEntry && (() => {
        const { entry, box, slotIndex } = detailEntry;
        const requirements = entry.requirements ?? {};
        const requiredGender = requirements.gender ? t(requirements.gender === "any" ? "any_gender" : requirements.gender) : null;
        const localizedName = displayName(entry);
        const localizedForm = displayForm(entry);
        const artworkUrl = pokemonArtworkUrl(entry);
        const originMarkKey = entry.mark ?? entry.groupKey;
        const availability = availabilityForEntry(entry);
        const favorite = favorites.has(entry.planId);
        const matchingHomeChallenges = homeChallengesByDex.get(entry.dex) ?? [];
        return <div className="entry-modal-layer">
          <button className="entry-modal-scrim" aria-label={t("close_details")} onClick={() => setDetailEntry(null)} />
          <section className="entry-dialog" role="dialog" aria-modal="true" aria-labelledby="entry-dialog-title">
            <header className="entry-dialog-header">
              <div className="entry-dialog-identity">
                {artworkUrl && <img className="entry-dialog-art" src={artworkUrl} alt="" />}
                <div><p className="eyebrow teal">#{String(entry.dex).padStart(4, "0")} · {t("entry_details")}</p><h2 id="entry-dialog-title">{localizedName}{localizedForm && <span> — {localizedForm}</span>}</h2></div>
              </div>
              <div className="entry-dialog-actions"><FavoriteButton active={favorite} label={t(favorite ? "remove_favorite" : "add_favorite")} onClick={() => toggleFavorite(entry.planId)} /><button className="entry-dialog-close" aria-label={t("close_details")} onClick={() => setDetailEntry(null)}>×</button></div>
            </header>
            <div className="entry-badges">
              {entry.genericEntry ? <span className="entry-origin-chip">{t("generic_specimen")}</span> : originMarkIconUrl(originMarkKey) ? <span className="entry-origin-chip"><OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="detail-origin-mark" />{entry.groupLabel}</span> : <span className="entry-origin-chip">{entry.groupLabel}</span>}
              <span className={`availability-badge ${availability}`}>{t(`availability_${availability}`)}</span>
              {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} />}
              <span className={`variant-chip ${entry.variant}`}>{entry.variant === "shiny" && <img src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</span>
            </div>
            <dl className="entry-facts">
              <div><dt>{t("origin_required")}</dt><dd>{entry.genericEntry ? t("no_origin_required") : entry.groupLabel}</dd></div>
              <div><dt>{t("method")}</dt><dd>{t(methodKeyForEntry(entry))}{entry.game ? ` · ${localizeCatalogText(language, entry.game)}` : ""}</dd></div>
              <div><dt>{t("transfer")}</dt><dd>{t(transferKeyForEntry(entry))}</dd></div>
              <div><dt>{t("shiny_available")}</dt><dd>{entry.shinyEligible ? t("yes") : t("shiny_locked")}</dd></div>
              <div><dt>{t("own_ot_possible")}</dt><dd>{entry.ownOt ? t("yes") : t("no")}</dd></div>
              {requiredGender && <div><dt>{t("required_gender")}</dt><dd>{requiredGender}</dd></div>}
              {requirements.originGame && <div><dt>{t("origin_game")}</dt><dd>{requirements.originGame}</dd></div>}
              {requirements.originGeneration && <div><dt>{t("origin_generation")}</dt><dd>{t("generation")} {requirements.originGeneration}</dd></div>}
              {requirements.originRegion && <div><dt>{t("origin_region")}</dt><dd>{groupName(language, requirements.originRegion)}</dd></div>}
              {requirements.pokemonLanguage && <div><dt>{t("pokemon_language")}</dt><dd>{requirements.pokemonLanguage}</dd></div>}
              {requirements.encounterMark && <div><dt>{t("encounter_mark")}</dt><dd>{requirements.encounterMark}</dd></div>}
              {entry.level && <div><dt>{t("level")}</dt><dd>{entry.level}</dd></div>}
              {entry.trainerId && <div><dt>{t("trainer_id")}</dt><dd>{entry.trainerId}</dd></div>}
              {(requirements.ball || entry.ball) && <div><dt>{t("ball")}</dt><dd>{requirements.ball ?? entry.ball}</dd></div>}
              {(requirements.nature || entry.nature) && <div><dt>{t("nature")}</dt><dd>{requirements.nature ?? entry.nature}</dd></div>}
              {(requirements.ability || entry.ability) && <div><dt>{t("ability")}</dt><dd>{requirements.ability ?? entry.ability}</dd></div>}
              {requirements.teraType && <div><dt>{t("tera_type")}</dt><dd>{requirements.teraType}</dd></div>}
              {(requirements.heldItem || entry.heldItem) && <div><dt>{t("held_item")}</dt><dd>{requirements.heldItem ?? entry.heldItem}</dd></div>}
              {requirements.alpha !== undefined && <div><dt>{t("alpha")}</dt><dd>{t(requirements.alpha ? "yes" : "no")}</dd></div>}
              {requirements.gmaxFactor !== undefined && <div><dt>{t("gmax_factor")}</dt><dd>{t(requirements.gmaxFactor ? "yes" : "no")}</dd></div>}
              {(requirements.moves?.length || entry.moves?.length) && <div><dt>{t("moves")}</dt><dd>{(requirements.moves ?? entry.moves)?.join(" · ")}</dd></div>}
              {(requirements.ribbons?.length || entry.ribbons?.length) && <div><dt>{t("ribbons")}</dt><dd>{(requirements.ribbons ?? entry.ribbons)?.join(" · ")}</dd></div>}
              {(entry.startDate || entry.endDate) && <div><dt>{t("event_period")}</dt><dd>{[entry.startDate, entry.endDate].filter(Boolean).join(" — ")}</dd></div>}
              <div><dt>{t("location")}</dt><dd>{t("box")} {String(box.globalIndex + 1).padStart(3, "0")} · {t("slot")} {String(slotIndex + 1).padStart(2, "0")}</dd></div>
            </dl>
            {matchingHomeChallenges.length > 0 && <section className="entry-home-challenges">
              <h3>{t("home_challenges_met")}</h3>
              <p>{t("home_challenges_met_desc")}</p>
              <ul>{matchingHomeChallenges.map((challenge) => <li key={challenge.id}>{localizeHomeChallengeTitle(language, challenge, pokemonNames)}</li>)}</ul>
            </section>}
            <section className="entry-explanation"><h3>{t("why_exists")}</h3><p>{t(reasonKeyForEntry(entry))}</p></section>
            <section className="entry-catalog-note"><h3>{t("catalog_note")}</h3><p>{displayNote(entry)}</p>{entry.sourceLabel && (entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">{localizeCatalogText(language, entry.sourceLabel)} ↗</a> : <small>{localizeCatalogText(language, entry.sourceLabel)}</small>)}</section>
          </section>
        </div>;
      })()}

      {customBoxEditor && (() => {
        const selectedIds = new Set(customBoxEditor.planIds);
        return <div className="entry-modal-layer custom-box-modal-layer">
          <button className="entry-modal-scrim" aria-label={t("close_editor")} onClick={() => setCustomBoxEditorId(null)} />
          <section className="custom-box-dialog" role="dialog" aria-modal="true" aria-labelledby="custom-box-dialog-title">
            <header className="custom-box-dialog-header">
              <div><p className="eyebrow teal">{t("custom_boxes")}</p><h2 id="custom-box-dialog-title">{t("edit_custom_box")}</h2></div>
              <button className="entry-dialog-close" aria-label={t("close_editor")} onClick={() => setCustomBoxEditorId(null)}>×</button>
            </header>
            <label className="custom-box-name"><span>{t("box_name")}</span><input value={customBoxEditor.name} maxLength={48} onChange={(event) => updateCustomBox(customBoxEditor.id, (box) => ({ ...box, name: event.target.value }))} /></label>
            <div className="custom-box-editor-toolbar">
              <label className="search-box"><span>⌕</span><input value={customBoxQuery} onChange={(event) => setCustomBoxQuery(event.target.value)} placeholder={t("search_database")} /></label>
              <strong>{t("selected_count")}: {customBoxEditor.planIds.length.toLocaleString(locale)} / 30</strong>
            </div>
            <div className="database-choice-grid" aria-label={t("choose_pokemon")}>{customBoxSearchResults.map((entry) => {
              const selected = selectedIds.has(entry.planId);
              const artworkUrl = pokemonArtworkUrl(entry);
              const originMarkKey = entry.mark ?? entry.groupKey;
              return <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} key={entry.planId} onClick={() => toggleCustomBoxEntry(customBoxEditor.id, entry.planId)}>
                <span>{artworkUrl && <img src={artworkUrl} alt="" loading="lazy" />}{entry.variant === "shiny" && <img className="database-shiny" src={assetUrl("assets/shiny.png")} alt="" />}</span>
                <b>{displayName(entry)}</b><small>{displayForm(entry) ?? `#${String(entry.dex).padStart(4, "0")}`}</small>
                {originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="database-origin-mark" /> : <em>{entry.groupLabel}</em>}
              </button>;
            })}</div>
            <footer className="custom-box-dialog-footer"><span>{customBoxSearchResults.length.toLocaleString(locale)} {t("database_results")}</span><button className="primary-action" onClick={() => setCustomBoxEditorId(null)}>{t("close_editor")}</button></footer>
          </section>
        </div>;
      })()}

      <div className="workspace">
        {filtersOpen && <button className="drawer-scrim" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)} />}
        <aside className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="filter-title-row"><button className="close-drawer" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)}>×</button></div>

          <section className="profile-section">
            <p className="panel-label">{t("collection_profiles")}</p>
            <StyledSelect value={collectionPreset} options={COLLECTION_PRESETS.map((preset) => ({ value: preset, label: t(`profile_${preset}`) }))} onChange={applyCollectionPreset} ariaLabel={t("collection_profiles")} className="profile-selector" />
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("variants")}</p>
            <label className="switch-row" htmlFor="variant-shiny" aria-label={t("shiny_possible")}><span><b className="shiny-label"><img className="shiny-symbol small" src={assetUrl("assets/shiny.png")} alt="" />{t("shiny_possible")}</b></span><GooeyCheckbox id="variant-shiny" checked={variants.shiny} onChange={() => setVariant("shiny")} /></label>
            <label className="switch-row" htmlFor="variant-normal" aria-label={t("non_shiny")}><span><b>{t("non_shiny")}</b></span><GooeyCheckbox id="variant-normal" checked={variants.normal} onChange={() => setVariant("normal")} /></label>
            <label className="switch-row special-normal-row" htmlFor="special-non-shiny" aria-label={t("special_non_shiny")}><span><b>{t("special_non_shiny")}</b></span><GooeyCheckbox id="special-non-shiny" checked={includeNonShinySpecials} onChange={(event) => { markProfileCustom(); setIncludeNonShinySpecials(event.target.checked); }} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("form_differences")}</p>
            <label className="switch-row" htmlFor="alternate-forms" aria-label={t("alternate_forms")}><span><b>{t("alternate_forms")}</b></span><GooeyCheckbox id="alternate-forms" checked={formOptions.alternate} onChange={(event) => { markProfileCustom(); setFormOptions((current) => ({ ...current, alternate: event.target.checked })); }} /></label>
            <label className="switch-row" htmlFor="all-alcremie-forms" aria-label={t("all_alcremie_forms")}><span><b>{t("all_alcremie_forms")}</b></span><GooeyCheckbox id="all-alcremie-forms" checked={formOptions.alcremie} onChange={(event) => { markProfileCustom(); setFormOptions((current) => ({ ...current, alcremie: event.target.checked })); }} /></label>
            <label className="switch-row" htmlFor="all-minior-forms" aria-label={t("all_minior_forms")}><span><b>{t("all_minior_forms")}</b></span><GooeyCheckbox id="all-minior-forms" checked={formOptions.minior} onChange={(event) => { markProfileCustom(); setFormOptions((current) => ({ ...current, minior: event.target.checked })); }} /></label>
            <label className="switch-row" htmlFor="all-gender-differences" aria-label={t("all_gender_differences")}><span><b>{t("all_gender_differences")}</b></span><GooeyCheckbox id="all-gender-differences" checked={genderMode === "all"} onChange={(event) => { markProfileCustom(); setGenderMode(event.target.checked ? "all" : "notable"); }} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("acquisition")}</p>

            <label
              className="switch-row"
              htmlFor="acquisition-own"
              aria-label={t("own_ot")}
            >
              <span><b>{t("own_ot")}</b></span>
              <GooeyCheckbox
                id="acquisition-own"
                checked={acquisitions.own}
                onChange={() => setAcquisition("own")}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="acquisition-trade"
              aria-label={t("in_game_trades")}
            >
              <span><b>{t("in_game_trades")}</b></span>
              <GooeyCheckbox
                id="acquisition-trade"
                checked={acquisitions.trade}
                onChange={() => setAcquisition("trade")}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="acquisition-event"
              aria-label={t("events")}
            >
              <span><b>{t("events")}</b></span>
              <GooeyCheckbox
                id="acquisition-event"
                checked={acquisitions.event}
                onChange={() => setAcquisition("event")}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="historical-event-mythicals"
              aria-label={t("historical_event_mythicals")}
            >
              <span><b>{t("historical_event_mythicals")}</b></span>

              <GooeyCheckbox
                id="historical-event-mythicals"
                checked={includeEventMythicals}
                onChange={(event) => {
                  markProfileCustom();

                  const checked = event.target.checked;
                  setIncludeEventMythicals(checked);

                  if (checked) {
                    setAvailabilityFilters((current) => ({
                      ...current,
                      historical: true,
                    }));
                  }
                }}
              />
            </label>

            <label
              className="switch-row"
              htmlFor="acquisition-external"
              aria-label={t("other_games_apps")}
            >
              <span><b>{t("other_games_apps")}</b></span>
              <GooeyCheckbox
                id="acquisition-external"
                checked={acquisitions.external}
                onChange={() => setAcquisition("external")}
              />
            </label>
          </section>

          <section className="filter-section availability-section">
            <p className="panel-label">{t("availability")}</p>
            {AVAILABILITY_STATUSES.map((status) => <label className={`availability-row ${status}`} key={status}>
              <CompactCheckbox checked={availabilityFilters[status]} onChange={() => toggleAvailability(status)} accent={status === "current" ? "#55e0c0" : status === "legacy" ? "#f3953d" : status === "historical" ? "#b18bea" : "#9eb4b1"} />
              {status === "legacy" ? <BankBadge label={t("bank_required")} className="filter-bank-badge" /> : <span>{t(`availability_${status}`)}</span>}
              <em>{availabilityCounts[status].toLocaleString(locale)}</em>
            </label>)}
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("origin_marks")}</p>
            {MARKS.map((mark) => {
              const label = groupName(language, mark);
              return <label className="mark-row" key={mark} aria-label={`${label}: ${markCounts[mark]?.toLocaleString(locale) ?? 0}`}>
                <CompactCheckbox checked={selectedMarks.includes(mark)} onChange={() => toggleMark(mark)} accent={MARK_COLORS[mark]} />
                <OriginMarkIcon mark={mark} label={label} className={originMarkIconUrl(mark) ? "filter-mark-icon" : ""} /><em>{markCounts[mark]?.toLocaleString(locale) ?? 0}</em>
              </label>;
            })}
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("special_collections")}</p>
            {COLLECTIONS.map((collection) => {
              const label = groupName(language, collection);
              return <label className="mark-row" key={collection} aria-label={`${label}: ${collectionCounts[collection]?.toLocaleString(locale) ?? 0}`}>
                <CompactCheckbox checked={selectedCollections.includes(collection)} onChange={() => toggleCollection(collection)} accent={GROUP_COLORS[collection]} />
                <OriginMarkIcon mark={collection} label={label} className={originMarkIconUrl(collection) ? "filter-mark-icon" : ""} /><em>{collectionCounts[collection]?.toLocaleString(locale) ?? 0}</em>
              </label>;
            })}
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("home_challenges")}</p>
            <label className="switch-row" htmlFor="home-challenges-only" aria-label={t("home_challenges_only")}><span><b>{t("home_challenges_only")}</b></span><GooeyCheckbox id="home-challenges-only" checked={homeChallengesOnly} onChange={(event) => setHomeChallengesOnly(event.target.checked)} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("capacity")}</p>
            <div className="capacity-toggle">
              <button className={capacity === 6000 ? "active" : ""} onClick={() => setCapacity(6000)}>{(6000).toLocaleString(locale)}<small>{t("current")}</small></button>
              <button className={capacity === 8000 ? "active" : ""} onClick={() => setCapacity(8000)}>{(8000).toLocaleString(locale)}<small>{t("future")}</small></button>
            </div>
          </section>

          <section className="filter-section collection-planning">
            <p className="panel-label">{t("personal_planning")}</p>
            <label><span>{t("collection_goal")}</span><input type="number" min="1" max="8000" inputMode="numeric" value={collectionGoal} placeholder={t("goal_placeholder")} onChange={(event) => setCollectionGoal(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))} /></label>
            <label><span>{t("collection_notes")}</span><textarea value={collectionNotes} maxLength={2000} rows={3} placeholder={t("notes_placeholder")} onChange={(event) => setCollectionNotes(event.target.value)} /></label>
          </section>

          <div className="backup-actions">
            <span>{t("collection_and_backup")}</span>
            <button className="wide" onClick={() => importRef.current?.click()}>{t("import_collection")}</button><input ref={importRef} type="file" accept=".csv,.json,.homechecklist,text/csv,application/json,application/vnd.home-checklist+json" onChange={importData} hidden />
            <button className="wide austin-import-button" disabled={austinImportBusy} onClick={() => austinImportRef.current?.click()}>{austinImportBusy ? t("austin_reading") : t("austin_import_button")}</button><input ref={austinImportRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importAustinJohnData} hidden />
            <button onClick={() => exportBackup("json")}>{t("export_json")}</button><button onClick={exportProgressCsv}>{t("export_csv")}</button><button className="wide" onClick={() => exportBackup("project")}>{t("export_project")}</button>
            <small className="auto-save-status"><i aria-hidden="true" />{t("last_saved")} {savedWhen}</small>
            <span>{t("theme_backup")}</span>
            <button onClick={exportThemeBackup}>{t("export_themes")}</button><button onClick={() => themeImportRef.current?.click()}>{t("import_themes")}</button><input ref={themeImportRef} type="file" accept="application/json" onChange={importThemeBackup} hidden />
            <button className="reset-progress" onClick={resetProgress} disabled={!livingDexOwned.size && !owned.size}>{t("reset_progress")}</button>
          </div>
        </aside>

        <section className="collection-view">
          <div className="utility-row">
            {viewMode !== "summary" && <div className="utility-navigation">
              <nav className={`view-switcher ${viewMode === "global" ? "global-active" : "boxes-active"}`} aria-label={t("choose_view")}>
                <button type="button" className={viewMode === "boxes" ? "active" : ""} aria-pressed={viewMode === "boxes"} onClick={() => { setViewMode("boxes"); setGlobalTooltip(null); }}><span aria-hidden="true">▦</span>{t("boxes_view")}</button>
                <button type="button" className={viewMode === "global" ? "active" : ""} aria-pressed={viewMode === "global"} onClick={() => { setViewMode("global"); setGlobalTooltip(null); }}><span aria-hidden="true">◉</span>{t("global_view")}</button>
              </nav>
              {viewMode === "boxes" && <nav className="breadcrumbs">
                <button className={!selectedBox ? "current" : ""} onClick={() => setSelectedBoxIndex(null)}>{t("page")} {pageIndex + 1}</button>
                {selectedBox && <><span>/</span><strong>{selectedBox.label}</strong></>}
              </nav>}
              {viewMode === "boxes" && <StyledSelect value={selectedBoxIndex ?? -1} options={[{ value: -1, label: t("jump_to_box"), icon: <span aria-hidden="true">▦</span> }, ...boxes.map((box) => ({ value: box.globalIndex, label: `${String(box.globalIndex + 1).padStart(3, "0")} · ${box.label}` }))]} onChange={(value) => { if (value >= 0) jumpToBox(value); }} ariaLabel={t("box_navigator")} className="box-navigator" />}
            </div>}
            <div className="search-tools">
              <button className="undo-action" onClick={undoOwned} disabled={!undoDepth} title={undoDepth ? t("undo_desc") : t("nothing_to_undo")}><span aria-hidden="true">↶</span>{t("undo")}</button>
              {viewMode === "boxes" && <button className="theme-trigger" onClick={openThemeDialog}><span>◈</span><b>{t("theme")}</b><small>{displayThemeName(activeBoxTheme)}</small></button>}
              {viewMode !== "summary" && <><label className="search-box"><span>⌕</span><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} /></label>
              <label className="missing-filter"><GooeyCheckbox id="missing-only" checked={missingOnly} onChange={(event) => setMissingOnly(event.target.checked)} /><span>{t("missing_only")}</span></label>
              <button className={`favorites-filter ${favoritesOnly ? "active" : ""}`} aria-label={`${t("favorites_only")}: ${favoriteCount.toLocaleString(locale)}`} title={`${t("favorites_only")}: ${favoriteCount.toLocaleString(locale)}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}><img src={assetUrl("assets/favorite-star.png")} alt="" /></button></>}
            </div>
          </div>

          {viewMode === "summary" ? (
            <section className="summary-view" aria-labelledby="collection-summary-title">
              <header className="summary-hero">
                <div>
                  <p className="eyebrow teal">{t("your_collection")}</p>
                  <h2 id="collection-summary-title">{t("collection_summary")}</h2>
                </div>
                <div className="summary-ring" style={{ background: `conic-gradient(var(--teal) ${progress}%, rgba(85, 224, 192, .12) 0)` }}><span><strong>{progress}%</strong>{t("completion")}</span></div>
                <div className="summary-metrics">
                  <article><strong>{ownedCount.toLocaleString(locale)}</strong><span>{t("pokemon_registered")}</span></article>
                  <article><strong>{Math.max(0, plannedEntries.length - ownedCount).toLocaleString(locale)}</strong><span>{t("pokemon_missing")}</span></article>
                  <article><strong>{plannedEntries.length.toLocaleString(locale)}</strong><span>{t("summary_entries")}</span></article>
                </div>
              </header>

              <div className="summary-grid">
                <section className="summary-panel">
                  <div className="summary-panel-heading"><span>{t("by_generation")}</span><b>{t("completion")}</b></div>
                  <div className="progress-list">{generationSummary.map((item) => <div className="progress-row" key={item.generation}>
                    <div><strong>{t("generation")} {item.generation}</strong><span>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</span></div>
                    <div className="progress-bar" aria-label={`${item.progress}%`}><i style={{ width: `${item.progress}%` }} /></div><b>{item.progress}%</b>
                  </div>)}</div>
                </section>

                <section className="summary-panel">
                  <div className="summary-panel-heading"><span>{t("by_origin")}</span><b>{t("completion")}</b></div>
                  <div className="progress-list origin-progress-list">{originSummary.map((item) => {
                    const itemProgress = item.total ? Math.round((item.registered / item.total) * 100) : 0;
                    return <div className="progress-row" key={item.key}>
                      <div><strong>{originMarkIconUrl(item.key) ? <OriginMarkIcon mark={item.key} label={groupName(language, item.key)} className="summary-origin-icon" /> : groupName(language, item.key)}</strong><span>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</span></div>
                      <div className="progress-bar" aria-label={`${itemProgress}%`}><i style={{ width: `${itemProgress}%` }} /></div><b>{itemProgress}%</b>
                    </div>;
                  })}</div>
                </section>

                <section className="summary-panel availability-panel">
                  <div className="summary-panel-heading"><span>{t("availability_breakdown")}</span></div>
                  <div className="availability-summary">{availabilitySummary.map((item) => <article className={item.status} key={item.status}><span>{t(`availability_${item.status}`)}</span><strong>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</strong></article>)}</div>
                </section>

                <section className="summary-panel game-planner">
                  <div className="game-plan-header">
                    <div><p className="eyebrow teal">{t("game_planner")}</p><h3>{t("obtainable_missing")}</h3></div>
                    <div><span className="sr-only">{t("select_game")}</span><StyledSelect value={selectedGamePlan} options={GAME_PLANS.map((game) => ({ value: game.id, label: t(`game_${game.id}`) }))} onChange={(game) => { setSelectedGamePlan(game); setGameResultLimit(24); }} ariaLabel={t("select_game")} className="game-selector" /></div>
                  </div>
                  {gameMissingEntries.length ? <>
                    <div className="game-results">{gameMissingEntries.slice(0, gameResultLimit).map((located) => {
                      const { entry, box, slotIndex } = located;
                      const localizedName = displayName(entry);
                      const localizedForm = displayForm(entry);
                      const originMarkKey = entry.mark ?? entry.groupKey;
                      return <button className="game-result" key={`${selectedGamePlan}:${entry.planId}`} onClick={() => locateEntryInBoxes(located)}>
                        <span className="game-result-art">{pokemonArtworkUrl(entry) && <img src={pokemonArtworkUrl(entry) ?? ""} alt="" loading="lazy" />}</span>
                        <span className="game-result-meta"><strong>{localizedName}{localizedForm ? ` — ${localizedForm}` : ""}</strong><small>{entry.variant === "shiny" ? t("shiny") : t("normal")} · {t("box")} {String(box.globalIndex + 1).padStart(3, "0")} · {t("slot")} {String(slotIndex + 1).padStart(2, "0")}</small></span>
                        {originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="game-result-origin" /> : <em>{entry.groupLabel}</em>}
                        <span aria-hidden="true">→</span>
                      </button>;
                    })}</div>
                    {gameMissingEntries.length > gameResultLimit && <button className="show-more" onClick={() => setGameResultLimit((value) => value + 24)}>{t("show_more")} · {(gameMissingEntries.length - gameResultLimit).toLocaleString(locale)} {t("remaining_results")}</button>}
                  </> : <div className="game-plan-empty"><span>✓</span><strong>{t("game_plan_complete")}</strong></div>}
                </section>

                <section className="summary-panel box-organizer">
                  <div className="summary-panel-heading"><span>{t("box_organizer")}</span></div>
                  <div className="box-rename-row">
                    <StyledSelect value={boxBeingRenamed?.globalIndex ?? -1} options={[{ value: -1, label: t("jump_to_box") }, ...boxes.map((box) => ({ value: box.globalIndex, label: `${String(box.globalIndex + 1).padStart(3, "0")} · ${box.label}` }))]} onChange={(value) => { if (value >= 0) setRenameBoxIndex(value); }} ariaLabel={t("rename_box")} className="rename-box-selector" />
                    <label><span>{t("box_name")}</span><input value={boxBeingRenamed?.label ?? ""} disabled={!boxBeingRenamed} maxLength={48} onChange={(event) => { if (boxBeingRenamed) renamePlannedBox(boxBeingRenamed, event.target.value); }} /></label>
                    <button disabled={!boxBeingRenamed} onClick={() => { if (boxBeingRenamed) renamePlannedBox(boxBeingRenamed, ""); }}>{t("restore_default_name")}</button>
                  </div>
                  <div className="custom-box-heading"><div><strong>{t("custom_boxes")}</strong><span>{t("choose_pokemon")}</span></div><button className="primary-action" onClick={createCustomBox}>＋ {t("new_custom_box")}</button></div>
                  {customBoxes.length ? <div className="custom-box-list">{customBoxes.map((box) => <article key={box.id}>
                    <div><strong>{box.name || t("custom_box")}</strong><span>{box.planIds.length.toLocaleString(locale)} / 30</span></div>
                    <span className="custom-box-preview">{Array.from({ length: 30 }, (_, index) => { const entry = databaseChoiceByPlanId.get(box.planIds[index]); const artworkUrl = entry ? pokemonArtworkUrl(entry) : null; return <i key={index}>{artworkUrl && <img src={artworkUrl} alt="" loading="lazy" />}</i>; })}</span>
                    <footer><button onClick={() => { setCustomBoxQuery(""); setCustomBoxEditorId(box.id); }}>{t("edit_custom_box")}</button><button className="danger" onClick={() => deleteCustomBox(box)}>{t("delete_custom_box")}</button></footer>
                  </article>)}</div> : <p className="custom-box-empty">{t("no_custom_boxes")}</p>}
                </section>

                <section className="summary-panel shortcut-guide">
                  <div className="summary-panel-heading"><span>{t("keyboard_shortcuts")}</span></div>
                  <div className="shortcut-grid"><span><kbd>← ↑ → ↓</kbd>{t("shortcut_arrows")}</span><span><kbd>Space</kbd>{t("shortcut_space")}</span><span><kbd>F</kbd>{t("shortcut_favorite")}</span><span><kbd>/</kbd>{t("shortcut_search")}</span><span><kbd>PgUp / PgDn</kbd>{t("shortcut_boxes")}</span><span><kbd>Ctrl / ⌘ + Z</kbd>{t("shortcut_undo")}</span></div>
                </section>
              </div>
            </section>
          ) : viewMode === "global" ? (
            <>
              <div className="view-heading global-view-heading">
                <div><p className="eyebrow teal">{t("your_collection")}</p><h2>{t("global_view")}</h2><p>{t("global_view_desc")}</p></div>
                <div className="heading-metrics"><span><b>{visibleGlobalEntries.length.toLocaleString(locale)}</b> {t("results")}</span><span><b>{visibleGlobalOwned.toLocaleString(locale)}</b> {t("obtained")}</span></div>
              </div>

              {visibleGlobalEntries.length ? <div className="global-gallery" aria-label={t("global_view")}>
                {visibleGlobalEntries.map((located) => {
                  const { entry, box, slotIndex } = located;
                  const localizedName = displayName(entry);
                  const localizedForm = displayForm(entry);
                  const isOwned = entryIsOwned(entry);
                  const artworkUrl = pokemonArtworkUrl(entry);
                  const boxNumber = String(box.globalIndex + 1).padStart(3, "0");
                  const slotNumber = String(slotIndex + 1).padStart(2, "0");
                  const originMarkKey = entry.mark ?? entry.groupKey;
                  const favorite = favorites.has(entry.planId);
                  const needsBank = requiresPokemonBank(entry);
                  const status = isOwned ? t("status_obtained") : t("status_missing");
                  const collectionContext = entry.genericEntry ? t("generic_specimen") : `${entry.mark ? t("origin_marks") : t("special_collections")}: ${entry.groupLabel}`;
                  const accessibleLabel = `${localizedName}${localizedForm ? ` — ${localizedForm}` : ""}. ${entry.variant === "shiny" ? t("shiny") : t("normal")}. ${collectionContext}. ${t("availability_label")}: ${t(`availability_${availabilityForEntry(entry)}`)}. ${t("box")} ${boxNumber}, ${t("slot")} ${slotNumber}. ${status}. ${t("locate_in_box")}`;
                  return <div className="global-pokemon-shell" key={`${entry.planId}:${box.globalIndex}:${slotIndex}`}>
                    <button
                      className={`global-pokemon ${isOwned ? "owned" : "pending"}`}
                      aria-label={accessibleLabel}
                      onMouseEnter={(event) => showGlobalTooltip(event.currentTarget, located)}
                      onMouseLeave={() => setGlobalTooltip(null)}
                      onFocus={(event) => showGlobalTooltip(event.currentTarget, located)}
                      onBlur={() => setGlobalTooltip(null)}
                      onClick={() => locateEntryInBoxes(located)}
                    >
                      {artworkUrl ? <img src={artworkUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /> : <span className="global-art-placeholder" aria-hidden="true" />}
                      {originMarkIconUrl(originMarkKey) && <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="entry-origin-mark" />}
                      {needsBank && <BankBadge label={t("bank_required")} className="global-bank-badge" />}
                    </button>
                    <FavoriteButton active={favorite} label={t(favorite ? "remove_favorite" : "add_favorite")} onClick={() => toggleFavorite(entry.planId)} className="global-favorite" />
                  </div>;
                })}
              </div> : <div className="global-empty"><span>⌕</span><h3>{t("no_results")}</h3><p>{t("no_results_desc")}</p></div>}

              {globalTooltip && (() => {
                const { entry, box, slotIndex } = globalTooltip.located;
                const localizedName = displayName(entry);
                const localizedForm = displayForm(entry);
                const isOwned = entryIsOwned(entry);
                const originMarkKey = entry.mark ?? entry.groupKey;
                const availability = availabilityForEntry(entry);
                return <div className={`global-tooltip ${globalTooltip.above ? "above" : ""}`} role="tooltip" style={{ left: globalTooltip.left, top: globalTooltip.top }}>
                  <strong>{localizedName}{localizedForm && <><span> — </span>{localizedForm}</>}</strong>
                  <b className={entry.variant}>{entry.variant === "shiny" && <img src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</b>
                  <span><em>{entry.genericEntry ? t("generic_specimen") : entry.mark ? t("origin_marks") : t("special_collections")}</em>{entry.genericEntry ? <span>{t("no_origin_required")}</span> : originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="tooltip-origin-mark" /> : <span>{entry.groupLabel}</span>}</span>
                  <span><em>{t("availability_label")}</em><span className={`tooltip-availability ${availability}`}>{t(`availability_${availability}`)}</span></span>
                  {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} className="tooltip-bank-badge" />}
                  <span><em>{t("box")} · {t("slot")}</em>{String(box.globalIndex + 1).padStart(3, "0")} · {String(slotIndex + 1).padStart(2, "0")}</span>
                  <span className={isOwned ? "owned" : "pending"}>{isOwned ? t("status_obtained") : t("status_missing")}</span>
                  <small>{t("locate_in_box")}</small>
                </div>;
              })()}
            </>
          ) : !selectedBox ? (
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
                  const boxOwned = box?.entries.filter(entryIsOwned).length ?? 0;
                  if (!box) return (
                    <div className={`box-tile empty ${beyondCapacity ? "locked" : ""}`} key={globalIndex}>
                      <span className="box-position">{String(offset + 1).padStart(2, "0")}</span><strong>{beyondCapacity ? t("no_capacity") : t("free")}</strong><small>{beyondCapacity ? t("outside_home") : t("box_available")}</small>
                    </div>
                  );
                  const previewLabel = box.entries.map((entry) => `${displayName(entry)}${displayForm(entry) ? ` ${displayForm(entry)}` : ""}`).join(", ");
                  const tileTheme = resolveBoxTheme(themeConfig, box.groupKey, box.number);
                  return (
                    <button aria-label={`${box.label}: ${previewLabel}`} className={`box-tile ${tileTheme.kind === "default" ? "" : "themed-box-tile"} ${beyondCapacity ? "overflow" : ""} ${(query || missingOnly || favoritesOnly || homeChallengesOnly || availabilityFiltering) && !matchCount ? "filtered-out" : ""}`} key={box.label} onClick={() => setSelectedBoxIndex(globalIndex)} style={boxThemeStyle(tileTheme)}>
                      <span className="box-position">{String(offset + 1).padStart(2, "0")}</span>
                      {originMarkIconUrl(box.groupKey) ? <OriginMarkIcon mark={box.groupKey} label={groupName(language, box.groupKey)} className="box-origin-mark" /> : <span className="mark-accent" style={{ background: GROUP_COLORS[box.groupKey] }} />}
                      <strong>{box.label}</strong><small>{boxOwned.toLocaleString(locale)} / {box.entries.length.toLocaleString(locale)} {t("obtained")}</small>
                      <span className="mini-grid">{Array.from({ length: 30 }, (_, index) => { const entry = box.entries[index]; return <i className={entry ? entryIsOwned(entry) ? "owned" : "pending" : "vacant"} key={index} />; })}</span>
                      <span className="box-preview" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => { const entry = box.entries[index]; const url = entry ? pokemonArtworkUrl(entry) : null; return <span className={entry && entryIsOwned(entry) ? "owned" : ""} key={index}>{url && <img src={url} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</span>; })}</span>
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
                  const isOwned = entryIsOwned(entry);
                  const visible = matchesSearch(entry);
                  const localizedName = displayName(entry);
                  const localizedForm = displayForm(entry);
                  const requiredGender = entry.requirements?.gender;
                  const genderDetail = requiredGender ? t(requiredGender === "any" ? "any_gender" : requiredGender) : entry.gender ? t(entry.gender) : null;
                  const detail = [entry.displayDetail || localizedForm || `#${String(entry.dex).padStart(4, "0")}`, genderDetail].filter(Boolean).join(" · ");
                  const originMarkKey = entry.mark ?? entry.groupKey;
                  const favorite = favorites.has(entry.planId);
                  return (
                    <div ref={highlightedPlanId === entry.planId ? highlightedEntryRef : undefined} className={`pokemon-slot ${isOwned ? "owned" : "pending"} ${visible ? "" : "filtered-out"} ${highlightedPlanId === entry.planId ? "locating" : ""} ${keyboardSlotIndex === index ? "keyboard-selected" : ""}`} key={entry.planId}>
                      <button className="pokemon-slot-main" onClick={() => { setKeyboardSlotIndex(index); toggleOwned(entry); }} aria-pressed={isOwned}>
                        <span className="slot-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className={`variant-badge ${entry.variant}`} aria-label={entry.variant === "shiny" ? t("shiny") : t("normal")} title={entry.variant === "shiny" ? t("shiny") : t("normal")}>{entry.variant === "shiny" ? <img className="shiny-symbol badge" src={assetUrl("assets/shiny.png")} alt="" /> : t("normal")}</span>
                        <PokemonArtwork entry={entry} owned={isOwned} displayName={localizedName} language={language} />
                        <strong>{localizedName}</strong><small>{detail} · {entry.ownOt ? t("your_ot") : t("foreign_ot")}</small>
                        {originMarkIconUrl(originMarkKey) && <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="slot-origin-mark" />}
                        {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} className="slot-bank-badge" />}
                        <span className="status-dot">{isOwned ? "✓" : ""}</span>
                      </button>
                      <FavoriteButton active={favorite} label={t(favorite ? "remove_favorite" : "add_favorite")} onClick={() => toggleFavorite(entry.planId)} className="slot-favorite" />
                      <button className="slot-info" aria-label={`${t("open_details")}: ${localizedName}`} title={t("open_details")} onClick={() => setDetailEntry({ entry, box: selectedBox, slotIndex: index })}>i</button>
                      <div className="slot-tooltip" role="tooltip">
                        <strong>{localizedName}{localizedForm && <><span> — </span>{localizedForm}</>}</strong>
                        <b className={entry.variant}>{entry.variant === "shiny" && <img src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</b>
                        <span><em>{entry.genericEntry ? t("generic_specimen") : entry.mark ? t("origin_marks") : t("special_collections")}</em>{entry.genericEntry ? <span>{t("no_origin_required")}</span> : originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="tooltip-origin-mark" /> : <span>{entry.groupLabel}</span>}</span>
                        <span><em>{t("availability_label")}</em><span className={`tooltip-availability ${availabilityForEntry(entry)}`}>{t(`availability_${availabilityForEntry(entry)}`)}</span></span>
                        {requiresPokemonBank(entry) && <BankBadge label={t("bank_required")} className="tooltip-bank-badge" />}
                        <span><em>{t("box")} · {t("slot")}</em>{String(selectedBox.globalIndex + 1).padStart(3, "0")} · {String(index + 1).padStart(2, "0")}</span>
                        <span className={isOwned ? "owned" : "pending"}>{isOwned ? t("status_obtained") : t("status_missing")}</span>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              <footer className="box-footer">
                <span><b>{selectedBox.entries.filter(entryIsOwned).length.toLocaleString(locale)}</b> {t("obtained")}</span><span><b>{selectedBox.entries.filter((entry) => !entryIsOwned(entry)).length.toLocaleString(locale)}</b> {t("pending")}</span>
                <button className="primary-action" onClick={() => toggleEntries(selectedBox.entries)}>{selectedBox.entries.every(entryIsOwned) ? t("unmark_box") : t("mark_box")}</button>
              </footer>
            </>
          )}

          <section className="data-note">
            <div className="source-links"><a href="https://bulbapedia.bulbagarden.net/wiki/N%27s_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("n_source")}</a><a href="https://www.serebii.net/blackwhite/dreamworldpokemon.shtml" target="_blank" rel="noreferrer">{t("dream_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Dream_Radar#Pok%C3%A9mon_encounters" target="_blank" rel="noreferrer">{t("radar_source")}</a><a href="https://www.serebii.net/events/" target="_blank" rel="noreferrer">{t("event_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/Challenge_(HOME)" target="_blank" rel="noreferrer">{t("home_challenges_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("shadow_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/In-game_trade" target="_blank" rel="noreferrer">{t("trade_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_gender_differences" target="_blank" rel="noreferrer">{t("gender_source")}</a><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">{t("art_source")}</a></div>
          </section>
        </section>
      </div>
    </main>
  );
}
