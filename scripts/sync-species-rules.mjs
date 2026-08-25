import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SOURCE_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv";
const outputPath = resolve("public/data/species-rules.json");
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="))?.slice("--source=".length);

async function readSource() {
  if (sourceArgument) return readFile(resolve(sourceArgument), "utf8");
  const response = await fetch(SOURCE_URL, { headers: { "user-agent": "HomeChecklistSpeciesRules/1.0" } });
  if (!response.ok) throw new Error(`PokéAPI CSV returned ${response.status}`);
  return response.text();
}

const csv = await readSource();
const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
const headers = headerLine.split(",");
const column = (name) => {
  const index = headers.indexOf(name);
  if (index < 0) throw new Error(`Missing ${name} in PokéAPI species CSV`);
  return index;
};

const idColumn = column("id");
const generationColumn = column("generation_id");
const evolvesFromColumn = column("evolves_from_species_id");
const genderRateColumn = column("gender_rate");
const species = rows.map((row) => {
  const values = row.split(",");
  return {
    dex: Number(values[idColumn]),
    generation: Number(values[generationColumn]),
    evolvesFrom: values[evolvesFromColumn] ? Number(values[evolvesFromColumn]) : null,
    genderRate: Number(values[genderRateColumn]),
  };
}).filter((rule) => Number.isInteger(rule.dex) && rule.dex > 0 && rule.dex <= 1025);

const dataset = {
  meta: {
    source: "PokéAPI species CSV",
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    speciesCount: species.length,
  },
  species,
};

await writeFile(outputPath, `${JSON.stringify(dataset)}\n`, "utf8");
console.log(`Wrote ${species.length} species rules to ${outputPath}`);
