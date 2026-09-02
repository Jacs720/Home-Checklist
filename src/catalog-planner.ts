import { COLLECTIONS, COLLECTION_ACQUISITIONS, DEFAULT_MARKS, MARKS, MYTHICAL_DEX } from "./app-config";
import type { Acquisition, FormOptions, GenderMode, PlannedBox, PlannedEntry, PokemonEntry, Variant } from "./app-types";
import { assetUrl, chunk } from "./app-utils";
import { packBoxesContinuously } from "./box-packing";
import {
  addStorableShayminSkyForms,
  addSwShHisuianEvolutionEntries,
  correctBloodmoonUrsalunaDex,
  correctModernAlolanOriginAvailability,
  insertCatalogEntry,
  markLgpeAlolanFormsAsInGameTrades,
  removeInvalidGbaKingambit,
  selectNormalLivingDexEntries,
} from "./catalog-corrections";
import {
  UNIFIED_COLLECTION_PRESETS,
  type CollectionPreset,
  type SpeciesRule,
  type SpecimenRequirements,
  genericSpecimenKey,
  regionKeyForGeneration,
  selectFinalFormDexEntries,
  selectLivingDexEntries,
  selectLivingDexWithRegionalForms,
  selectLivingFormEntries,
  selectLivingFormLiteEntries,
  selectNoahsArkEntries,
  selectOriginalGenerationEntries,
} from "./collection-features";
import { copy, groupName, type UiLanguage } from "./translations";
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
  "SwSh:103:Alolan",
  "SwSh:144:Galarian", "SwSh:145:Galarian", "SwSh:146:Galarian",
  // Request 83's Alolan Vulpix is shiny-locked; its evolution retains the lock.
  // https://rotomlabs.net/legends-arceus/shiny-rates#shiny-locks
  "LA:37:Alolan", "LA:38:Alolan",
  "SV:901:Bloodmoon", "SV:999:Roaming Form",
  "LZA:901:Bloodmoon", "LZA:999:Roaming Form",
]);

export function isOwnOtShinyLocked(entry: Pick<PokemonEntry, "mark" | "dex" | "form">) {
  const formKey = `${entry.mark}:${entry.dex}:${entry.form ?? ""}`;
  return Boolean(entry.mark && OWN_OT_SHINY_LOCKS_BY_MARK[entry.mark]?.has(entry.dex)) || FORM_SPECIFIC_OWN_OT_SHINY_LOCKS.has(formKey);
}
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

