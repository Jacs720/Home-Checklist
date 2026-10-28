import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseGoPage } from "./go-availability-parser.mjs";
import { matchGoForm } from "../src/go-form-match.ts";

const option = (key) => process.argv[process.argv.indexOf(key) + 1];
const asOf = process.argv.includes("--as-of") ? option("--as-of") : new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error("Expected --as-of YYYY-MM-DD");
const cache = resolve(process.argv.includes("--cache-dir") ? option("--cache-dir") : "artifacts/go-availability-cache");
await mkdir(cache, { recursive: true });
const catalog = JSON.parse(await readFile("public/data/special-collections.json", "utf8")).entries.filter(entry => entry.collection === "go");
if (catalog.length !== 1025 || new Set(catalog.map(entry => entry.dex)).size !== 1025) throw new Error("Expected all 1,025 GO planning species");
const batches = Array.from({ length: Math.ceil(catalog.length / 25) }, (_, i) => catalog.slice(i * 25, (i + 1) * 25));
const species = {};
async function worker() {
  while (batches.length) {
    const batch = batches.shift();
    const path = join(cache, `${batch[0].dex}.json`);
    let response;
    try {
      if (!process.argv.includes("--cache-dir")) throw new Error("Refresh source");
      response = JSON.parse(await readFile(path, "utf8"));
    } catch {
      const url = new URL("https://pokemongo.fandom.com/api.php");
      url.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", redirects: "1", prop: "revisions", rvslots: "main", rvprop: "ids|timestamp|content", titles: batch.map(entry => entry.name).join("|") });
      const result = await fetch(url);
      if (!result.ok) throw new Error(`${result.status}: ${url}`);
      response = await result.json();
      if (!response.query?.pages) throw new Error("Invalid Pokémon GO Wiki response");
      await writeFile(path, JSON.stringify(response));
    }
    for (const entry of batch) {
      let title = entry.name;
      for (const alias of [...(response.query.normalized ?? []), ...(response.query.redirects ?? [])]) if (alias.from === title) title = alias.to;
      const page = response.query.pages.find(page => page.title === title);
      if (!page?.revisions?.[0]?.slots?.main?.content) throw new Error(`Missing GO page: ${entry.dex} ${title}`);
      const record = parseGoPage(page, asOf);
      if (record.release === "unknown" && record.forms.length === 0) throw new Error(`Unresolved release: ${entry.dex} ${title}`);
      species[entry.dex] = record;
    }
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
if (Object.keys(species).length !== 1025) throw new Error("Incomplete GO availability snapshot");
const baseEntries = JSON.parse(await readFile("public/data/pokemon-lite.json", "utf8")).entries;
for (const entry of baseEntries.filter(entry => entry.dex > 0 && entry.dex <= 1025 && entry.availability !== "excluded")) {
  const fact = matchGoForm(entry.dex, entry.form, species[entry.dex]);
  if (fact.release === "unknown") throw new Error(`Unresolved GO form: ${entry.dex} ${entry.form}`);
  if (fact.release === "released" && fact.methods.length === 0) throw new Error(`Missing GO methods: ${entry.dex} ${entry.form}`);
}
const output = { meta: { asOf, speciesCount: 1025, source: "Pokémon GO Wiki", sourceUrl: "https://pokemongo.fandom.com/wiki/List_of_Pokémon", methodology: "Release and Shiny release dates and historical encounter categories from each species Availability section. Methods are documented routes, not a claim about today's active rotation. HOME forms are matched independently; unavailable planning entries remain visible.", license: "CC BY-SA; source URL and revision retained per species" }, species };
const target = "public/data/go-availability.json";
await writeFile(`${target}.tmp`, `${JSON.stringify(output, null, 2)}\n`);
await rename(`${target}.tmp`, target);
console.log(`Wrote ${target}: ${Object.keys(species).length} species, as of ${asOf}`);
