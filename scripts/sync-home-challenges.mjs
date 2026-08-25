import { readFile, writeFile } from "node:fs/promises";

const SOURCE_URL = "https://bulbapedia.bulbagarden.net/wiki/Challenge_(HOME)";
const OUTPUT_PATH = new URL("../public/data/home-challenges.json", import.meta.url);
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="))?.slice("--source=".length);

async function sourceHtml() {
  if (sourceArgument) return readFile(sourceArgument, "utf8");
  const response = await fetch(SOURCE_URL, { headers: { "user-agent": "Origin Marks HOME Checklist data sync (HOME Challenge species filter)" } });
  if (!response.ok) throw new Error(`Bulbapedia returned ${response.status} ${response.statusText}`);
  return response.text();
}

const html = await sourceHtml();
const dexes = [...new Set([...html.matchAll(/HOME(\d{4})[^/"']*\.png/gi)].map((match) => Number(match[1])))]
  .filter((dex) => dex >= 1 && dex <= 1025)
  .sort((left, right) => left - right);

if (!dexes.length) throw new Error("No Pokémon requirement artwork was found on the HOME Challenges page.");

const output = {
  meta: {
    source: "Bulbapedia · Challenge (HOME)",
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString().slice(0, 10),
    speciesCount: dexes.length,
    caveat: "Derived view filter only. It does not add duplicate slots or model non-species rewards and requirements.",
  },
  dexes,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Wrote ${dexes.length} HOME Challenge species to ${OUTPUT_PATH.pathname}`);