export function applyCatalogCorrections(entries: PokemonEntry[]) {
  const uniqueFormIds = entries.map((entry) => entry.dex === 720 && entry.form === "Unbound" ? {
    ...entry,
    id: entry.id === "LZA:hoopa" ? "LZA:hoopa-unbound" : entry.id,
    artId: 10086,
  } : entry);
  let correctedEntries = correctModernAlolanOriginAvailability(correctBloodmoonUrsalunaDex(addSwShHisuianEvolutionEntries(expandCollectibleForms(uniqueFormIds))));
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
    if (!isOwnOtShinyLocked(correctedEntry)) return correctedEntry;
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
function eventExclusiveEntriesForMark(
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
      (MYTHICAL_DEX.has(entry.dex) || entry.shinyEligible)
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
        availability: entry.endDate && !/^No End Date$/i.test(entry.endDate)
          ? "historical" as const
          : entry.availability,
        normalEligible: variant === "normal",
        shinyEligible: variant === "shiny",
        ownOtNormal: false,
        ownOtShiny: false,
      };
    });
}
export function buildBoxes(
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
  originIndependentDex: boolean,
  collectionPreset: CollectionPreset,
  speciesRules: Map<number, SpeciesRule>,
  language: UiLanguage,
  saveSpace = false,
) {
  const boxes: PlannedBox[] = [];
  const unifiedCandidates: PlannedEntry[] = [];
  const unifiedProfile = normalLivingDex || UNIFIED_COLLECTION_PRESETS.has(collectionPreset);
  const hasUnifiedEntries = unifiedProfile || originIndependentDex;
  const separateGroups: Array<{ key: string; label: string; entries: PlannedEntry[] }> = [];
  const effectiveMarks = originIndependentDex ? DEFAULT_MARKS : selectedMarks;
  const groups = [
  ...MARKS.filter((mark) => effectiveMarks.includes(mark)).map((key) => ({
    key,
    label: groupName(language, key),
    entries: [
      ...entries.filter((entry) => entry.mark === key),
      ...(includeEventMythicals
        ? eventExclusiveEntriesForMark(key, entries, specialEntries)
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

        const isEventExclusive =
          entry.id.includes(":historical-event:");

        if (
          acquisitions[acquisition] ||
          unifiedProfile ||
          (includeEventMythicals && isEventExclusive)
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

        const isEventExclusive =
          entry.id.includes(":historical-event:");

        if (
          acquisitions[acquisition] ||
          (includeEventMythicals && isEventExclusive)
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
    if (unifiedProfile || (originIndependentDex && !group.special)) unifiedCandidates.push(...planned);
    else separateGroups.push({
      key: group.key,
      label: group.label,
      entries: originMarkDex ? selectNormalLivingDexEntries(planned) : planned,
    });
  }
  if ((unifiedProfile || originIndependentDex) && variants.normal) {
    specialEntries
      .filter((entry) => entry.availability !== "excluded" && entry.normalEligible !== false)
      .forEach((entry) => unifiedCandidates.push({
        ...entry,
        variant: "normal",
        ownOt: entry.ownOtNormal,
        groupKey: entry.collection ?? entry.mark ?? "generic",
        groupLabel: groupName(language, entry.collection ?? entry.mark ?? "generic"),
        planId: `${entry.id}:normal`,
      }));
  }
  if ((unifiedProfile || originIndependentDex) && variants.shiny) {
    const roamingGimmighoul = specialEntries.find((entry) => (
      entry.collection === "go"
      && entry.dex === 999
      && entry.form === "Roaming Form"
      && entry.shinyEligible
    ));
    if (roamingGimmighoul) {
      unifiedCandidates.push({
        ...roamingGimmighoul,
        variant: "shiny",
        ownOt: roamingGimmighoul.ownOtShiny,
        groupKey: "go",
        groupLabel: groupName(language, "go"),
        planId: `${roamingGimmighoul.id}:shiny`,
      });
    }
  }
  if (hasUnifiedEntries) {
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
      const selected = originIndependentDex
        ? (formOptions.alternate || formOptions.alcremie || formOptions.minior || genderMode === "all"
          ? selectLivingFormEntries(unifiedCandidates)
          : selectLivingDexEntries(unifiedCandidates))
        : collectionPreset === "final" || collectionPreset === "shiny_final"
          ? selectFinalFormDexEntries(unifiedCandidates, speciesRules)
          : collectionPreset === "regional" || collectionPreset === "shiny_regional"
            ? selectLivingDexWithRegionalForms(unifiedCandidates)
            : collectionPreset === "forms_lite" || collectionPreset === "shiny_forms_lite"
              ? selectLivingFormLiteEntries(unifiedCandidates)
              : collectionPreset === "forms" || collectionPreset === "shiny"
                ? selectLivingFormEntries(unifiedCandidates)
                : collectionPreset === "noah"
                  ? selectNoahsArkEntries(unifiedCandidates, speciesRules)
                  : selectNormalLivingDexEntries(unifiedCandidates);
      const groupKey = normalLivingDex ? "living-dex" : originIndependentDex ? "origin-independent-living-dex" : `profile-${collectionPreset}`;
      const groupLabel = normalLivingDex ? copy(language, "normal_living_dex") : originIndependentDex ? copy(language, "origin_mode_living_dex") : copy(language, `profile_${collectionPreset}`);
      chunk(selected.map((entry) => asGenericSpecimen({ ...entry, groupKey, groupLabel })), 30).forEach((boxEntries, index) => {
        boxes.push({ globalIndex: boxes.length, groupKey, number: index + 1, label: `${groupLabel} ${String(index + 1).padStart(2, "0")}`, entries: boxEntries });
      });
    }
  }
  for (const group of separateGroups) {
    chunk(group.entries, 30).forEach((boxEntries, index) => {
      boxes.push({ globalIndex: boxes.length, groupKey: group.key, number: index + 1, label: `${group.label} ${String(index + 1).padStart(2, "0")}`, entries: boxEntries });
    });
  }
  return packBoxesContinuously(boxes, saveSpace);
}

function unownSpriteKey(form: string | null) {
  if (form === "!") return "exclamation";
  if (form === "?") return "question";
  return form?.toLowerCase() ?? null;
}

export function pokemonArtworkUrl(entry: PlannedEntry) {
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
  if (alcremieCream >= 0 && alcremieSweet >= 0) customKey = entry.variant === "shiny" ? `0869-shiny-${alcremieSweet}` : `0869-${alcremieCream}-${alcremieSweet}`;
  if (entry.dex === 774 && entry.variant === "shiny") customKey = "10136";
  if (customKey) return assetUrl(`assets/pokemon/${entry.variant}/${customKey}.webp`);
  const unownForm = entry.dex === 201 ? unownSpriteKey(entry.form) : null;
  const suffix = unownForm ? `-${unownForm}` : entry.genderVariant === "extra" ? "-female" : "";
  const filename = `${String(entry.artId).padStart(4, "0")}${suffix}.webp`;
  return assetUrl(`assets/pokemon/${entry.variant}/${filename}`);
}
