import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGE_OPTIONS, UiLanguage, copy, groupName } from "./translations";

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
const CATALOG_VERSION = 5;
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

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

function buildBoxes(
  entries: PokemonEntry[],
  specialEntries: PokemonEntry[],
  selectedMarks: string[],
  selectedCollections: string[],
  variants: Record<Variant, boolean>,
  acquisitions: Record<Acquisition, boolean>,
  includeNonShinySpecials: boolean,
  genderMode: GenderMode,
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
    for (const entry of group.entries) {
      if (entry.availability === "excluded") continue;
      if (entry.genderVariant === "extra" && entry.genderDifferenceTier === "all" && genderMode !== "all") continue;
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

function PokemonArtwork({ entry, owned, displayName, language }: { entry: PlannedEntry; owned: boolean; displayName: string; language: UiLanguage }) {
  const [failed, setFailed] = useState(false);
  const artPath = entry.variant === "shiny" && entry.shinyArtStyle === "home"
    ? "home/shiny/"
    : `official-artwork/${entry.variant === "shiny" ? "shiny/" : ""}`;
  const url = entry.artId
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${artPath}${entry.artId}.png`
    : null;

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
  const [language, setLanguage] = useState<UiLanguage>("ES-LA");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [capacity, setCapacity] = useState<6000 | 8000>(6000);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const languageOption = LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];
  const locale = languageOption.locale;
  const t = (key: string) => copy(language, key);
  const displayName = (entry: PokemonEntry) => pokemonNames?.[String(entry.dex)]?.[language] ?? entry.name;
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
        setDataset(baseValue);
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
        if (LANGUAGE_OPTIONS.some((option) => option.code === value.language)) setLanguage(value.language);
        if (value.capacity === 6000 || value.capacity === 8000) setCapacity(value.capacity);
      }
    } catch { /* A damaged local backup should never block the app. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ catalogVersion: CATALOG_VERSION, owned: [...owned], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, language, capacity }));
  }, [owned, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, language, capacity, hydrated]);

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? "es-MX";
  }, [language]);

  const boxes = useMemo(
    () => buildBoxes(dataset?.entries ?? [], specialDataset?.entries ?? [], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, language),
    [dataset, specialDataset, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, language],
  );
  const plannedEntries = useMemo(() => boxes.flatMap((box) => box.entries), [boxes]);
  const capacityBoxes = Math.ceil(capacity / 30);
  const totalPages = Math.max(1, Math.ceil(Math.max(boxes.length, capacityBoxes) / 30));
  const ownedCount = useMemo(() => plannedEntries.reduce((sum, entry) => sum + Number(owned.has(entry.planId)), 0), [plannedEntries, owned]);
  const progress = plannedEntries.length ? Math.round((ownedCount / plannedEntries.length) * 100) : 0;
  const selectedBox = selectedBoxIndex === null ? null : boxes[selectedBoxIndex];
  const pageBoxes = Array.from({ length: 30 }, (_, offset) => boxes[pageIndex * 30 + offset] ?? null);
  const filterKey = `${selectedMarks.join("|")}:${selectedCollections.join("|")}:${variants.shiny}:${variants.normal}:${acquisitions.own}:${acquisitions.trade}:${acquisitions.event}:${acquisitions.external}:${includeNonShinySpecials}:${genderMode}`;

  useEffect(() => {
    setPageIndex(0);
    setSelectedBoxIndex(null);
  }, [filterKey]);
  useEffect(() => setPageIndex((current) => Math.min(current, totalPages - 1)), [totalPages]);

  const matchesSearch = (entry: PlannedEntry) => {
    const matchesQuery = !query || normalize(`${displayName(entry)} ${entry.name} ${entry.form ?? ""} ${entry.gender ? t(entry.gender) : ""} ${entry.dex} ${entry.mark ?? ""} ${entry.groupLabel} ${entry.trainerName ?? ""} ${entry.nickname ?? ""} ${entry.ownOt ? t("your_ot") : t("foreign_ot")}`).includes(normalize(query));
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
    if (preset === "shiny") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: true, event: true, external: true }); setIncludeNonShinySpecials(true); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections(DEFAULT_COLLECTIONS); }
    if (preset === "special") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: true, event: true, external: true }); setIncludeNonShinySpecials(true); setSelectedMarks([]); setSelectedCollections(DEFAULT_COLLECTIONS); }
    if (preset === "normal") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); }
  };

  const exportBackup = () => {
    const payload = { version: 5, catalogVersion: CATALOG_VERSION, exportedAt: new Date().toISOString(), owned: [...owned], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, genderMode, language, capacity };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    link.download = "origin-marks-checklist-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
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
        if (LANGUAGE_OPTIONS.some((option) => option.code === value.language)) setLanguage(value.language);
        if (value.capacity === 6000 || value.capacity === 8000) setCapacity(value.capacity);
      } catch { window.alert(t("invalid_backup")); }
    });
    event.target.value = "";
  };

  if (loadError) return <main className="state-screen"><img className="brand-ball" src={assetUrl("assets/strange-ball.png")} alt="" /><h1>{t("load_error")}</h1><p>{t("reload")}</p></main>;
  if (!dataset || !specialDataset || !pokemonNames) return <main className="state-screen"><img className="brand-ball loading" src={assetUrl("assets/strange-ball.png")} alt="" /><p>{t("loading")}</p></main>;

  const markCounts = Object.fromEntries(MARKS.map((mark) => {
    const entriesForMark = buildBoxes(dataset.entries, specialDataset.entries, [mark], [], variants, acquisitions, includeNonShinySpecials, genderMode, language).flatMap((box) => box.entries);
    return [mark, entriesForMark.length];
  }));
  const collectionCounts = Object.fromEntries(COLLECTIONS.map((collection) => {
    const entriesForCollection = buildBoxes([], specialDataset.entries, [], [collection], variants, acquisitions, includeNonShinySpecials, genderMode, language).flatMap((box) => box.entries);
    return [collection, entriesForCollection.length];
  }));
  const visiblePageEntries = pageBoxes.flatMap((box) => box?.entries ?? []);
  const pageAllOwned = visiblePageEntries.length > 0 && visiblePageEntries.every((entry) => owned.has(entry.planId));

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

      <div className="workspace">
        {filtersOpen && <button className="drawer-scrim" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)} />}
        <aside className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="filter-title-row"><button className="close-drawer" aria-label={t("close_filters")} onClick={() => setFiltersOpen(false)}>×</button></div>

          <div className="preset-grid">
            <button className={`preset shiny-preset ${variants.shiny && !variants.normal && acquisitions.own && acquisitions.trade && acquisitions.event && acquisitions.external && selectedMarks.length > 1 ? "active" : ""}`} onClick={() => applyPreset("shiny")}><span><img className="shiny-symbol" src={assetUrl("assets/shiny.png")} alt="" /></span><b>{t("preset_shiny")}</b><small>{t("preset_shiny_desc")}</small></button>
            <button className={selectedMarks.length === 0 && selectedCollections.length === COLLECTIONS.length ? "preset active" : "preset"} onClick={() => applyPreset("special")}><span>◎</span><b>{t("preset_special")}</b><small>{t("preset_special_desc")}</small></button>
            <button className={!variants.shiny && variants.normal && acquisitions.own && !acquisitions.trade && !acquisitions.event && !acquisitions.external ? "preset active" : "preset"} onClick={() => applyPreset("normal")}><span>◌</span><b>{t("preset_normal")}</b><small>{t("preset_normal_desc")}</small></button>
          </div>

          <section className="filter-section">
            <p className="panel-label">{t("variants")}</p>
            <label className="switch-row" htmlFor="variant-shiny" aria-label={t("shiny_possible")}><span><b className="shiny-label"><img className="shiny-symbol small" src={assetUrl("assets/shiny.png")} alt="" />{t("shiny_possible")}</b><small>{t("catalog_review")}</small></span><input id="variant-shiny" type="checkbox" checked={variants.shiny} onChange={() => setVariant("shiny")} /></label>
            <label className="switch-row" htmlFor="variant-normal" aria-label={t("non_shiny")}><span><b>{t("non_shiny")}</b><small>{t("normal_specimen")}</small></span><input id="variant-normal" type="checkbox" checked={variants.normal} onChange={() => setVariant("normal")} /></label>
            <label className="switch-row special-normal-row" htmlFor="special-non-shiny" aria-label={t("special_non_shiny")}><span><b>{t("special_non_shiny")}</b><small>{t("special_non_shiny_desc")}</small></span><input id="special-non-shiny" type="checkbox" checked={includeNonShinySpecials} onChange={(event) => setIncludeNonShinySpecials(event.target.checked)} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("gender_differences")}</p>
            <label className="switch-row" htmlFor="all-gender-differences" aria-label={t("all_gender_differences")}><span><b>{t("all_gender_differences")}</b><small>{genderMode === "all" ? t("all_gender_differences_desc") : t("notable_gender_differences_desc")}</small></span><input id="all-gender-differences" type="checkbox" checked={genderMode === "all"} onChange={(event) => setGenderMode(event.target.checked ? "all" : "notable")} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("acquisition")}</p>
            <label className="switch-row" htmlFor="acquisition-own" aria-label={t("own_ot")}><span><b>{t("own_ot")}</b><small>{t("own_ot_desc")}</small></span><input id="acquisition-own" type="checkbox" checked={acquisitions.own} onChange={() => setAcquisition("own")} /></label>
            <label className="switch-row" htmlFor="acquisition-trade" aria-label={t("in_game_trades")}><span><b>{t("in_game_trades")}</b><small>{t("in_game_trades_desc")}</small></span><input id="acquisition-trade" type="checkbox" checked={acquisitions.trade} onChange={() => setAcquisition("trade")} /></label>
            <label className="switch-row" htmlFor="acquisition-event" aria-label={t("events")}><span><b>{t("events")}</b><small>{t("events_desc")}</small></span><input id="acquisition-event" type="checkbox" checked={acquisitions.event} onChange={() => setAcquisition("event")} /></label>
            <label className="switch-row" htmlFor="acquisition-external" aria-label={t("other_games_apps")}><span><b>{t("other_games_apps")}</b><small>{t("other_games_apps_desc")}</small></span><input id="acquisition-external" type="checkbox" checked={acquisitions.external} onChange={() => setAcquisition("external")} /></label>
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("origin_marks")}</p>
            {MARKS.map((mark) => (
              <label className="mark-row" key={mark}>
                <input type="checkbox" checked={selectedMarks.includes(mark)} onChange={() => toggleMark(mark)} />
                <i style={{ background: MARK_COLORS[mark] }} /><span>{groupName(language, mark)}</span><em>{markCounts[mark]?.toLocaleString(locale) ?? 0}</em>
              </label>
            ))}
            {selectedMarks.includes("GBA") && <div className="sub-rule static-rule"><span aria-hidden="true">↗</span><span><b>{t("gba_ports")}</b><small>{t("gba_ports_desc")}</small></span></div>}
          </section>

          <section className="filter-section">
            <p className="panel-label">{t("special_collections")}</p>
            {COLLECTIONS.map((collection) => (
              <label className="mark-row" key={collection}>
                <input type="checkbox" checked={selectedCollections.includes(collection)} onChange={() => toggleCollection(collection)} />
                <i style={{ background: GROUP_COLORS[collection] }} /><span>{groupName(language, collection)}</span><em>{collectionCounts[collection]?.toLocaleString(locale) ?? 0}</em>
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

          <section className="roadmap-card">
            <p className="panel-label">{t("active_catalogs")}</p>
            <div><span>{groupName(language, "dream")}</span><span>{groupName(language, "radar")}</span><span>{t("events")}</span><span>{groupName(language, "cherish")} · {t("collection_beta")}</span><span>{groupName(language, "trades")}</span><span>{groupName(language, "go")}</span></div>
            <small>{t("next_expansion")}</small>
          </section>

          <div className="backup-actions"><button onClick={exportBackup}>{t("export")}</button><button onClick={() => importRef.current?.click()}>{t("import")}</button><input ref={importRef} type="file" accept="application/json" onChange={importBackup} hidden /></div>
        </aside>

        <section className="collection-view">
          <div className="utility-row">
            <nav className="breadcrumbs">
              <button className={!selectedBox ? "current" : ""} onClick={() => setSelectedBoxIndex(null)}>{t("page")} {pageIndex + 1}</button>
              {selectedBox && <><span>/</span><strong>{selectedBox.label}</strong></>}
            </nav>
            <div className="search-tools">
              <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} /></label>
              <label className="missing-filter"><input type="checkbox" checked={missingOnly} onChange={(event) => setMissingOnly(event.target.checked)} /> {t("missing_only")}</label>
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
                  return (
                    <button className={`box-tile ${beyondCapacity ? "overflow" : ""} ${(query || missingOnly) && !matchCount ? "filtered-out" : ""}`} key={box.label} onClick={() => setSelectedBoxIndex(globalIndex)}>
                      <span className="box-position">{String(offset + 1).padStart(2, "0")}</span>
                      <span className="mark-accent" style={{ background: GROUP_COLORS[box.groupKey] }} />
                      <strong>{box.label}</strong><small>{boxOwned.toLocaleString(locale)} / {box.entries.length.toLocaleString(locale)} {t("obtained")}</small>
                      <span className="mini-grid">{Array.from({ length: 30 }, (_, index) => { const entry = box.entries[index]; return <i className={entry ? owned.has(entry.planId) ? "owned" : "pending" : "vacant"} key={index} />; })}</span>
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

              <div className="box-grid" aria-label={selectedBox.label}>
                {Array.from({ length: 30 }, (_, index) => {
                  const entry = selectedBox.entries[index];
                  if (!entry) return <div className="pokemon-slot vacant" key={index}><span className="slot-number">{String(index + 1).padStart(2, "0")}</span><span>{t("empty")}</span></div>;
                  const isOwned = owned.has(entry.planId);
                  const visible = matchesSearch(entry);
                  const localizedName = displayName(entry);
                  const genderDetail = entry.gender ? t(entry.gender) : null;
                  const detail = [entry.displayDetail || entry.form || `#${String(entry.dex).padStart(4, "0")}`, genderDetail].filter(Boolean).join(" · ");
                  return (
                    <button className={`pokemon-slot ${isOwned ? "owned" : "pending"} ${visible ? "" : "filtered-out"}`} key={entry.planId} onClick={() => toggleOwned(entry.planId)} title={`${localizedName}${entry.form ? ` · ${entry.form}` : ""}${genderDetail ? ` · ${genderDetail}` : ""}\n${displayNote(entry)}`} aria-pressed={isOwned}>
                      <span className="slot-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className={`variant-badge ${entry.variant}`}>{entry.variant === "shiny" && <img className="shiny-symbol badge" src={assetUrl("assets/shiny.png")} alt="" />}{entry.variant === "shiny" ? t("shiny") : t("normal")}</span>
                      <PokemonArtwork entry={entry} owned={isOwned} displayName={localizedName} language={language} />
                      <strong>{localizedName}</strong><small>{detail} · {entry.ownOt ? t("your_ot") : t("foreign_ot")}</small>
                      <span className="status-dot">{isOwned ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>

              <footer className="box-footer">
                <span><b>{selectedBox.entries.filter((entry) => owned.has(entry.planId)).length.toLocaleString(locale)}</b> {t("obtained")}</span><span><b>{selectedBox.entries.filter((entry) => !owned.has(entry.planId)).length.toLocaleString(locale)}</b> {t("pending")}</span>
                <button className="primary-action" onClick={() => toggleEntries(selectedBox.entries)}>{selectedBox.entries.every((entry) => owned.has(entry.planId)) ? t("unmark_box") : t("mark_box")}</button>
              </footer>
            </>
          )}

          <section className="data-note">
            <div><span>{t("data")}</span><p><b>Base LITE · {dataset.meta.entryCount.toLocaleString(locale)} + {specialDataset.meta.entryCount.toLocaleString(locale)}.</b> {t("data_note")}</p></div>
            <div className="source-links"><a href="https://bulbapedia.bulbagarden.net/wiki/N%27s_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("n_source")}</a><a href="https://www.serebii.net/blackwhite/dreamworldpokemon.shtml" target="_blank" rel="noreferrer">{t("dream_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Dream_Radar#Pok%C3%A9mon_encounters" target="_blank" rel="noreferrer">{t("radar_source")}</a><a href="https://www.serebii.net/events/shiny.shtml" target="_blank" rel="noreferrer">{t("event_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pok%C3%A9mon" target="_blank" rel="noreferrer">{t("shadow_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/In-game_trade" target="_blank" rel="noreferrer">{t("trade_source")}</a><a href="https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_gender_differences" target="_blank" rel="noreferrer">{t("gender_source")}</a><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">{t("art_source")}</a></div>
          </section>
        </section>
      </div>
    </main>
  );
}
