import snapshot from "../public/data/go-availability.json";
import { matchGoForm, type GoFact, type GoSpeciesFact } from "./go-form-match";

export type GoAvailability = GoFact & { sourceForm: string; transfer: "allowed" | "blocked" | "unreleased" | "unknown"; checkedOn: string; sourceUrl: string; revisionId?: number };
type GoEntry = { collection?: string; dex: number; form?: string | null; variant?: string; goAvailability?: GoAvailability };
const species = snapshot.species as unknown as Record<string, GoSpeciesFact>;

export function getGoAvailability(entry: GoEntry): GoAvailability {
  const record = species[String(entry.dex)];
  return {
    ...(record ? matchGoForm(entry.dex, entry.form, record) : { release: "unknown" as const, shiny: "unknown" as const, methods: [], sourceForm: "", transfer: "unknown" as const }),
    checkedOn: snapshot.meta.asOf,
    sourceUrl: record?.sourceUrl ?? snapshot.meta.sourceUrl,
    revisionId: record?.revisionId,
  };
}

export function applyGoAvailability<T extends GoEntry & { shinyEligible: boolean }>(entries: T[]): T[] {
  return entries.map(entry => {
    if (entry.collection !== "go") return entry;
    const goAvailability = getGoAvailability(entry);
    return {
      ...entry, goAvailability,
      shinyEligible: goAvailability.shiny === "released",
      ownOtNormal: goAvailability.release === "released",
      ownOtShiny: goAvailability.shiny === "released",
      sourceLabel: "Pokémon GO Wiki",
      sourceUrl: goAvailability.sourceUrl,
    };
  });
}

export function goAvailabilityLabel(entry: GoEntry) {
  const fact = entry.goAvailability ?? getGoAvailability(entry);
  if (fact.release === "unknown") return "go_unknown";
  if (fact.release !== "released") return "go_unreleased";
  return entry.variant === "shiny" && fact.shiny !== "released" ? fact.shiny === "unknown" ? "go_unknown" : "go_shiny_unreleased" : "go_released";
}

export function goMethodText(entry: GoEntry, t: (key: string) => string) {
  const fact = entry.goAvailability ?? getGoAvailability(entry);
  if (fact.release === "unreleased" || (entry.variant === "shiny" && fact.shiny === "unreleased")) return t("go_method_unreleased");
  if (fact.release !== "released" || !fact.methods.length) return t("go_method_unknown");
  return fact.methods.map(method => t(`go_method_${method}`)).join(" · ");
}
