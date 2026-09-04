import type { HomeChallenge } from "./home-challenges";

export type ChallengeStatus = "complete" | "missing" | "review";
export type ChallengeSpecimen = {
  id: string; dex: number; name?: string; form?: string | null; variant?: string;
  mark?: string; collection?: string; game?: string; types?: string[];
  availability?: string; normalEligible?: boolean; shinyEligible?: boolean;
  nature?: string; ball?: string; ability?: string; ribbons?: string[];
  requirements?: {
    originGame?: string; originGeneration?: number; gender?: string;
    alpha?: boolean; nature?: string; ball?: string; ability?: string;
    encounterMark?: string; ribbons?: string[];
  };
};
type Check = true | false | undefined;
type Rule = {
  mode: "species" | "forms" | "specimens" | "abilities" | "review";
  targets: number[]; dexes?: number[]; forms?: string[];
  match?: (entry: ChallengeSpecimen) => Check;
  reason?: "activity" | "metadata"; flavor?: boolean;
};
export type ChallengeRequirement = { dex: number; form?: string; status: ChallengeStatus };
export type ChallengeProgress = {
  challenge: HomeChallenge; status: ChallengeStatus; count: number;
  levels: { target: number; status: ChallengeStatus }[];
  requirements: ChallengeRequirement[]; reason?: "activity" | "metadata";
};
export const canonicalChallengeForm = (form: string | null | undefined) => (form ?? "").toLowerCase()
  .replace(/^(normal|standard|original|natural|kantonian)$/, "")
  .replace(/autumn/g, "fall").replace(/['’]/g, "").replace(/[- ]+/g, " ").trim();
const sameForm = (left: string | null | undefined, right: string | null | undefined) =>
  canonicalChallengeForm(left) === canonicalChallengeForm(right);
const usable = (entry: ChallengeSpecimen) => !["hypothetical", "excluded"].includes(entry.availability ?? "");

/** Read only explicit progress, never the current profile, search, or inferred trait defaults. */
export function collectChallengeSpecimens(
  catalog: readonly ChallengeSpecimen[], owned: ReadonlySet<string>, livingDexOwned: ReadonlySet<number>,
  overrides: Record<string, { alpha?: boolean }> = {},
): ChallengeSpecimen[] {
  const byId = new Map(catalog.filter(usable).map((entry) => [entry.id, entry]));
  const result: ChallengeSpecimen[] = [];
  for (const planId of owned) {
    if (planId.startsWith("generic:")) continue;
    const match = planId.match(/^(.*):(normal|shiny)(?::gender:(male|female|any)|:original-generation:(\d+))?$/);
    if (!match) continue;
    const entry = byId.get(match[1]);
    if (!entry || (match[2] === "shiny" ? !entry.shinyEligible : entry.normalEligible === false)) continue;
    result.push({ ...entry, id: planId, variant: match[2], requirements: {
      ...entry.requirements, ...overrides[planId],
      ...(match[3] ? { gender: match[3] } : {}),
      ...(match[4] ? { originGeneration: Number(match[4]) } : {}),
    } });
  }
  // Generic and living-dex checks can mirror a specific specimen; do not count that twice.
  const genericIds = [...owned].filter((id) => id.startsWith("generic:")).sort((a, b) =>
    Number(a.endsWith(":any")) - Number(b.endsWith(":any")));
  for (const planId of genericIds) {
    const parts = planId.split(":");
    if (parts.length !== 5 || !["normal", "shiny"].includes(parts[1])) continue;
    const dex = Number(parts[2]);
    let form: string | null;
    try { form = parts[3] === "base" ? null : decodeURIComponent(parts[3]); } catch { continue; }
    const candidates = catalog.filter((entry) => usable(entry) && entry.dex === dex && sameForm(entry.form, form));
    if (!candidates.length) continue;
    if (result.some((entry) => entry.dex === dex && entry.variant === parts[1] && sameForm(entry.form, form) &&
      (parts[4] === "any" || entry.requirements?.gender === parts[4]))) continue;
    result.push({ id: planId, dex, form, name: candidates[0].name, variant: parts[1],
      types: candidates[0].types, requirements: { gender: parts[4], ...overrides[planId] } });
  }
  for (const dex of livingDexOwned) {
    if (result.some((entry) => entry.dex === dex && entry.variant === "normal")) continue;
    const candidates = catalog.filter((entry) => usable(entry) && entry.dex === dex);
    if (!candidates.length) continue;
    // Species-only progress does not prove a particular form or origin.
    const commonTypes = candidates[0].types?.filter((type) => candidates.every((entry) => entry.types?.includes(type)));
    result.push({ id: `living-dex:${dex}`, dex, name: candidates[0].name, variant: "normal", types: commonTypes });
  }
  return result;
}

const FORM_TARGETS: Record<number, string[]> = {
  201: [..."abcdefghijklmnopqrstuvwxyz", "!", "?"],
  479: ["", "Heat", "Wash", "Frost", "Fan", "Mow"],
  676: ["", "Heart", "Star", "Diamond", "Debutante", "Matron", "Dandy", "La Reine", "Kabuki", "Pharaoh"],
  666: ["Icy Snow", "Polar", "Tundra", "Continental", "Garden", "Elegant", "Meadow", "Modern", "Marine",
    "Archipelago", "High Plains", "Sandstorm", "River", "Monsoon", "Savanna", "Sun", "Ocean", "Jungle", "Fancy", "Poké Ball"],
  128: ["Paldean Combat Breed", "Paldean Blaze Breed", "Paldean Aqua Breed"],
  978: ["Curly", "Droopy", "Stretchy"],
  931: ["Green", "Blue", "Yellow", "White"],
  741: ["Baile Style", "Pom-Pom Style", "Pa'u Style", "Sensu Style"],
  774: ["Red Core", "Orange Core", "Yellow Core", "Green Core", "Blue Core", "Indigo Core", "Violet Core"],
  925: ["Family of 3", "Family of 4"],
  982: ["2 Segment", "3 Segment"],
  869: ["Vanilla Cream", "Ruby Cream", "Matcha Cream", "Mint Cream", "Lemon Cream", "Salted Cream",
    "Ruby Swirl", "Caramel Swirl", "Rainbow Swirl"],
  901: ["", "Bloodmoon"],
};
const all = (...checks: Check[]): Check => checks.includes(false) ? false : checks.includes(undefined) ? undefined : true;
const formCheck = (entry: ChallengeSpecimen, pattern: RegExp): Check =>
  entry.form === undefined ? undefined : pattern.test(entry.form ?? "");
const knownValue = (value?: string) => value && !/random|any|varies|\//i.test(value) ? value.toLowerCase().trim() : undefined;
const valueCheck = (actual: string | undefined, expected: string): Check =>
  knownValue(actual) === undefined ? undefined : knownValue(actual) === expected.toLowerCase();
const markCheck = (entry: ChallengeSpecimen, mark: string): Check =>
  entry.mark ? entry.mark === mark : entry.collection === "go" ? mark === "GO" : undefined;

type Origin = { title: RegExp; games: RegExp; mark: string; exactMark?: boolean; generation?: number };
const ORIGINS: Origin[] = [
  { title: /good ol' Kanto/, games: /^(red|blue|green|yellow|rby|rbg|rgb|rb)$/i, mark: "GB", generation: 1 },
  { title: /good ol' Johto/, games: /^(gold|silver|crystal|gsc|gs)$/i, mark: "GB", generation: 2 },
  { title: /Omega Ruby|Alpha Sapphire/, games: /^(omega ruby|alpha sapphire|oras)$/i, mark: "P" },
  { title: /FireRed|LeafGreen/, games: /^(firered|leafgreen|frlg)$/i, mark: "GBA" },
  { title: /Ruby|Sapphire|Emerald/, games: /^(ruby|sapphire|emerald|rse|rs)$/i, mark: "GBA" },
  { title: /HeartGold|SoulSilver/, games: /^(heartgold|soulsilver|hgss)$/i, mark: "Sin marca" },
  { title: /Brilliant Diamond|Shining Pearl/, games: /^(brilliant diamond|shining pearl|bdsp)$/i, mark: "BDSP", exactMark: true },
  { title: /Diamond|Pearl|Platinum/, games: /^(diamond|pearl|platinum|dpp|dppt|dp)$/i, mark: "Sin marca" },
  { title: /Black 2|White 2/, games: /^(black 2|white 2|b2w2|bw2)$/i, mark: "Sin marca" },
  { title: /Poké Transporter/, games: /^(black|white|bw|black 2|white 2|b2w2|bw2)$/i, mark: "Sin marca" },
  { title: /Black|White/, games: /^(black|white|bw)$/i, mark: "Sin marca" },
  { title: /Pokémon X|Pokémon Y/, games: /^(x|y|xy)$/i, mark: "P" },
  { title: /Ultra Sun|Ultra Moon/, games: /^(ultra sun|ultra moon|usum)$/i, mark: "USUM" },
  { title: /Pokémon Sun|Pokémon Moon/, games: /^(sun|moon|sm)$/i, mark: "USUM" },
  { title: /from Alola/, games: /^(sun|moon|sm|ultra sun|ultra moon|usum)$/i, mark: "USUM", exactMark: true },
  { title: /Let's Go/, games: /let.?s go|^lgpe$/i, mark: "LGPE", exactMark: true },
  { title: /Sword|Shield/, games: /^(sword|shield|swsh)$/i, mark: "SwSh", exactMark: true },
  { title: /Legends: Arceus/, games: /legends:? arceus|^pla$|^la$/i, mark: "LA", exactMark: true },
  { title: /Legends: Z-A/, games: /legends:? z-a|^lza$/i, mark: "LZA", exactMark: true },
  { title: /Pokémon GO/, games: /^go$/i, mark: "GO", exactMark: true },
];
function originCheck(entry: ChallengeSpecimen, origin: Origin): Check {
  const raw = entry.requirements?.originGame ?? entry.game;
  if (raw) {
    const games = raw.replace(/Pokémon:?\s*/g, "").split(/\s*(?:\/|,|\bor\b|\band\b)\s*/).filter(Boolean);
    const matches = games.map((game) => origin.games.test(game.trim()));
    if (matches.length && matches.every(Boolean)) return true;
    if (matches.some(Boolean)) return undefined;
    // Generic labels such as "Gen IV" are not evidence of a particular game.
    if (/^(gen(eration)?\s|various|unknown|home)/i.test(raw)) return undefined;
    return false;
  }
  if (origin.generation && entry.requirements?.originGeneration !== undefined) {
    return all(markCheck(entry, origin.mark), entry.requirements.originGeneration === origin.generation);
  }
  const mark = markCheck(entry, origin.mark);
  return mark === false ? false : origin.exactMark ? mark : undefined;
}

export function challengeRule(challenge: HomeChallenge): Rule {
  const title = challenge.title;
  const targets = challenge.tiers?.length ? challenge.tiers : [1];
  const review = (reason: "activity" | "metadata"): Rule => ({ mode: "review", targets, reason });
  if (challenge.category === "trade" || challenge.category === "other" || /^(Trade|Withdraw) /.test(title)) return review("activity");
  if (/Fill in |100 different species|Pulverizing|ultimate|sheen|effort levels|physical moves|special moves|status moves|Jumbo Mark/.test(title)) return review("metadata");
  const nature = title.match(/^Deposit (\d+) Pokémon with an? (.+) Nature/);
  if (nature) return { mode: "specimens", targets: [Number(nature[1])], match: (e) => valueCheck(e.requirements?.nature ?? e.nature, nature[2]) };
  const ball = title.match(/^Deposit Pokémon in an? (.+? Ball)( crafted in the Hisui region)?!/);
  if (ball) return { mode: "specimens", targets, match: (e) => all(
    valueCheck(e.requirements?.ball ?? e.ball, ball[1]),
    ball[2] ? markCheck(e, "LA") : e.mark === "LA" ? false : true,
  ) };
  if (/Mightiest Mark/.test(title)) return { mode: "specimens", targets, match: (e) =>
    valueCheck(e.requirements?.encounterMark, "Mightiest Mark") };
  if (/Twinkling Star Ribbon/.test(title)) return { mode: "specimens", targets, match: (e) => {
    const ribbons = e.requirements?.ribbons ?? e.ribbons;
    return ribbons ? ribbons.some((ribbon) => /twinkling star/i.test(ribbon)) : undefined;
  } };
  if (/^Register alpha Pokémon/.test(title)) return { mode: "specimens", targets, match: (e) => e.requirements?.alpha };
  if (/^Register Abilities/.test(title)) return { mode: "abilities", targets };
  if (title === "Deposit Pokémon!") return { mode: "specimens", targets };
  if (title === "Deposit Shiny Pokémon!") return { mode: "specimens", targets, match: (e) => e.variant === "shiny" };
  const type = title.match(/^Register (.+)-type Pokémon!/);
  if (type) return { mode: "species", targets, match: (e) =>
    e.types?.length ? e.types.some((value) => value.toLowerCase() === type[1].toLowerCase()) : undefined };
  const quantity = title.match(/^Deposit (\d+) /);
  if (quantity && challenge.dexes.length) return { mode: "specimens", targets: [Number(quantity[1])], dexes: challenge.dexes };
  const forms = title.match(/^Register (\d+) (?:forms|patterns|varieties|colors) of /);
  const isAlcremie = /Alcremie 's Forms/.test(title);
  const isUrsaluna = /Ursaluna and Bloodmoon/.test(title);
  if (forms || isAlcremie || isUrsaluna) {
    const formTargets = FORM_TARGETS[challenge.dexes[0]];
    return formTargets ? { mode: "forms", targets: forms ? [Number(forms[1])] : isUrsaluna ? [2] : targets,
      dexes: challenge.dexes, forms: formTargets, flavor: isAlcremie } : review("metadata");
  }
  if (!challenge.dexes.length) return review("metadata");
  const count = title.match(/^Register (\d+) /);
  const origin = ORIGINS.find((source) => source.title.test(title));
  const regional = title.match(/\b(Galarian|Hisuian|Paldean|Alolan)\b/);
  const season = title.match(/(Spring|Summer|Autumn|Winter) Form/);
  return {
    mode: "species", dexes: challenge.dexes, targets: [count ? Number(count[1]) : challenge.dexes.length],
    match: (entry) => all(
      /Shiny /.test(title) ? entry.variant === "shiny" : true,
      origin ? originCheck(entry, origin) : true,
      regional ? formCheck(entry, new RegExp(regional[1], "i")) : true,
      season ? formCheck(entry, new RegExp(season[1] === "Autumn" ? "fall|autumn" : season[1], "i")) : true,
      /Roaming Form/.test(title) ? formCheck(entry, /roaming/i) : true,
      /Eternal Flower/.test(title) ? formCheck(entry, /eternal/i) : true,
      /wearing a hat/.test(title) ? formCheck(entry, /cap|hat/i) : true,
    ),
  };
}

export function evaluateHomeChallenges(challenges: readonly HomeChallenge[], specimens: readonly ChallengeSpecimen[]): ChallengeProgress[] {
  return challenges.map((challenge) => {
    const rule = challengeRule(challenge);
    const entries = specimens.filter((entry) => !rule.dexes || rule.dexes.includes(entry.dex));
    const requirements: ChallengeRequirement[] = [];
    let count = 0;
    let unknown = 0;
    if (rule.mode === "review") {
      return { challenge, status: "review", count: 0, levels: rule.targets.map((target) => ({ target, status: "review" })),
        requirements: [], reason: rule.reason } as ChallengeProgress;
    }
    if (rule.mode === "forms") {
      for (const form of rule.forms ?? []) {
        const matches = entries.map((entry): Check => entry.form === undefined ? undefined :
          sameForm(rule.flavor ? entry.form?.split(",")[0] : entry.form, form));
        const status: ChallengeStatus = matches.includes(true) ? "complete" : matches.includes(undefined) ? "review" : "missing";
        if (status === "complete") count++;
        if (status === "review") unknown++;
        requirements.push({ dex: rule.dexes![0], form, status });
      }
    } else if (rule.mode === "species") {
      const dexes = rule.dexes ?? [...new Set(entries.map((entry) => entry.dex))];
      for (const dex of dexes) {
        const matches = entries.filter((entry) => entry.dex === dex).map((entry) => rule.match ? rule.match(entry) : true);
        const status: ChallengeStatus = matches.includes(true) ? "complete" : matches.includes(undefined) ? "review" : "missing";
        if (status === "complete") count++;
        if (status === "review") unknown++;
        if (rule.dexes) requirements.push({ dex, status });
      }
    } else if (rule.mode === "abilities") {
      count = new Set(entries.map((e) => knownValue(e.requirements?.ability ?? e.ability)).filter(Boolean)).size;
      unknown = entries.filter((e) => !knownValue(e.requirements?.ability ?? e.ability)).length;
    } else {
      const matches = entries.map((entry) => rule.match ? rule.match(entry) : true);
      count = matches.filter((value) => value === true).length;
      unknown = matches.filter((value) => value === undefined).length;
    }
    const levels = rule.targets.map((target) => ({
      target, status: (count >= target ? "complete" : count + unknown >= target ? "review" : "missing") as ChallengeStatus,
    }));
    const status = levels.every((level) => level.status === "complete") ? "complete" :
      levels.some((level) => level.status === "missing") ? "missing" : "review";
    return { challenge, status, count, levels, requirements, ...(unknown ? { reason: "metadata" as const } : {}) };
  });
}
export function summarizeHomeChallenges(progress: readonly ChallengeProgress[]) {
  const counts = { complete: 0, missing: 0, review: 0, total: 0 };
  for (const row of progress) for (const level of row.levels) { counts[level.status]++; counts.total++; }
  return counts;
}
