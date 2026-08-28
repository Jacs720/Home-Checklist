import { useCallback, useState } from "react";
import type { AvailabilityFilters, PlannedEntry } from "../app-types";
import { normalize } from "../app-utils";
import { availabilityForEntry } from "../collection-features";

type SearchContext = {
  displayName: (entry: PlannedEntry) => string;
  displayForm: (entry: PlannedEntry) => string | null;
  translate: (key: string) => string;
  entryIsOwned: (entry: PlannedEntry) => boolean;
  favorites: ReadonlySet<string>;
  homeChallengeDexes: ReadonlySet<number>;
  pokewalkerDexes: ReadonlySet<number>;
  availabilityFilters: AvailabilityFilters;
};

export function useCollectionSearch() {
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [homeChallengesOnly, setHomeChallengesOnly] = useState(false);
  const [pokewalkerOnly, setPokewalkerOnly] = useState(false);

  const matchesSearch = useCallback((entry: PlannedEntry, context: SearchContext) => {
    const { displayName, displayForm, translate: t, entryIsOwned, favorites, homeChallengeDexes, pokewalkerDexes, availabilityFilters } = context;
    const matchesQuery = !query || normalize(`${displayName(entry)} ${entry.name} ${displayForm(entry) ?? ""} ${entry.form ?? ""} ${entry.displayDetail ?? ""} ${entry.note ?? ""} ${entry.gender ? t(entry.gender) : ""} ${entry.dex} ${String(entry.dex).padStart(3, "0")} ${String(entry.dex).padStart(4, "0")} ${entry.mark ?? ""} ${entry.groupLabel} ${entry.trainerName ?? ""} ${entry.trainerId ?? ""} ${entry.nickname ?? ""} ${entry.ball ?? ""} ${entry.nature ?? ""} ${entry.ability ?? ""} ${entry.heldItem ?? ""} ${entry.eventYear ?? ""} ${entry.eventLocation ?? ""} ${entry.eventType ?? ""} ${(entry.moves ?? []).join(" ")} ${(entry.ribbons ?? []).join(" ")} ${JSON.stringify(entry.requirements ?? {})} ${entry.ownOt ? t("your_ot") : t("foreign_ot")}`).includes(normalize(query));
    return matchesQuery
      && (!missingOnly || !entryIsOwned(entry))
      && (!favoritesOnly || favorites.has(entry.planId))
      && (!homeChallengesOnly || homeChallengeDexes.has(entry.dex))
      && (!pokewalkerOnly || pokewalkerDexes.has(entry.dex))
      && availabilityFilters[availabilityForEntry(entry)];
  }, [favoritesOnly, homeChallengesOnly, missingOnly, pokewalkerOnly, query]);

  return {
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
    matchesSearch,
  };
}
