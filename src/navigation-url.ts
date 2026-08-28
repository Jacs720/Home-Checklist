import type { GlobalGroupMode, GlobalSortMode } from "./app-types";

const GLOBAL_SORT_MODES: GlobalSortMode[] = ["home", "pokedex", "generation", "origin-mark", "missing-first"];
const GLOBAL_GROUP_MODES: GlobalGroupMode[] = ["none", "origin-mark", "generation", "collection"];

export type SharedNavigationRoute =
  | {
      kind: "global";
      query: string;
      missingOnly: boolean;
      homeChallengesOnly: boolean;
      pokewalkerOnly: boolean;
      sortMode: GlobalSortMode;
      groupMode: GlobalGroupMode;
    }
  | { kind: "box"; boxIndex: number; slotIndex: number };

const enabled = (value: string | null) => value === "true" || value === "1";

export function parseSharedNavigationHash(hash: string): SharedNavigationRoute | null {
  const raw = hash.replace(/^#/, "");
  if (!raw || raw.startsWith("ocr=")) return null;
  if (raw === "global" || raw.startsWith("global?")) {
    const params = new URLSearchParams(raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "");
    const sort = params.get("sort");
    const group = params.get("group");
    return {
      kind: "global",
      query: (params.get("pokemon") ?? "").slice(0, 120),
      missingOnly: enabled(params.get("missing")),
      homeChallengesOnly: enabled(params.get("challenges")),
      pokewalkerOnly: enabled(params.get("pokewalker")),
      sortMode: GLOBAL_SORT_MODES.includes(sort as GlobalSortMode) ? sort as GlobalSortMode : "home",
      groupMode: GLOBAL_GROUP_MODES.includes(group as GlobalGroupMode) ? group as GlobalGroupMode : "none",
    };
  }
  if (raw.startsWith("box=")) {
    const params = new URLSearchParams(raw);
    const box = Number.parseInt(params.get("box") ?? "", 10);
    const slot = Number.parseInt(params.get("slot") ?? "1", 10);
    if (Number.isInteger(box) && box > 0 && Number.isInteger(slot) && slot > 0 && slot <= 30) {
      return { kind: "box", boxIndex: box - 1, slotIndex: slot - 1 };
    }
  }
  return null;
}

export function buildGlobalNavigationHash(route: Omit<Extract<SharedNavigationRoute, { kind: "global" }>, "kind">) {
  const params = new URLSearchParams();
  if (route.query.trim()) params.set("pokemon", route.query.trim());
  if (route.missingOnly) params.set("missing", "true");
  if (route.homeChallengesOnly) params.set("challenges", "true");
  if (route.pokewalkerOnly) params.set("pokewalker", "true");
  if (route.sortMode !== "home") params.set("sort", route.sortMode);
  if (route.groupMode !== "none") params.set("group", route.groupMode);
  const query = params.toString();
  return `#global${query ? `?${query}` : ""}`;
}

export function buildBoxNavigationHash(boxIndex: number, slotIndex: number) {
  return `#box=${boxIndex + 1}&slot=${slotIndex + 1}`;
}
