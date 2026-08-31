import type { PokemonEntry } from "./app-types";

export type MightiestRaidSpec = { dex: number; form?: string; award?: "mewtwo-battle" };

export type MightiestRaidsDataset = {
  meta: {
    source: string;
    sourceUrl: string;
    generatedAt: string;
    specimenCount: number;
    caveat: string;
  };
  specimens: MightiestRaidSpec[];
};

const specimenKey = (dex: number, form?: string | null) => `${dex}:${form ?? ""}`;

export function buildMightiestRaidEntries(dataset: MightiestRaidsDataset, catalog: PokemonEntry[]) {
  const entries = new Map<string, PokemonEntry>();

  for (const specimen of dataset.specimens) {
    const awardedAfterMewtwoBattle = specimen.award === "mewtwo-battle";
    const matchingForm = (entry: PokemonEntry) => entry.dex === specimen.dex && (entry.form ?? "") === (specimen.form ?? "");
    const template = catalog.find((entry) => (
      matchingForm(entry)
      && entry.mark === "SV"
      && entry.ownOtNormal
      && entry.normalEligible !== false
      && entry.availability !== "excluded"
    )) ?? catalog.find((entry) => matchingForm(entry) && entry.normalEligible !== false && entry.availability !== "excluded");
    if (!template) throw new Error(`Missing Scarlet/Violet catalog entry for Mightiest raid ${specimenKey(specimen.dex, specimen.form)}`);

    const key = specimenKey(specimen.dex, specimen.form);
    entries.set(key, {
      ...template,
      id: `mighty:${specimen.dex}:${specimen.form ?? "base"}`,
      sourceNumber: undefined,
      mark: "SV",
      collection: "mighty",
      note: "",
      sourceLabel: dataset.meta.source,
      sourceUrl: awardedAfterMewtwoBattle ? "https://www.serebii.net/scarletviolet/teraraidbattles/event-mightymewtwoshowdown.shtml" : dataset.meta.sourceUrl,
      displayDetail: undefined,
      acquisitionCategory: "own",
      requirements: {
        ...(awardedAfterMewtwoBattle ? {} : { originGame: "Scarlet, Violet" }),
        encounterMark: "Mightiest Mark",
      },
      gender: undefined,
      genderDifferenceTier: undefined,
      genderVariant: undefined,
      shinyEligible: awardedAfterMewtwoBattle,
      shinyReview: "verified-correction",
      availability: "historical",
      normalEligible: true,
      ownOtNormal: true,
      ownOtShiny: awardedAfterMewtwoBattle,
    });
  }

  return [...entries.values()].sort((left, right) => left.dex - right.dex || (left.form ?? "").localeCompare(right.form ?? ""));
}
