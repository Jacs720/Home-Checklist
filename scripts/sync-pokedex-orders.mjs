import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve, join } from "node:path";

const sourceRoot = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/";
const cacheIndex = process.argv.indexOf("--source-dir");
const directory = resolve(cacheIndex >= 0 ? process.argv[cacheIndex + 1] : "artifacts/pokedex-sources");
await mkdir(directory, { recursive: true });
function csv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted;
    } else if (!quoted && (char === "," || char === "\n")) {
      row.push(field.replace(/\r$/, "")); field = "";
      if (char === "\n") { rows.push(row); row = []; }
    } else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const header = rows.shift();
  return rows.filter(row => row.length > 1).map(row => Object.fromEntries(header.map((key, i) => [key, row[i]])));
}
async function load(name) {
  const path = join(directory, `${name}.csv`);
  if (cacheIndex < 0) {
    const response = await fetch(`${sourceRoot}${name}.csv`);
    if (!response.ok) throw new Error(`Cannot download ${name}: ${response.status}`);
    await writeFile(path, await response.text());
  }
  return csv(await readFile(path, "utf8"));
}
const [definitions, numbers, prose] = await Promise.all([load("pokedexes"), load("pokemon_dex_numbers"), load("pokedex_prose")]);
const identifiers = ["national", "kanto", "original-johto", "hoenn", "original-sinnoh", "extended-sinnoh", "updated-johto", "updated-unova", "kalos-central", "kalos-coastal", "kalos-mountain", "updated-hoenn", "updated-alola", "letsgo-kanto", "galar", "isle-of-armor", "crown-tundra", "hisui", "paldea", "kitakami", "blueberry", "lumiose-city", "hyperspace"];
const languageCodes = { 1: "JPN", 3: "KOR", 4: "CHT", 5: "FRA", 6: "DEU", 7: "ES-ES", 8: "ITA", 9: "ENG", 11: "JPN", 12: "CHS", 14: "ES-LA" };
const pokedexes = {};
for (const identifier of identifiers) {
  const definition = definitions.find(row => row.identifier === identifier);
  if (!definition) throw new Error(`Missing Pokédex ${identifier}`);
  const entries = numbers.filter(row => row.pokedex_id === definition.id).map(row => [Number(row.species_id), Number(row.pokedex_number)]).sort((a, b) => a[1] - b[1]);
  if (!entries.length || new Set(entries.map(row => row[0])).size !== entries.length || new Set(entries.map(row => row[1])).size !== entries.length || entries.some(([dex, number]) => !Number.isInteger(dex) || dex < 1 || dex > 1025 || !Number.isInteger(number) || number < 0)) throw new Error(`Invalid Pokédex ${identifier}`);
  const names = Object.fromEntries(prose.filter(row => row.pokedex_id === definition.id && languageCodes[row.local_language_id]).map(row => [languageCodes[row.local_language_id], row.name]));
  if (!names.ENG) throw new Error(`Missing name for ${identifier}`);
  pokedexes[identifier] = { names, entries };
}
const dateIndex = process.argv.indexOf("--as-of");
const checkedOn = dateIndex >= 0 ? process.argv[dateIndex + 1] : new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) throw new Error("Expected --as-of YYYY-MM-DD");
const output = { meta: { source: "PokéAPI", sourceUrl: "https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv", checkedOn }, pokedexes };
await writeFile("public/data/pokedex-orders.json.tmp", JSON.stringify(output, null, 2) + "\n");
await rename("public/data/pokedex-orders.json.tmp", "public/data/pokedex-orders.json");
console.log(Object.entries(pokedexes).map(([id, dex]) => `${id}: ${dex.entries.length}`).join("\n"));
