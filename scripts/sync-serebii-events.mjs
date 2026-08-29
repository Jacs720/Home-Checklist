import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT_URL = "https://www.serebii.net/events/";
const OUTPUT_PATH = new URL("../public/data/special-collections.json", import.meta.url);
const BASE_PATH = new URL("../public/data/pokemon-lite.json", import.meta.url);
const CACHE_DIR = join(tmpdir(), "home-checklist-serebii-events");
const concurrency = Math.max(1, Math.min(12, Number(process.argv.find((arg) => arg.startsWith("--concurrency="))?.split("=")[1] ?? 8)));

const namedEntities = {
  amp: "&", apos: "'", quot: "\"", nbsp: " ", eacute: "é", Eacute: "É", egrave: "è", agrave: "à",
  aacute: "á", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uml: "¨", ndash: "–", mdash: "—",
};

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (entity, name) => namedEntities[name] ?? entity);
}

function cleanHtml(value = "") {
  return decodeHtml(value)
    .replace(/<br\s*\/?\s*>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:/])/g, "$1")
    .trim();
}

function field(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cleanHtml(block.match(new RegExp(`<td class="detailhead">${escaped}:?<\\/td>\\s*<td>([\\s\\S]*?)<\\/td>`, "i"))?.[1]);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function humanizeBall(filename) {
  const known = {
    cherishball: "Cherish Ball", pokeball: "Poké Ball", greatball: "Great Ball", ultraball: "Ultra Ball", masterball: "Master Ball",
    safariball: "Safari Ball", sportball: "Sport Ball", parkball: "Park Ball", dreamball: "Dream Ball", beastball: "Beast Ball",
    premierball: "Premier Ball", luxuryball: "Luxury Ball", healball: "Heal Ball", quickball: "Quick Ball", duskball: "Dusk Ball",
    diveball: "Dive Ball", netball: "Net Ball", nestball: "Nest Ball", repeatball: "Repeat Ball", timerball: "Timer Ball",
    friendball: "Friend Ball", loveball: "Love Ball", moonball: "Moon Ball", levelball: "Level Ball", lureball: "Lure Ball",
    heavyball: "Heavy Ball", fastball: "Fast Ball", strangeball: "Strange Ball",
  };
  return known[filename.toLowerCase()] ?? filename.replace(/ball$/i, " Ball").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function markForGames(games) {
  if (/Legends[^,]*(?:Z-A|Z.?A)|Lumiose/i.test(games)) return "LZA";
  if (/Scarlet|Violet/i.test(games)) return "SV";
  if (/Legends[^,]*Arceus/i.test(games)) return "LA";
  if (/Brilliant Diamond|Shining Pearl/i.test(games)) return "BDSP";
  if (/Sword|Shield/i.test(games)) return "SwSh";
  if (/Let's Go/i.test(games)) return "LGPE";
  if (/Ultra Sun|Ultra Moon|\bSun\b|\bMoon\b/i.test(games)) return "USUM";
  if (/Omega\s*Ruby|Alpha\s*Sapphire|\bX\b|\bY\b/i.test(games)) return "P";
  if (/Virtual Console/i.test(games)) return "GB";
  if (/\bHOME\b/i.test(games)) return undefined;
  return "Sin marca";
}

const EVENT_ICON_MARKS = {
  za: "LZA",
  paldea: "SV",
  sv: "SV",
  hisui: "LA",
  legends: "LA",
  bdsp: "BDSP",
  galar: "SwSh",
  letsgo: "LGPE",
  gba: "GBA",
  gb: "GB",
};

function marksFromEventBlock(block) {
  const iconMarks = [...block.matchAll(/\/events\/([^"/]+)\.png/gi)]
    .map((match) => EVENT_ICON_MARKS[match[1].toLowerCase()]);
  if (/&#11039;/.test(block)) iconMarks.push("P");
  if (/&#10010;/.test(block)) iconMarks.push("USUM");
  return unique(iconMarks);
}

function gamesForMark(games, mark) {
  const patterns = {
    LZA: /Legends:\s*Z-A/i,
    SV: /Scarlet|Violet/i,
    LA: /Legends:\s*Arceus/i,
    BDSP: /Brilliant Diamond|Shining Pearl/i,
    SwSh: /Sword|Shield/i,
    LGPE: /Let's Go/i,
    USUM: /Ultra Sun|Ultra Moon|\bSun\b|\bMoon\b/i,
    P: /Omega\s*Ruby|Alpha\s*Sapphire|^X$|^Y$/i,
    GB: /Virtual Console/i,
    GBA: /FireRed|LeafGreen/i,
  };
  const pattern = patterns[mark];
  if (!pattern || /\bHOME\b/i.test(games)) return games;
  const matchingGames = games.split(",").map((game) => game.trim()).filter((game) => pattern.test(game));
  return matchingGames.length ? matchingGames.join(", ") : games;
}

function homeGiftOrigin(description, games) {
  if (!/\bHOME\b/i.test(games)) return null;
  const completionGifts = [
    [/FireRed\s*&\s*LeafGreen Pok[eé]Dex Completion Gift/i, { mark: "GBA", game: "FireRed, LeafGreen" }],
    [/Legends:\s*Z-A Pok[eé]Dex Completion Gift/i, { mark: "LZA", game: "Legends: Z-A" }],
    [/Complete Pok[eé]Dex for Brilliant Diamond\s*&\s*Shining Pearl/i, { mark: "BDSP", game: "Brilliant Diamond, Shining Pearl" }],
    [/Complete Pok[eé]Dex for Legends:\s*Arceus/i, { mark: "LA", game: "Legends: Arceus" }],
    [/Complete Pok[eé]Dex for Sword\s*&\s*Shield/i, { mark: "SwSh", game: "Sword, Shield" }],
    [/Complete Pok[eé]Dex for Let's Go, Pikachu\s*&\s*Eevee/i, { mark: "LGPE", game: "Let's Go, Pikachu!, Let's Go, Eevee!" }],
    [/Complete all three Pok[eé]Dexes in Scarlet\s*&\s*Violet/i, { mark: "SV", game: "Scarlet, Violet" }],
    [/Legends:\s*Z-A Deposit Gift/i, { mark: "LZA", game: "Legends: Z-A" }],
    [/Deposit from Brilliant Diamond\s*&\s*Shining Pearl/i, { mark: "BDSP", game: "Brilliant Diamond, Shining Pearl" }],
    [/Deposit from Legends:\s*Arceus/i, { mark: "LA", game: "Legends: Arceus" }],
    [/Deposit from Scarlet\s*&\s*Violet/i, { mark: "SV", game: "Scarlet, Violet" }],
  ];
  return completionGifts.find(([pattern]) => pattern.test(description))?.[1] ?? null;
}

function isUntransferableClassicEvent(games) {
  const hasClassic = /\b(?:Red|Green|Blue|Yellow|Gold|Silver|Crystal)\b/i.test(games);
  const hasLaterGame = /Ruby|Sapphire|Emerald|FireRed|LeafGreen|Diamond|Pearl|Platinum|HeartGold|SoulSilver|Black|White|X|Y|Sun|Moon|Let's Go|Sword|Shield|Arceus|Brilliant|Shining|Scarlet|Violet|Z-A/i.test(games);
  return hasClassic && !hasLaterGame && !/Virtual Console/i.test(games);
}

async function fetchText(url, cacheName) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = join(CACHE_DIR, cacheName);
  try {
    return await readFile(cachePath, "utf8");
  } catch {
    // Cache misses fall through to the network fetch below.
  }

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "Origin Marks HOME Checklist data sync (structured event facts)" } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const html = new TextDecoder("windows-1252").decode(await response.arrayBuffer());
      await writeFile(cachePath, html, "utf8");
      return html;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

function parseEventPage(html, dex, template, sourceUrl) {
  const events = [];
  const identityOccurrences = new Map();
  const pattern = /<table class="eventpoke">([\s\S]*?)<\/table><br\s*\/>/gi;
  for (const match of html.matchAll(pattern)) {
    const block = match[1];
    const before = html.slice(0, match.index);
    const yearMatches = [...before.matchAll(/<a name="(\d{4})"><\/a>/gi)];
    const year = Number(yearMatches.at(-1)?.[1] ?? 0) || undefined;
    const locationMatches = [...before.slice(Math.max(0, before.length - 800)).matchAll(/<font size="2"><b><u>([\s\S]*?)<\/u><\/b><\/font>/gi)];
    const locationHeading = cleanHtml(locationMatches.at(-1)?.[1]);
    const labelCell = block.match(/<td class="label"><img[^>]+\/itemdex\/sprites\/([^"/]+)\.png[^>]*\/>\s*([\s\S]*?)<\/td>/i);
    const ball = humanizeBall(labelCell?.[1] ?? "pokeball");
    const labelHtml = labelCell?.[2] ?? "";
    const label = cleanHtml(labelHtml).replace(/\s*[♂♀](?:\s*\/\s*[♂♀])?\s*$/u, "").trim();
    const hasMale = /&#9794;|♂/u.test(labelHtml);
    const hasFemale = /&#9792;|♀/u.test(labelHtml);
    const gender = hasMale && !hasFemale ? "male" : hasFemale && !hasMale ? "female" : undefined;
    const levelText = block.match(/Level\s+([^<]+)/i)?.[1]?.trim() ?? "";
    const level = Number(levelText.match(/\d+/)?.[0] ?? 0) || undefined;
    const trainerName = field(block, "OT") || undefined;
    const trainerId = field(block, "ID") || undefined;
    const ability = field(block, "Ability") || undefined;
    const teraType = cleanHtml(block.match(/>Tera Type<\/td>\s*<\/tr>\s*<tr>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1]) || undefined;
    const heldItem = cleanHtml(block.match(/>Hold Item:<\/td>\s*<\/tr>\s*<tr>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1]).replace(/^·\s*/, "") || undefined;
    const pokemonSprite = block.match(/class="pkmn"[\s\S]*?<img src="([^"]+)"/i)?.[1] ?? "";
    const natureText = cleanHtml(block.match(/<td class="column">([\s\S]*?)<\/td>\s*<td class="column"><table/i)?.[1]);
    const nature = natureText.match(/(?:^|·\s*)([A-Za-z -]+) Nature\b/i)?.[1]?.trim();
    const moves = unique([...block.matchAll(/<a href="\/attackdex[^"/]*\/[^"/]+\.shtml">([\s\S]*?)<\/a>/gi)].map((move) => cleanHtml(move[1])));
    const ribbons = unique([...block.matchAll(/title="([^"]*Ribbon)"/gi)].map((ribbon) => cleanHtml(ribbon[1])));
    const descriptionRow = block.match(/>Description<\/td>[\s\S]*?>Type<\/td>[\s\S]*?>Location<\/td>[\s\S]*?<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>/i);
    const description = cleanHtml(descriptionRow?.[1]) || `${template.name} event distribution`;
    const eventType = cleanHtml(descriptionRow?.[2]) || undefined;
    const eventLocation = cleanHtml(descriptionRow?.[3]) || locationHeading || undefined;
    const dates = block.match(/>Start Date<\/td>[\s\S]*?>End Date<\/td>[\s\S]*?<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>/i);
    const startDate = cleanHtml(dates?.[1]) || undefined;
    const endDate = cleanHtml(dates?.[2]) || undefined;
    const games = cleanHtml(block.match(/>Games Available<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1]) || undefined;
    const shiny = /\/Shiny\/|&#9733;|★/i.test(block);
    const homeOrigin = homeGiftOrigin(description, games ?? "");
    const inferredMark = homeOrigin?.mark ?? markForGames(games ?? "");
    const explicitMarks = marksFromEventBlock(block);
    const originMarks = explicitMarks.length
      ? [...explicitMarks].sort((left, right) => Number(right === inferredMark) - Number(left === inferredMark))
      : [inferredMark];
    const originGame = homeOrigin?.game ?? games;
    const ownOt = /^Yours$/i.test(trainerName ?? "");
    const requirements = {
      ...(gender ? { gender } : {}),
      ...(originGame ? { originGame } : {}),
      ball,
      ...(nature && !/^Any$/i.test(nature) ? { nature } : {}),
      ...(ability ? { ability } : {}),
      ...(teraType ? { teraType } : {}),
      ...(heldItem && !/^No Item$/i.test(heldItem) ? { heldItem } : {}),
      ...(moves.length ? { moves } : {}),
      ...(ribbons.length ? { ribbons } : {}),
    };
    const identity = [dex, year, description, eventType, eventLocation, locationHeading, startDate, endDate, games, trainerName, trainerId, label, shiny, gender, level, ball, nature, ability, teraType, heldItem, pokemonSprite, moves.join("/"), ribbons.join("/")].join("|");
    const hash = createHash("sha1").update(identity).digest("hex").slice(0, 14);
    const occurrence = (identityOccurrences.get(hash) ?? 0) + 1;
    identityOccurrences.set(hash, occurrence);

    const baseId = `event-dex:${String(dex).padStart(4, "0")}:${hash}${occurrence > 1 ? `:${occurrence}` : ""}`;
    originMarks.forEach((mark, markIndex) => {
      const markGame = originMarks.length > 1 ? gamesForMark(originGame ?? "", mark) : originGame;
      const markRequirements = {
        ...requirements,
        ...(markGame ? { originGame: markGame } : {}),
      };
      events.push({
        id: markIndex === 0 ? baseId : `${baseId}:${mark.toLowerCase()}`,
        collection: "event-dex",
        name: template.name,
        dex,
        form: null,
        types: template.types,
        keyword: `event-${String(dex).padStart(4, "0")}-${hash}`,
        note: [description, year, trainerName ? `OT ${trainerName}` : null, trainerId ? `ID ${trainerId}` : null].filter(Boolean).join(" · "),
        artId: template.artId ?? dex,
        shinyEligible: shiny,
        shinyReview: "verified-correction",
        availability: isUntransferableClassicEvent(games ?? "") ? "historical" : "standard",
        normalEligible: !shiny,
        ownOtNormal: !shiny && ownOt,
        ownOtShiny: shiny && ownOt,
        dataStatus: "source-backed",
        sourceLabel: "Serebii · Event Database",
        sourceUrl,
        displayDetail: label && label !== template.name ? `${description} · ${label}` : description,
        trainerName,
        trainerId,
        acquisitionCategory: "event",
        game: markGame,
        gender,
        requirements: markRequirements,
        level,
        ball,
        nature: nature && !/^Any$/i.test(nature) ? nature : undefined,
        ability,
        moves: moves.length ? moves : undefined,
        ribbons: ribbons.length ? ribbons : undefined,
        eventYear: year,
        eventLocation,
        eventType,
        startDate,
        endDate,
        ...(mark ? { mark } : {}),
      });
    });
  }
  return events;
}

async function parallelMap(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
      if ((index + 1) % 50 === 0 || index + 1 === items.length) console.log(`Processed ${index + 1}/${items.length} species pages`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const [baseDataset, specialDataset, indexHtml] = await Promise.all([
  readFile(BASE_PATH, "utf8").then(JSON.parse),
  readFile(OUTPUT_PATH, "utf8").then(JSON.parse),
  fetchText(ROOT_URL, "index.html"),
]);

const templates = new Map();
for (const entry of baseDataset.entries) {
  if (!templates.has(entry.dex) || (templates.get(entry.dex).form && !entry.form)) templates.set(entry.dex, entry);
}
for (const entry of specialDataset.entries) {
  if (!templates.has(entry.dex) || (templates.get(entry.dex).form && !entry.form)) templates.set(entry.dex, entry);
}

const dexes = unique([...indexHtml.matchAll(/\/events\/dex\/(\d{3,4})\.shtml/gi)].map((match) => Number(match[1])))
  .filter((dex) => dex >= 1 && dex <= 1025 && templates.has(dex))
  .sort((left, right) => left - right);

if (!dexes.length) throw new Error("Serebii event index did not expose any species pages.");

const pages = await parallelMap(dexes, concurrency, async (dex) => {
  const sourceUrl = `${ROOT_URL}dex/${String(dex).padStart(3, "0")}.shtml`;
  const html = await fetchText(sourceUrl, `${String(dex).padStart(4, "0")}.html`);
  return parseEventPage(html, dex, templates.get(dex), sourceUrl);
});

const eventEntries = pages.flat().sort((left, right) => left.dex - right.dex || (right.eventYear ?? 0) - (left.eventYear ?? 0) || left.id.localeCompare(right.id));
const cherishEventsByDex = new Map();
for (const entry of eventEntries) {
  if (entry.ball !== "Cherish Ball" || entry.availability === "historical") continue;
  const events = cherishEventsByDex.get(entry.dex) ?? [];
  events.push(entry);
  cherishEventsByDex.set(entry.dex, events);
}
const cherishEntries = [...cherishEventsByDex.entries()].map(([dex, events]) => {
  const template = templates.get(dex);
  const shinyEligible = events.some((entry) => entry.shinyEligible);
  return {
    id: `cherish:${String(dex).padStart(4, "0")}`,
    collection: "cherish",
    name: template.name,
    dex,
    form: null,
    types: template.types,
    keyword: template.keyword ?? template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    note: `Cherish Ball · verificado en Event Dex · ${shinyEligible ? "shiny señalado" : "sin shiny señalado"}`,
    artId: template.artId ?? dex,
    shinyEligible,
    shinyReview: "verified-correction",
    availability: "standard",
    ownOtNormal: false,
    ownOtShiny: false,
    dataStatus: "source-backed",
    sourceLabel: "Serebii · Event Database",
    sourceUrl: `${ROOT_URL}dex/${String(dex).padStart(3, "0")}.shtml`,
  };
}).sort((left, right) => left.dex - right.dex);
const existingEntries = specialDataset.entries.filter((entry) => entry.collection !== "event-dex" && entry.collection !== "cherish");
const entries = [...existingEntries, ...cherishEntries, ...eventEntries];
const counts = Object.fromEntries(unique(entries.map((entry) => entry.collection)).map((collection) => [collection, entries.filter((entry) => entry.collection === collection).length]));
const output = {
  ...specialDataset,
  meta: {
    ...specialDataset.meta,
    generatedAt: new Date().toISOString().slice(0, 10),
    entryCount: entries.length,
    counts,
    caveat: "Cherish Ball y Event Dex se sincronizan por distribución desde Serebii.",
  },
  entries,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Wrote ${eventEntries.length} event distributions and ${cherishEntries.length} verified Cherish Ball species across ${dexes.length} species pages to ${OUTPUT_PATH.pathname}`);
