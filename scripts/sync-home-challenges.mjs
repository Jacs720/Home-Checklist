import { readFile, writeFile } from "node:fs/promises";

const SOURCE_URL = "https://bulbapedia.bulbagarden.net/wiki/Challenge_(HOME)";
const OUTPUT_PATH = new URL("../public/data/home-challenges.json", import.meta.url);
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="))?.slice("--source=".length);

const namedEntities = {
  amp: "&", apos: "'", quot: "\"", nbsp: " ", eacute: "é", Eacute: "É", egrave: "è", agrave: "à",
  aacute: "á", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", ndash: "–", mdash: "—",
};

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (entity, name) => namedEntities[name] ?? entity);
}

function cleanHtml(value = "") {
  return decodeHtml(value)
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function challengeId(title, index) {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${String(index + 1).padStart(3, "0")}-${slug}`;
}

async function sourceHtml() {
  if (sourceArgument) return readFile(sourceArgument, "utf8");
  const response = await fetch(SOURCE_URL, { headers: { "user-agent": "Origin Marks HOME Checklist data sync (HOME Challenge species filter)" } });
  if (!response.ok) throw new Error(`Bulbapedia returned ${response.status} ${response.statusText}`);
  return response.text();
}

const html = await sourceHtml();
const challenges = [];
for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
  const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cell[1]);
  if (cells.length < 2) continue;
  const title = cleanHtml(cells[0]);
  const rowDexes = [...new Set([...cells[1].matchAll(/HOME(\d{4})[^/"']*\.png/gi)].map((match) => Number(match[1])))]
    .filter((dex) => dex >= 1 && dex <= 1025)
    .sort((left, right) => left - right);
  if (!title || !rowDexes.length) continue;
  challenges.push({ id: challengeId(title, challenges.length), title, dexes: rowDexes });
}

const dexes = [...new Set(challenges.flatMap((challenge) => challenge.dexes))]
  .filter((dex) => dex >= 1 && dex <= 1025)
  .sort((left, right) => left - right);

if (!challenges.length || !dexes.length) throw new Error("No Pokémon-specific HOME Challenges were found on the source page.");

const output = {
  meta: {
    source: "Bulbapedia · Challenge (HOME)",
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString().slice(0, 10),
    speciesCount: dexes.length,
    challengeCount: challenges.length,
    caveat: "Pokémon-specific challenge lookup. It does not model generic nature, type, Ball, trade, or activity requirements.",
  },
  dexes,
  challenges,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Wrote ${challenges.length} Pokémon-specific HOME Challenges covering ${dexes.length} species to ${OUTPUT_PATH.pathname}`);
