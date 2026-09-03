import type { PokemonEntry } from "./app-types";

export const TITAN_SOURCE_URL = "https://bulbapedia.bulbagarden.net/wiki/Titan_Pok%C3%A9mon";

// Only the catchable former Titans carry the Titan Mark. Dondozo and the
// Titanic Loyal Three do not. Tatsugiri is specifically the Curly Form.
const TITAN_SPECIMENS: { dex: number; form?: string; game?: string; gender?: "male" | "female"; level: number; nature: string }[] = [
  { dex: 950, gender: "female", level: 16, nature: "Gentle" },
  { dex: 962, gender: "female", level: 20, nature: "Jolly" },
  { dex: 968, gender: "male", level: 29, nature: "Quirky" },
  { dex: 978, form: "Curly", gender: "male", level: 57, nature: "Quiet" },
  { dex: 984, game: "Scarlet", level: 45, nature: "Naughty" },
  { dex: 990, game: "Violet", level: 45, nature: "Naughty" },
];

export function buildTitanEntries(catalog: PokemonEntry[]): PokemonEntry[] {
  return TITAN_SPECIMENS.map((specimen) => {
    const template = catalog.find((entry) => entry.mark === "SV"
      && entry.dex === specimen.dex && (entry.form ?? "") === (specimen.form ?? "")
      && !entry.collection && entry.ownOtNormal && entry.normalEligible !== false
      && entry.availability !== "excluded");
    if (!template) throw new Error(`Missing Scarlet/Violet catalog entry for Titan ${specimen.dex}`);
    const game = specimen.game ?? "Scarlet, Violet";
    return {
      ...template,
      id: `titan:${specimen.dex}:${specimen.form ?? "base"}`,
      sourceNumber: undefined,
      collection: "titan",
      mark: "SV",
      note: "",
      sourceLabel: "Bulbapedia",
      sourceUrl: TITAN_SOURCE_URL,
      dataStatus: "source-backed",
      displayDetail: undefined,
      acquisitionCategory: "own",
      game,
      gender: specimen.gender,
      genderDifferenceTier: undefined,
      genderVariant: undefined,
      level: specimen.level,
      nature: specimen.nature,
      requirements: { encounterMark: "Titan Mark", originGame: game, gender: specimen.gender },
      availability: "standard",
      normalEligible: true,
      ownOtNormal: true,
      shinyEligible: false,
      ownOtShiny: false,
      shinyReview: "verified-correction",
    };
  });
}
