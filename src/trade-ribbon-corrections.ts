import type { PokemonEntry } from "./app-types";

type TradeEntry = Pick<PokemonEntry, "dex" | "form" | "shinyEligible" | "ownOtNormal" | "ownOtShiny"> & Partial<Pick<PokemonEntry,
  "collection" | "game" | "mark" | "normalEligible" | "trainerName" | "trainerId" | "partnerRibbon" | "ribbons" | "requirements" | "artId" | "types" | "sourceLabel" | "sourceUrl"
>> & { shinyReview?: string };

export const PARTNER_RIBBON = "Partner Ribbon";
// Older versions offered Cyrano's guaranteed-shiny specimen as a normal slot.
// Preserve its saved completion, favorites and custom-box references.
export function correctLegacyTradePlanId(planId: string): string {
  return planId === "trades:0191:0522:normal" ? "trades:0191:0522:shiny" : planId;
}

export function correctLegacyTradePlanIds(planIds: unknown[]): string[] {
  return [...new Set(planIds.filter((id): id is string => typeof id === "string").map(correctLegacyTradePlanId))];
}

const LETS_GO = "Pokémon: Let's Go, Pikachu! and Let's Go, Eevee!";
const SCARLET_VIOLET = "Pokémon Scarlet and Violet";
const ALOLAN_TRADES: Record<number, { artId: number; types: string[] }> = {
  19: { artId: 10091, types: ["Dark", "Normal"] },
  26: { artId: 10100, types: ["Electric", "Psychic"] },
  27: { artId: 10101, types: ["Ice", "Steel"] },
  37: { artId: 10103, types: ["Ice"] },
  50: { artId: 10105, types: ["Ground", "Steel"] },
  52: { artId: 10107, types: ["Dark"] },
  74: { artId: 10109, types: ["Rock", "Electric"] },
  88: { artId: 10112, types: ["Poison", "Dark"] },
  103: { artId: 10114, types: ["Grass", "Dragon"] },
  105: { artId: 10115, types: ["Fire", "Ghost"] },
};

// Source-backed exceptions, kept outside generated JSON so resyncs preserve them.
// See docs/trade-ribbon-validation.md for the event-card evidence and boundaries.
export function correctTradeAndRibbons<T extends TradeEntry>(source: T): T {
  let entry = source;
  if (entry.collection === "trades") {
    const letsGo = entry.game === LETS_GO;
    const regina = entry.game === "Pokémon Sword and Shield" && entry.trainerName === "Regina";
    const xd = entry.game === "Pokémon XD: Gale of Darkness";
    const cyrano = entry.game === SCARLET_VIOLET && entry.dex === 522 && entry.trainerName === "Cyrano";
    if (letsGo || regina || xd || cyrano) {
      entry = { ...entry, shinyEligible: true, normalEligible: !cyrano, ownOtNormal: false, ownOtShiny: false, shinyReview: "verified-correction" };
    }
    if (letsGo && ALOLAN_TRADES[entry.dex]) {
      entry = { ...entry, mark: "LGPE", form: "Alolan", ...ALOLAN_TRADES[entry.dex] };
    }
    if (regina) {
      entry = { ...entry, mark: "SwSh" };
      if (entry.dex === 103 || entry.dex === 105) {
        entry = { ...entry, form: "Alolan", ...ALOLAN_TRADES[entry.dex] };
      }
    }
    if (cyrano) entry = { ...entry, mark: "SV", partnerRibbon: true, trainerId: "390518" };
    if (entry.game === SCARLET_VIOLET && entry.partnerRibbon) {
      entry = { ...entry, mark: "SV", sourceLabel: "Serebii · League Club trades", sourceUrl: "https://www.serebii.net/scarletviolet/leagueclubtrades.shtml" };
    }
  }

  // Match the distribution, not the species: other Flutter Mane gifts lack this ribbon.
  if (entry.collection === "event-dex" && entry.mark === "SV" && entry.dex === 987 && entry.trainerName === "ヒュウマ" && entry.trainerId === "250621") {
    entry = { ...entry, partnerRibbon: true };
  }
  // WC 1534 has only Classic (26), not Partner (110); don't infer it from the OT.
  const yoasobi = entry.collection === "event-dex" && entry.mark === "SV" && entry.dex === 923 && entry.trainerId === "231118";
  const ribbons = [...new Set([...(entry.ribbons ?? []), ...(entry.requirements?.ribbons ?? [])])]
    .filter((ribbon) => !yoasobi || ribbon !== PARTNER_RIBBON);
  if (entry.partnerRibbon && !yoasobi && !ribbons.includes(PARTNER_RIBBON)) ribbons.push(PARTNER_RIBBON);
  if (ribbons.length || entry.partnerRibbon) {
    entry = { ...entry, partnerRibbon: ribbons.includes(PARTNER_RIBBON), ribbons, requirements: { ...entry.requirements, ribbons } };
  }
  return entry;
}
