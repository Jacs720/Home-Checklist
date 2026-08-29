import { type ChangeEvent, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOX_THEME_GAMES,
  CONCEPT_ART_GAMES,
  DEFAULT_BOX_THEME,
  EMPTY_THEME_CONFIG,
  THEME_GAMES,
  boxThemeKey,
  boxThemeStyle,
  createPresetTheme,
  parseThemeConfig,
  presetThemeName,
  resolveBoxTheme,
  type BoxTheme,
  type BoxThemeConfig,
  type ThemeGame,
} from "../box-themes";
import { LANGUAGE_OPTIONS, copy, formName, groupName, localizeCatalogText, type UiLanguage } from "../translations";
import { localizeHomeChallengeTitle, type HomeChallenge, type HomeChallengesDataset } from "../home-challenges";
import { buildMightiestRaidEntries, type MightiestRaidsDataset } from "../mightiest-raids";
import { addGoStorableForms, createBattleBondGreninja } from "../catalog-corrections";
import { AustinJohnImportError, buildAustinJohnPreview, parseAustinJohnWorkbook, type AustinJohnPreview } from "../austin-john-import";
import {
  AVAILABILITY_STATUSES,
  COLLECTION_PRESETS,
  GAME_PLANS,
  UNIFIED_COLLECTION_PRESETS,
  availabilityForEntry,
  createGamePlanMatcher,
  genericSpecimenKey,
  generationForDex,
  methodKeyForEntry,
  rankGamePlans,
  reasonKeyForEntry,
  requiresPokemonBank,
  transferKeyForEntry,
  type AvailabilityStatus,
  type CollectionPreset,
  type GamePlanId,
  type SpeciesRule,
  type SpeciesRulesDataset,
  type SpecimenRequirements,
} from "../collection-features";
import { buildOwnedProgressCsv, decodeOcrTransferHash, matchCollectionRecords, parseCollectionCsv, parseCompactTransfer, type CollectionRecord, type ImportCatalogEntry } from "../import-export";
import {
  BACKUP_VERSION,
  CATALOG_VERSION,
  COLLECTIONS,
  DEFAULT_AVAILABILITY_FILTERS,
  DEFAULT_COLLECTIONS,
  DEFAULT_FORM_OPTIONS,
  DEFAULT_MARKS,
  GROUP_COLORS,
  MARKS,
  STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "../app-config";
import type {
  Acquisition,
  AustinAppliedNotice,
  AvailabilityFilters,
  CollectionViewMode,
  CustomBox,
  Dataset,
  FormOptions,
  GenderMode,
  GlobalGroupMode,
  GlobalReturnContext,
  GlobalSortMode,
  GlobalTooltip,
  ImportNotice,
  LocatedEntry,
  PlannedBox,
  PlannedEntry,
  PokemonEntry,
  PokemonNames,
  PokewalkerDataset,
  ProgressSnapshot,
  SelectOption,
  SpecialDataset,
  ThemeScope,
  ThemeTab,
  Variant,
} from "../app-types";
import { applyCatalogCorrections, buildBoxes, pokemonArtworkUrl } from "../catalog-planner";
import { buildBoxNavigationHash, buildGlobalNavigationHash, parseSharedNavigationHash } from "../navigation-url";
import { assetUrl, downloadText, normalize, prepareThemeImage } from "../app-utils";
import { useCollectionProgress } from "./useCollectionProgress";
import { useCollectionSearch } from "./useCollectionSearch";
import { usePersistence } from "./usePersistence";

export function useAppController() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [specialDataset, setSpecialDataset] = useState<SpecialDataset | null>(null);
  const [pokemonNames, setPokemonNames] = useState<PokemonNames | null>(null);
  const [speciesRules, setSpeciesRules] = useState<Map<number, SpeciesRule>>(new Map());
  const [homeChallenges, setHomeChallenges] = useState<HomeChallenge[]>([]);
  const [pokewalkerDexes, setPokewalkerDexes] = useState<Set<number>>(new Set());
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
  const [originIndependentDex, setOriginIndependentDex] = useState(false);
  const [collectionPreset, setCollectionPreset] = useState<CollectionPreset>("custom");
  const [availabilityFilters, setAvailabilityFilters] = useState<AvailabilityFilters>(DEFAULT_AVAILABILITY_FILTERS);
  const [language, setLanguage] = useState<UiLanguage>("ES-LA");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [capacity, setCapacity] = useState<6000 | 8000>(6000);
  const {
    owned,
    setOwned,
    livingDexOwned,
    setLivingDexOwned,
    undoDepth,
    setUndoDepth,
    changesSinceBackup,
    setChangesSinceBackup,
    progressHistoryRef,
    livingDexProgressStoredRef,
    livingDexMigrationCheckedRef,
    rememberProgressChange,
    undoOwned,
    clearProgressHistory,
  } = useCollectionProgress();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<CollectionViewMode>("boxes");
  const [globalSortMode, setGlobalSortMode] = useState<GlobalSortMode>("home");
  const [globalGroupMode, setGlobalGroupMode] = useState<GlobalGroupMode>("none");
  const [selectedGamePlan, setSelectedGamePlan] = useState<GamePlanId>("usum");
  const [gameResultLimit, setGameResultLimit] = useState(24);
  const [keyboardSlotIndex, setKeyboardSlotIndex] = useState(0);
  const [boxNameOverrides, setBoxNameOverrides] = useState<Record<string, string>>({});
  const [customBoxes, setCustomBoxes] = useState<CustomBox[]>([]);
  const [customBoxEditorId, setCustomBoxEditorId] = useState<string | null>(null);
  const [customBoxQuery, setCustomBoxQuery] = useState("");
  const [renameBoxIndex, setRenameBoxIndex] = useState(0);
  const [highlightedPlanId, setHighlightedPlanId] = useState<string | null>(null);
  const [locationAnnouncement, setLocationAnnouncement] = useState("");
  const [globalTooltip, setGlobalTooltip] = useState<GlobalTooltip | null>(null);
  const [globalReturnContext, setGlobalReturnContext] = useState<GlobalReturnContext | null>(null);
  const {
    query,
    setQuery,
    missingOnly,
    setMissingOnly,
    favoritesOnly,
    setFavoritesOnly,
    homeChallengesOnly,
    setHomeChallengesOnly,
    pokewalkerOnly,
    setPokewalkerOnly,
    matchesSearch: matchesCollectionSearch,
  } = useCollectionSearch();
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
  const [lastExternalBackupAt, setLastExternalBackupAt] = useState<number | null>(null);
  const [importNotice, setImportNotice] = useState<ImportNotice | null>(null);
  const [austinPreview, setAustinPreview] = useState<AustinJohnPreview | null>(null);
  const [austinImportBusy, setAustinImportBusy] = useState(false);
  const [austinNotice, setAustinNotice] = useState<AustinAppliedNotice | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const austinImportRef = useRef<HTMLInputElement>(null);
  const themeImportRef = useRef<HTMLInputElement>(null);
  const themeImageRef = useRef<HTMLInputElement>(null);
  const highlightedEntryRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gamePlannerRef = useRef<HTMLElement>(null);
  const transferProcessedRef = useRef(false);
  const pendingGlobalScrollRef = useRef<number | null>(null);
  const navigationInitializedRef = useRef(false);
  const suppressNavigationSyncRef = useRef(false);
  const languageOption = LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];
  const locale = languageOption.locale;
  const t = (key: string) => copy(language, key);
  const displayThemeName = (theme: BoxTheme) => theme.kind === "default" ? t("original_theme") : theme.kind === "custom" ? t("custom") : presetThemeName(theme.game, theme.wallpaper);
  const displayName = (entry: PokemonEntry) => pokemonNames?.[String(entry.dex)]?.[language] ?? entry.name;
  const displayForm = (entry: PokemonEntry) => formName(language, entry.dex, entry.form);
  const displayNote = (entry: PokemonEntry) => localizeCatalogText(language, entry.note);

  useEffect(() => {
    Promise.all([fetch(assetUrl("data/pokemon-lite.json")), fetch(assetUrl("data/special-collections.json")), fetch(assetUrl("data/pokemon-names.json")), fetch(assetUrl("data/species-rules.json")), fetch(assetUrl("data/home-challenges.json")), fetch(assetUrl("data/pokewalker.json")), fetch(assetUrl("data/mightiest-raids.json"))])
      .then(async ([baseResponse, specialResponse, namesResponse, rulesResponse, challengesResponse, pokewalkerResponse, mightiestResponse]) => {
        if (!baseResponse.ok || !specialResponse.ok || !namesResponse.ok || !rulesResponse.ok || !challengesResponse.ok || !pokewalkerResponse.ok || !mightiestResponse.ok) throw new Error("data");
        return Promise.all([baseResponse.json(), specialResponse.json(), namesResponse.json(), rulesResponse.json(), challengesResponse.json(), pokewalkerResponse.json(), mightiestResponse.json()]);
      })
      .then(([baseValue, specialValue, namesValue, rulesValue, challengesValue, pokewalkerValue, mightiestValue]: [Dataset, SpecialDataset, PokemonNames, SpeciesRulesDataset, HomeChallengesDataset, PokewalkerDataset, MightiestRaidsDataset]) => {
        const correctedEntries = applyCatalogCorrections(baseValue.entries);
        const correctedSpecialEntries = [
          ...addGoStorableForms(specialValue.entries, correctedEntries),
          createBattleBondGreninja(correctedEntries),
          ...buildMightiestRaidEntries(mightiestValue, correctedEntries),
        ];
        setDataset({ ...baseValue, entries: correctedEntries });
        setSpecialDataset({ ...specialValue, meta: { ...specialValue.meta, entryCount: correctedSpecialEntries.length, counts: { ...specialValue.meta.counts, go: correctedSpecialEntries.filter((entry) => entry.collection === "go").length, mighty: correctedSpecialEntries.filter((entry) => entry.collection === "mighty").length } }, entries: correctedSpecialEntries });
        setPokemonNames(namesValue);
        setSpeciesRules(new Map(rulesValue.species.map((rule) => [rule.dex, rule])));
        setHomeChallenges(challengesValue.challenges ?? []);
        setPokewalkerDexes(new Set(pokewalkerValue.dexes));
      })
      .catch(() => setLoadError(true));
  }, []);

  const hydrateCollection = useCallback((value: any) => {
    if (Array.isArray(value.owned)) setOwned(new Set(value.owned));
    if (Object.hasOwn(value, "livingDexOwned")) livingDexProgressStoredRef.current = true;
    if (Array.isArray(value.livingDexOwned)) setLivingDexOwned(new Set(value.livingDexOwned.filter((dex: unknown) => typeof dex === "number" && Number.isInteger(dex) && dex > 0)));
    if (Array.isArray(value.favorites)) setFavorites(new Set(value.favorites.filter((id: unknown) => typeof id === "string")));
    if (Array.isArray(value.selectedMarks)) setSelectedMarks(value.selectedMarks.filter((mark: string) => MARKS.includes(mark)));
    if (Array.isArray(value.selectedCollections)) {
      const savedCollections = value.selectedCollections.filter((collection: string) => COLLECTIONS.includes(collection));
      setSelectedCollections(value.catalogVersion >= CATALOG_VERSION ? savedCollections : [...new Set([...savedCollections, "radar", "battle-bond"])]);
    }
    if (value.variants) setVariants({ shiny: Boolean(value.variants.shiny), normal: Boolean(value.variants.normal) });
    if (value.acquisitions) setAcquisitions({
      own: Boolean(value.acquisitions.own),
      trade: typeof value.acquisitions.trade === "boolean" ? value.acquisitions.trade : true,
      event: Boolean(value.acquisitions.event),
      external: typeof value.acquisitions.external === "boolean" ? value.acquisitions.external : true,
    });
    if (typeof value.includeNonShinySpecials === "boolean") setIncludeNonShinySpecials(value.includeNonShinySpecials);
    if (typeof value.includeEventMythicals === "boolean") setIncludeEventMythicals(value.includeEventMythicals);
    if (value.genderMode === "notable" || value.genderMode === "all") setGenderMode(value.genderMode);
    if (value.formOptions) setFormOptions({
      alternate: typeof value.formOptions.alternate === "boolean" ? value.formOptions.alternate : DEFAULT_FORM_OPTIONS.alternate,
      alcremie: typeof value.formOptions.alcremie === "boolean" ? value.formOptions.alcremie : DEFAULT_FORM_OPTIONS.alcremie,
      minior: typeof value.formOptions.minior === "boolean" ? value.formOptions.minior : DEFAULT_FORM_OPTIONS.minior,
    });
    if (typeof value.normalLivingDex === "boolean") setNormalLivingDex(value.normalLivingDex);
    if (typeof value.originMarkDex === "boolean") setOriginMarkDex(value.originMarkDex);
    if (COLLECTION_PRESETS.includes(value.collectionPreset)) setCollectionPreset(value.collectionPreset);
    if (typeof value.originIndependentDex === "boolean") {
      setOriginIndependentDex(value.originIndependentDex);
      if (value.originIndependentDex) {
        setSelectedMarks([]);
        setNormalLivingDex(false);
        setOriginMarkDex(false);
        setCollectionPreset("custom");
      }
    }
    if (value.availabilityFilters) setAvailabilityFilters(Object.fromEntries(AVAILABILITY_STATUSES.map((status) => [status, value.availabilityFilters[status] !== false])) as AvailabilityFilters);
    if (typeof value.favoritesOnly === "boolean") setFavoritesOnly(value.favoritesOnly);
    if (typeof value.homeChallengesOnly === "boolean") setHomeChallengesOnly(value.homeChallengesOnly);
    if (typeof value.pokewalkerOnly === "boolean") setPokewalkerOnly(value.pokewalkerOnly);
    if (LANGUAGE_OPTIONS.some((option) => option.code === value.language)) setLanguage(value.language);
    if (value.capacity === 6000 || value.capacity === 8000) setCapacity(value.capacity);
    if (value.viewMode === "boxes" || value.viewMode === "global" || value.viewMode === "summary") setViewMode(value.viewMode);
    if (typeof value.missingOnly === "boolean") setMissingOnly(value.missingOnly);
    if (GAME_PLANS.some((game) => game.id === value.selectedGamePlan)) setSelectedGamePlan(value.selectedGamePlan);
    if (value.boxNameOverrides && typeof value.boxNameOverrides === "object") setBoxNameOverrides(Object.fromEntries(Object.entries(value.boxNameOverrides).filter(([, name]) => typeof name === "string").map(([key, name]) => [key, (name as string).slice(0, 48)])));
    if (Array.isArray(value.customBoxes)) setCustomBoxes(value.customBoxes.filter((box: unknown): box is CustomBox => Boolean(box && typeof box === "object" && typeof (box as CustomBox).id === "string" && typeof (box as CustomBox).name === "string" && Array.isArray((box as CustomBox).planIds))).map((box: CustomBox) => ({ id: box.id, name: box.name.slice(0, 48), planIds: box.planIds.filter((id) => typeof id === "string").slice(0, 30) })));
    if (typeof value.collectionGoal === "string") setCollectionGoal(value.collectionGoal.slice(0, 8));
    if (typeof value.collectionNotes === "string") setCollectionNotes(value.collectionNotes.slice(0, 2_000));
    if (typeof value.lastExternalBackupAt === "number") setLastExternalBackupAt(value.lastExternalBackupAt);
    if (typeof value.changesSinceBackup === "number" && value.changesSinceBackup >= 0) setChangesSinceBackup(Math.floor(value.changesSinceBackup));
  }, [livingDexProgressStoredRef, setChangesSinceBackup, setLivingDexOwned, setOwned]);

  const persistedCollectionState = useMemo(() => ({
    catalogVersion: CATALOG_VERSION,
    owned: [...owned],
    livingDexOwned: [...livingDexOwned],
    favorites: [...favorites],
    selectedMarks,
    selectedCollections,
    variants,
    acquisitions,
    includeNonShinySpecials,
    includeEventMythicals,
    genderMode,
    formOptions,
    normalLivingDex,
    originMarkDex,
    originIndependentDex,
    collectionPreset,
    availabilityFilters,
    favoritesOnly,
    homeChallengesOnly,
    pokewalkerOnly,
    language,
    capacity,
    viewMode,
    missingOnly,
    selectedGamePlan,
    collectionGoal,
    collectionNotes,
    boxNameOverrides,
    customBoxes,
    lastExternalBackupAt,
    changesSinceBackup,
  }), [owned, livingDexOwned, favorites, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, originIndependentDex, collectionPreset, availabilityFilters, favoritesOnly, homeChallengesOnly, pokewalkerOnly, language, capacity, viewMode, missingOnly, selectedGamePlan, collectionGoal, collectionNotes, boxNameOverrides, customBoxes, lastExternalBackupAt, changesSinceBackup]);

  const { hydrated, lastSavedAt, clock } = usePersistence({
    language,
    collectionState: persistedCollectionState,
    hydrateCollection,
    themeConfig,
    setThemeConfig,
  });

  useEffect(() => {
    if (!themeOpen && !detailEntry && !austinPreview) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setThemeOpen(false); setDetailEntry(null); setAustinPreview(null); } };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [austinPreview, themeOpen, detailEntry]);

  const boxes = useMemo(() => buildBoxes(dataset?.entries ?? [], specialDataset?.entries ?? [], selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, originIndependentDex, collectionPreset, speciesRules, language).map((box) => ({
    ...box,
    label: boxNameOverrides[`${box.groupKey}:${box.number}`] || box.label,
  })), [dataset, specialDataset, selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, originIndependentDex, collectionPreset, speciesRules, language, boxNameOverrides]);
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
    .filter((entry) => entry.availability !== "excluded" && entry.normalEligible !== false)
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
  const gameRecommendations = useMemo(() => rankGamePlans(plannedEntries, entryIsOwned, allImportEntries), [allImportEntries, entryIsOwned, plannedEntries]);
  const selectedGameMatcher = useMemo(() => createGamePlanMatcher(selectedGamePlan, allImportEntries), [allImportEntries, selectedGamePlan]);
  const gameMissingEntries = useMemo(() => locatedEntries.filter(({ entry }) => !entryIsOwned(entry) && selectedGameMatcher(entry)), [entryIsOwned, locatedEntries, selectedGameMatcher]);
  const capacityBoxes = Math.ceil(capacity / 30);
  const totalPages = Math.max(1, Math.ceil(Math.max(boxes.length, capacityBoxes) / 30));
  const ownedCount = useMemo(() => plannedEntries.reduce((sum, entry) => sum + Number(entryIsOwned(entry)), 0), [entryIsOwned, plannedEntries]);
  const progress = plannedEntries.length ? Math.round((ownedCount / plannedEntries.length) * 100) : 0;
  const selectedBox = selectedBoxIndex === null ? null : boxes[selectedBoxIndex];
  const activeBoxTheme = selectedBox ? resolveBoxTheme(themeConfig, selectedBox.groupKey, selectedBox.number) : themeConfig.global;
  const pageBoxes = Array.from({ length: 30 }, (_, offset) => boxes[pageIndex * 30 + offset] ?? null);
  const filterKey = `${selectedMarks.join("|")}:${selectedCollections.join("|")}:${variants.shiny}:${variants.normal}:${acquisitions.own}:${acquisitions.trade}:${acquisitions.event}:${acquisitions.external}:${includeNonShinySpecials}:${includeEventMythicals}:${genderMode}:${formOptions.alternate}:${formOptions.alcremie}:${formOptions.minior}:${normalLivingDex}:${originMarkDex}:${originIndependentDex}:${collectionPreset}:${homeChallengesOnly}:${pokewalkerOnly}`;

  const applyCollectionRecords = useCallback((records: CollectionRecord[], source: ImportNotice["source"]) => {
    const summary = matchCollectionRecords(records, allImportEntries, pokemonNames ?? {}, owned);
    if (summary.newPlanIds.length) {
      const importedIds = new Set(summary.newPlanIds);
      const importedEntries = allImportEntries.filter((entry) => importedIds.has(`${entry.id}:normal`) || importedIds.has(`${entry.id}:shiny`));
      setOwned((current) => new Set([...current, ...summary.newPlanIds]));
      setChangesSinceBackup((current) => current + summary.newPlanIds.length);
      clearProgressHistory();
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
    if (!hydrated || !boxes.length) return;
    const applyHash = () => {
      const route = parseSharedNavigationHash(window.location.hash);
      if (!route) return;
      suppressNavigationSyncRef.current = true;
      setGlobalReturnContext(null);
      if (route.kind === "global") {
        setQuery(route.query);
        setMissingOnly(route.missingOnly);
        setFavoritesOnly(false);
        setHomeChallengesOnly(route.homeChallengesOnly);
        setPokewalkerOnly(route.pokewalkerOnly);
        setGlobalSortMode(route.sortMode);
        setGlobalGroupMode(route.groupMode);
        setSelectedBoxIndex(null);
        setGlobalTooltip(null);
        setViewMode("global");
      } else if (route.boxIndex < boxes.length) {
        const box = boxes[route.boxIndex];
        const slotIndex = Math.min(route.slotIndex, Math.max(0, box.entries.length - 1));
        const requestedHash = window.location.hash;
        const applyBoxSelection = () => {
          if (window.location.hash !== requestedHash) return;
          setPageIndex(Math.floor(route.boxIndex / 30));
          setSelectedBoxIndex(route.boxIndex);
          setKeyboardSlotIndex(slotIndex);
          setHighlightedPlanId(box.entries[slotIndex]?.planId ?? null);
          setViewMode("boxes");
        };
        setQuery("");
        setMissingOnly(false);
        setFavoritesOnly(false);
        setHomeChallengesOnly(false);
        setPokewalkerOnly(false);
        applyBoxSelection();
        window.setTimeout(applyBoxSelection, 50);
      }
      window.setTimeout(() => { suppressNavigationSyncRef.current = false; }, route.kind === "box" ? 80 : 0);
    };
    if (!navigationInitializedRef.current) {
      navigationInitializedRef.current = true;
      applyHash();
    }
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [boxes, hydrated]);

  useEffect(() => {
    if (!hydrated || !boxes.length || !navigationInitializedRef.current || suppressNavigationSyncRef.current) return;
    const currentParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (currentParams.has("ocr")) return;
    const nextHash = viewMode === "global"
      ? buildGlobalNavigationHash({ query, missingOnly, homeChallengesOnly, pokewalkerOnly, sortMode: globalSortMode, groupMode: globalGroupMode })
      : viewMode === "boxes" && selectedBoxIndex !== null
        ? buildBoxNavigationHash(selectedBoxIndex, keyboardSlotIndex)
        : "";
    if (window.location.hash === nextHash) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }, [boxes.length, globalGroupMode, globalSortMode, homeChallengesOnly, hydrated, keyboardSlotIndex, missingOnly, pokewalkerOnly, query, selectedBoxIndex, viewMode]);

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

  useEffect(() => {
    if (viewMode !== "global" || pendingGlobalScrollRef.current === null) return;
    const scrollY = pendingGlobalScrollRef.current;
    const frame = window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" })));
    const timers = [140, 400].map((delay) => window.setTimeout(() => window.scrollTo({ top: scrollY, behavior: "auto" }), delay));
    const finalTimer = window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
      if (pendingGlobalScrollRef.current === scrollY) pendingGlobalScrollRef.current = null;
    }, 800);
    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(finalTimer);
    };
  }, [viewMode]);

  const matchesSearch = (entry: PlannedEntry) => matchesCollectionSearch(entry, {
    displayName,
    displayForm,
    translate: t,
    entryIsOwned,
    favorites,
    homeChallengeDexes,
    pokewalkerDexes,
    availabilityFilters,
  });

  const visibleGlobalEntries = locatedEntries.filter(({ entry }) => matchesSearch(entry));
  const visibleGlobalOwned = visibleGlobalEntries.reduce((sum, { entry }) => sum + Number(entryIsOwned(entry)), 0);
  const compareByHomeOrder = (a: LocatedEntry, b: LocatedEntry) => a.box.globalIndex - b.box.globalIndex || a.slotIndex - b.slotIndex;
  const compareLocalized = (a: string, b: string) => a.localeCompare(b, locale, { numeric: true, sensitivity: "base" });
  const sortedGlobalEntries = [...visibleGlobalEntries].sort((a, b) => {
    if (globalSortMode === "pokedex") return a.entry.dex - b.entry.dex || compareByHomeOrder(a, b);
    if (globalSortMode === "generation") return generationForDex(a.entry.dex) - generationForDex(b.entry.dex) || a.entry.dex - b.entry.dex || compareByHomeOrder(a, b);
    if (globalSortMode === "origin-mark") {
      const aLabel = a.entry.genericEntry ? t("no_origin_required") : groupName(language, a.entry.mark ?? a.entry.groupKey);
      const bLabel = b.entry.genericEntry ? t("no_origin_required") : groupName(language, b.entry.mark ?? b.entry.groupKey);
      return compareLocalized(aLabel, bLabel) || a.entry.dex - b.entry.dex || compareByHomeOrder(a, b);
    }
    if (globalSortMode === "missing-first") return Number(entryIsOwned(a.entry)) - Number(entryIsOwned(b.entry)) || compareByHomeOrder(a, b);
    return compareByHomeOrder(a, b);
  });
  const globalEntryGroups = (() => {
    if (globalGroupMode === "none") return [{ key: "all", label: "", entries: sortedGlobalEntries }];
    const groups = new Map<string, { key: string; label: string; entries: LocatedEntry[] }>();
    sortedGlobalEntries.forEach((located) => {
      const { entry } = located;
      let key: string;
      let label: string;
      if (globalGroupMode === "generation") {
        key = `generation-${generationForDex(entry.dex)}`;
        label = `${t("generation")} ${generationForDex(entry.dex)}`;
      } else if (globalGroupMode === "collection") {
        key = entry.collection ? `collection-${entry.collection}` : entry.genericEntry ? "collection-generic" : "collection-origin-marks";
        label = entry.collection ? groupName(language, entry.collection) : entry.genericEntry ? t("generic_specimen") : t("origin_marks");
      } else {
        key = entry.genericEntry ? "origin-generic" : `origin-${entry.mark ?? entry.groupKey}`;
        label = entry.genericEntry ? t("no_origin_required") : groupName(language, entry.mark ?? entry.groupKey);
      }
      const group = groups.get(key) ?? { key, label, entries: [] };
      group.entries.push(located);
      groups.set(key, group);
    });
    return [...groups.values()];
  })();
  const globalAllOwned = visibleGlobalEntries.length > 0 && visibleGlobalEntries.every(({ entry }) => entryIsOwned(entry));
  const globalBulkLabel = t(globalAllOwned ? "unmark_results" : "mark_results").replace("{count}", visibleGlobalEntries.length.toLocaleString(locale));
  const globalReturnLabel = globalReturnContext
    ? globalReturnContext.query
      ? t("return_to_query").replace("{count}", globalReturnContext.resultsCount.toLocaleString(locale)).replace("{query}", globalReturnContext.query)
      : globalReturnContext.missingOnly
        ? t("return_to_missing").replace("{count}", globalReturnContext.resultsCount.toLocaleString(locale))
        : t("return_to_results").replace("{count}", globalReturnContext.resultsCount.toLocaleString(locale))
    : "";

  const showGlobalTooltip = (element: HTMLButtonElement, located: LocatedEntry) => {
    const rect = element.getBoundingClientRect();
    const width = Math.min(236, window.innerWidth - 32);
    const left = Math.max(16, Math.min(window.innerWidth - width - 16, rect.left + (rect.width - width) / 2));
    const above = rect.bottom + 245 > window.innerHeight && rect.top > 245;
    setGlobalTooltip({ located, left, top: above ? rect.top - 10 : rect.bottom + 10, above });
  };

  const locateEntryInBoxes = (located: LocatedEntry) => {
    if (viewMode === "global") {
      setGlobalReturnContext({
        query,
        missingOnly,
        homeChallengesOnly,
        pokewalkerOnly,
        sortMode: globalSortMode,
        groupMode: globalGroupMode,
        resultsCount: visibleGlobalEntries.length,
        scrollY: window.scrollY,
      });
    } else {
      setGlobalReturnContext(null);
    }
    setGlobalTooltip(null);
    setPageIndex(Math.floor(located.box.globalIndex / 30));
    setSelectedBoxIndex(located.box.globalIndex);
    setKeyboardSlotIndex(located.slotIndex);
    setHighlightedPlanId(located.entry.planId);
    setLocationAnnouncement(`${displayName(located.entry)} · ${t("box")} ${String(located.box.globalIndex + 1).padStart(3, "0")} · ${t("slot")} ${String(located.slotIndex + 1).padStart(2, "0")}`);
    setViewMode("boxes");
  };

  const returnToGlobalResults = () => {
    if (!globalReturnContext) return;
    pendingGlobalScrollRef.current = globalReturnContext.scrollY;
    setQuery(globalReturnContext.query);
    setMissingOnly(globalReturnContext.missingOnly);
    setFavoritesOnly(false);
    setHomeChallengesOnly(globalReturnContext.homeChallengesOnly);
    setPokewalkerOnly(globalReturnContext.pokewalkerOnly);
    setGlobalSortMode(globalReturnContext.sortMode);
    setGlobalGroupMode(globalReturnContext.groupMode);
    setSelectedBoxIndex(null);
    setGlobalTooltip(null);
    setGlobalReturnContext(null);
    setViewMode("global");
  };

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

  const presetUsesOriginIndependentDex = UNIFIED_COLLECTION_PRESETS.has(collectionPreset);
  const originIndependentSelected = originIndependentDex || presetUsesOriginIndependentDex;
  const markProfileCustom = () => {
    setCollectionPreset("custom");
    setNormalLivingDex(false);
    setOriginMarkDex(false);
    if (originIndependentSelected) {
      setOriginIndependentDex(true);
      setSelectedMarks([]);
    }
  };
  const selectOriginIndependentDex = () => {
    if (originIndependentSelected) return;
    markProfileCustom();
    setOriginIndependentDex(true);
    setSelectedMarks([]);
  };
  const toggleMark = (mark: string) => {
    const switchingFromOriginIndependent = originIndependentSelected;
    markProfileCustom();
    setOriginIndependentDex(false);
    setSelectedMarks((current) => switchingFromOriginIndependent
      ? [mark]
      : current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark]);
  };
  const toggleCollection = (collection: string) => { markProfileCustom(); setSelectedCollections((current) => current.includes(collection) ? current.filter((item) => item !== collection) : [...current, collection]); };
  const setVariant = (variant: Variant) => {
    if (collectionPreset !== "forms" && collectionPreset !== "forms_lite" && collectionPreset !== "shiny") markProfileCustom();
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
    setPokewalkerOnly(false);
    setNormalLivingDex(preset === "basic");
    setOriginMarkDex(preset === "origin");
    setOriginIndependentDex(false);
    if (preset === "basic") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: false, alcremie: false, minior: false }); }
    if (preset === "shiny_basic") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: false, alcremie: false, minior: false }); }
    if (preset === "final") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: true, alcremie: false, minior: false }); }
    if (preset === "shiny_final") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: true, alcremie: false, minior: false }); }
    if (preset === "regional") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: true, alcremie: false, minior: false }); }
    if (preset === "shiny_regional") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("notable"); setFormOptions({ alternate: true, alcremie: false, minior: false }); }
    if (preset === "forms_lite") { setVariants({ shiny: false, normal: true }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("all"); setFormOptions({ alternate: true, alcremie: true, minior: true }); }
    if (preset === "shiny_forms_lite") { setVariants({ shiny: true, normal: false }); setAcquisitions({ own: true, trade: false, event: false, external: false }); setIncludeNonShinySpecials(false); setSelectedMarks(DEFAULT_MARKS); setSelectedCollections([]); setGenderMode("all"); setFormOptions({ alternate: true, alcremie: true, minior: true }); }
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

  const createBackupPayload = (backupAt: number) => ({
    type: "home-checklist-backup",
    version: BACKUP_VERSION,
    catalogVersion: CATALOG_VERSION,
    exportedAt: new Date(backupAt).toISOString(),
    lastExternalBackupAt: backupAt,
    changesSinceBackup: 0,
    progress: { owned: [...owned], livingDexOwned: [...livingDexOwned], favorites: [...favorites] },
    configuration: {
      selectedMarks, selectedCollections, variants, acquisitions, includeNonShinySpecials, includeEventMythicals,
      genderMode, formOptions, normalLivingDex, originMarkDex, originIndependentDex, collectionPreset,
      availabilityFilters, favoritesOnly, homeChallengesOnly, pokewalkerOnly, language, capacity, viewMode, missingOnly,
      selectedGamePlan, collectionGoal, collectionNotes, boxNameOverrides, customBoxes,
    },
    themes: themeConfig,
  });

  const exportBackup = (format: "json" | "project") => {
    const projectFile = format === "project";
    const backupAt = Date.now();
    downloadText(
      projectFile ? "home-checklist-backup.homechecklist" : "home-checklist-backup.json",
      JSON.stringify(createBackupPayload(backupAt), null, 2),
      projectFile ? "application/vnd.home-checklist+json" : "application/json",
    );
    setLastExternalBackupAt(backupAt);
    setChangesSinceBackup(0);
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
    clearProgressHistory();
    if (Array.isArray(progress.favorites)) setFavorites(new Set(progress.favorites.filter((id): id is string => typeof id === "string")));
    if (Array.isArray(configuration.selectedMarks)) setSelectedMarks(configuration.selectedMarks.filter((mark): mark is string => typeof mark === "string" && MARKS.includes(mark)));
    if (Array.isArray(configuration.selectedCollections)) {
      const savedCollections = configuration.selectedCollections.filter((collection): collection is string => typeof collection === "string" && COLLECTIONS.includes(collection));
      setSelectedCollections(Number(value.catalogVersion) >= CATALOG_VERSION ? savedCollections : [...new Set([...savedCollections, "radar", "battle-bond"])]);
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
    if (typeof configuration.includeEventMythicals === "boolean") setIncludeEventMythicals(configuration.includeEventMythicals);
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
    if (typeof configuration.originIndependentDex === "boolean") {
      setOriginIndependentDex(configuration.originIndependentDex);
      if (configuration.originIndependentDex) {
        setSelectedMarks([]);
        setNormalLivingDex(false);
        setOriginMarkDex(false);
        setCollectionPreset("custom");
      }
    }
    const savedAvailabilityFilters = configuration.availabilityFilters as Record<string, unknown> | undefined;
    if (savedAvailabilityFilters) setAvailabilityFilters(Object.fromEntries(AVAILABILITY_STATUSES.map((status) => [status, savedAvailabilityFilters[status] !== false])) as AvailabilityFilters);
    if (typeof configuration.favoritesOnly === "boolean") setFavoritesOnly(configuration.favoritesOnly);
    if (typeof configuration.homeChallengesOnly === "boolean") setHomeChallengesOnly(configuration.homeChallengesOnly);
    if (typeof configuration.pokewalkerOnly === "boolean") setPokewalkerOnly(configuration.pokewalkerOnly);
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
    const exportedAt = typeof value.exportedAt === "string" ? Date.parse(value.exportedAt) : Number.NaN;
    const backupAt = typeof value.lastExternalBackupAt === "number" ? value.lastExternalBackupAt : exportedAt;
    setLastExternalBackupAt(Number.isFinite(backupAt) ? backupAt : Date.now());
    setChangesSinceBackup(0);
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

  const markCounts: Record<string, number> = dataset && specialDataset ? Object.fromEntries(MARKS.map((mark) => {
    const entriesForMark = buildBoxes(dataset.entries, specialDataset.entries, [mark], [], variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, false, collectionPreset, speciesRules, language).flatMap((box) => box.entries);
    return [mark, entriesForMark.length];
  })) : {};
  const collectionCounts: Record<string, number> = dataset && specialDataset ? Object.fromEntries(COLLECTIONS.map((collection) => {
    const entriesForCollection = buildBoxes([], specialDataset.entries, [], [collection], variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, normalLivingDex, originMarkDex, false, collectionPreset, speciesRules, language).flatMap((box) => box.entries);
    return [collection, entriesForCollection.length];
  })) : {};
  const originIndependentCount = originIndependentSelected
    ? plannedEntries.filter((entry) => entry.genericEntry).length
    : dataset && specialDataset
      ? buildBoxes(dataset.entries, specialDataset.entries, [], [], variants, acquisitions, includeNonShinySpecials, includeEventMythicals, genderMode, formOptions, false, false, true, "custom", speciesRules, language).flatMap((box) => box.entries).length
      : 0;
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
  const externalBackupWhen = (() => {
    if (!lastExternalBackupAt) return t("no_external_backup");
    const ageSeconds = Math.max(0, Math.floor((clock - lastExternalBackupAt) / 1_000));
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (ageSeconds < 60) return formatter.format(-ageSeconds, "second");
    const ageMinutes = Math.floor(ageSeconds / 60);
    if (ageMinutes < 60) return formatter.format(-ageMinutes, "minute");
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours < 24) return formatter.format(-ageHours, "hour");
    return formatter.format(-Math.floor(ageHours / 24), "day");
  })();
  const boxBeingRenamed = boxes[renameBoxIndex] ?? null;
  const customBoxEditor = customBoxes.find((box) => box.id === customBoxEditorId) ?? null;
  const normalizedCustomBoxQuery = normalize(customBoxQuery);
  const customBoxSearchResults = databaseChoices.filter((entry) => !normalizedCustomBoxQuery || normalize(`${displayName(entry)} ${displayForm(entry) ?? ""} ${entry.dex} ${entry.groupLabel}`).includes(normalizedCustomBoxQuery)).slice(0, 120);

  return {
    dataset,
    specialDataset,
    pokemonNames,
    pokewalkerDexes,
    loadError,
    selectedMarks,
    selectedCollections,
    variants,
    acquisitions,
    includeNonShinySpecials,
    setIncludeNonShinySpecials,
    includeEventMythicals,
    setIncludeEventMythicals,
    genderMode,
    setGenderMode,
    formOptions,
    setFormOptions,
    originIndependentDex,
    originIndependentSelected,
    collectionPreset,
    availabilityFilters,
    setAvailabilityFilters,
    language,
    setLanguage,
    languageOpen,
    setLanguageOpen,
    capacity,
    setCapacity,
    owned,
    livingDexOwned,
    favorites,
    pageIndex,
    setPageIndex,
    selectedBoxIndex,
    setSelectedBoxIndex,
    viewMode,
    setViewMode,
    globalSortMode,
    setGlobalSortMode,
    globalGroupMode,
    setGlobalGroupMode,
    selectedGamePlan,
    setSelectedGamePlan,
    gameResultLimit,
    setGameResultLimit,
    undoDepth,
    keyboardSlotIndex,
    setKeyboardSlotIndex,
    customBoxes,
    setCustomBoxEditorId,
    customBoxQuery,
    setCustomBoxQuery,
    setRenameBoxIndex,
    highlightedPlanId,
    locationAnnouncement,
    globalTooltip,
    setGlobalTooltip,
    globalReturnContext,
    setGlobalReturnContext,
    query,
    setQuery,
    missingOnly,
    setMissingOnly,
    favoritesOnly,
    setFavoritesOnly,
    homeChallengesOnly,
    setHomeChallengesOnly,
    pokewalkerOnly,
    setPokewalkerOnly,
    detailEntry,
    setDetailEntry,
    filtersOpen,
    setFiltersOpen,
    themeConfig,
    themeOpen,
    setThemeOpen,
    themeScope,
    setThemeScope,
    themeTab,
    conceptGame,
    themeDraft,
    customThemeDraft,
    customColors,
    collectionGoal,
    setCollectionGoal,
    collectionNotes,
    setCollectionNotes,
    lastExternalBackupAt,
    changesSinceBackup,
    importNotice,
    setImportNotice,
    austinPreview,
    setAustinPreview,
    austinImportBusy,
    austinNotice,
    setAustinNotice,
    importRef,
    austinImportRef,
    themeImportRef,
    themeImageRef,
    highlightedEntryRef,
    searchInputRef,
    gamePlannerRef,
    languageOption,
    locale,
    t,
    displayThemeName,
    displayName,
    displayForm,
    displayNote,
    boxes,
    databaseChoiceByPlanId,
    plannedEntries,
    homeChallengesByDex,
    homeChallengeDexes,
    entryIsOwned,
    generationSummary,
    originSummary,
    availabilitySummary,
    gameRecommendations,
    gameMissingEntries,
    capacityBoxes,
    totalPages,
    ownedCount,
    progress,
    selectedBox,
    activeBoxTheme,
    pageBoxes,
    matchesSearch,
    visibleGlobalEntries,
    visibleGlobalOwned,
    globalEntryGroups,
    globalAllOwned,
    globalBulkLabel,
    globalReturnLabel,
    showGlobalTooltip,
    locateEntryInBoxes,
    returnToGlobalResults,
    undoOwned,
    toggleOwned,
    toggleFavorite,
    toggleEntries,
    resetProgress,
    renamePlannedBox,
    createCustomBox,
    deleteCustomBox,
    updateCustomBox,
    toggleCustomBoxEntry,
    markProfileCustom,
    selectOriginIndependentDex,
    toggleMark,
    toggleCollection,
    setVariant,
    setAcquisition,
    applyCollectionPreset,
    toggleAvailability,
    jumpToBox,
    openThemeDialog,
    chooseThemeTab,
    chooseConceptGame,
    chooseWallpaper,
    importCustomThemeImage,
    updateCustomColor,
    applyBoxTheme,
    resetBoxTheme,
    exportBackup,
    exportProgressCsv,
    importData,
    importAustinJohnData,
    applyAustinJohnImport,
    exportThemeBackup,
    importThemeBackup,
    markCounts,
    originIndependentCount,
    collectionCounts,
    availabilityCounts,
    favoriteCount,
    availabilityFiltering,
    visiblePageEntries,
    pageAllOwned,
    themeGameOption,
    themeCanApply,
    savedWhen,
    externalBackupWhen,
    boxBeingRenamed,
    customBoxEditor,
    customBoxSearchResults,
  };
}

export type AppController = ReturnType<typeof useAppController>;
