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
const body = html.slice(html.indexOf('id="List_of_Challenges"'), html.indexOf('id="Trivia"'));
const previous = JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
const previousIds = new Map((previous.challenges ?? []).map((challenge) => [challenge.title, challenge.id]));
const challenges = [];
for (const [tableIndex, table] of [...body.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)].entries()) {
  for (const row of table[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cell[1]);
    if (cells.length < 4) continue;
    const title = cleanHtml(cells[0]);
    if (!title) continue;
    const dexes = [...new Set([...cells[1].matchAll(/HOME(\d{4})[^/"']*\.png/gi)].map((match) => Number(match[1])))].filter((dex) => dex >= 1 && dex <= 1025).sort((a, b) => a - b);
    const tiers = cells.slice(-3).map((cell) => cleanHtml(cell).replace(/,/g, "")).filter((value) => /^\d+$/.test(value)).map(Number);
    challenges.push({
      id: previousIds.get(title) ?? challengeId(title, challenges.length),
      title, dexes,
      category: tableIndex === 0 ? "pokemon" : tableIndex === 1 ? "trade" : "other",
      tiers,
      requirementText: cleanHtml(cells[1]),
    });
  }
}
if (challenges.length < 200) throw new Error("The full HOME Challenge catalog could not be parsed.");
const dexes = [...new Set(challenges.flatMap((challenge) => challenge.dexes))].sort((a, b) => a - b);
const output = {
  meta: {
    source: "Bulbapedia · Challenge (HOME)",
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString().slice(0, 10),
    speciesCount: dexes.length,
    challengeCount: challenges.length,
    tierCount: challenges.reduce((sum, challenge) => sum + Math.max(1, challenge.tiers.length), 0),
    caveat: "Local collection evidence only; HOME activity and unrecorded specimen details require verification. Tiers are counted individually.",
  },
  dexes, challenges,
};
await writeFile(OUTPUT_PATH, JSON.stringify(output) + "\n", "utf8");
console.log("Wrote " + challenges.length + " HOME Challenge rows (" + output.meta.tierCount + " levels).");
