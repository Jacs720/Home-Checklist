import { spawn } from "node:child_process";
import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, "public", "assets", "pokemon");
const POKEAPI_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home";
const POKEAPI_OFFICIAL_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
const CONCURRENCY = 10;
const force = process.argv.includes("--force");

const runtimeArtIds = [
  10025,
  10067, 10068, 10069, 10070, 10071, 10072, 10073, 10074, 10075,
  10086, 10087, 10088, 10089, 10090, 10091, 10092, 10093, 10094,
  10095, 10096, 10097, 10098, 10099, 10100, 10101, 10102, 10161, 10162,
];

const padArtId = (artId) => String(artId).padStart(4, "0");

async function loadEntries() {
  const files = ["pokemon-lite.json", "special-collections.json"];
  const datasets = await Promise.all(files.map(async (file) => {
    const contents = await readFile(path.join(ROOT, "public", "data", file), "utf8");
    return JSON.parse(contents).entries;
  }));
  return datasets.flat();
}

function addRequest(requests, entry, variant) {
  if (!entry.artId) return;
  const female = entry.genderVariant === "extra";
  const suffix = female ? "-female" : "";
  const filename = `${padArtId(entry.artId)}${suffix}.webp`;
  const destination = path.join(OUTPUT_ROOT, variant, filename);
  const variantPath = variant === "shiny" ? "shiny/" : "";
  const sources = female
    ? [
        `${POKEAPI_ROOT}/${variantPath}female/${entry.artId}.png`,
        `${POKEAPI_ROOT}/${variantPath}${entry.artId}.png`,
        `${POKEAPI_OFFICIAL_ROOT}/${variantPath}${entry.artId}.png`,
      ]
    : [
        `${POKEAPI_ROOT}/${variantPath}${entry.artId}.png`,
        `${POKEAPI_OFFICIAL_ROOT}/${variantPath}${entry.artId}.png`,
      ];
  requests.set(destination, { destination, sources });
}

function buildRequests(entries) {
  const requests = new Map();
  for (const entry of entries) {
    if (entry.normalEligible !== false) addRequest(requests, entry, "normal");
    if (entry.shinyEligible) addRequest(requests, entry, "shiny");
  }

  // app/page.tsx adds and corrects these form IDs at runtime.
  for (const artId of runtimeArtIds) {
    addRequest(requests, { artId }, "normal");
    addRequest(requests, { artId }, "shiny");
  }
  return [...requests.values()];
}

async function fetchFirstAvailable(sources) {
  for (const source of sources) {
    const response = await fetch(source);
    if (response.ok) return { source, buffer: Buffer.from(await response.arrayBuffer()) };
    if (response.status !== 404) throw new Error(`${response.status} ${response.statusText}: ${source}`);
  }
  return null;
}

async function convertToWebp(buffer, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await new Promise((resolve, reject) => {
    const process = spawn("magick", ["png:-", "-resize", "256x256>", "-quality", "82", destination], {
      stdio: ["pipe", "ignore", "pipe"],
    });
    let error = "";
    process.stderr.on("data", (chunk) => { error += chunk; });
    process.on("error", reject);
    process.on("close", (code) => code === 0 ? resolve() : reject(new Error(error || `ImageMagick terminó con código ${code}`)));
    process.stdin.end(buffer);
  });
}

async function fileExists(filename) {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const entries = await loadEntries();
  const requests = buildRequests(entries);
  const total = requests.length;
  const missing = [];
  let completed = 0;
  let downloaded = 0;

  async function worker() {
    while (requests.length) {
      const request = requests.shift();
      if (!force && await fileExists(request.destination)) {
        completed += 1;
        if (completed % 100 === 0 || completed === total) console.log(`${completed}/${total} sprites procesados`);
        continue;
      }
      const result = await fetchFirstAvailable(request.sources);
      if (!result) {
        missing.push(request.sources[0]);
      } else {
        await convertToWebp(result.buffer, request.destination);
        downloaded += 1;
      }
      completed += 1;
      if (completed % 100 === 0 || completed === total) console.log(`${completed}/${total} sprites procesados`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`${downloaded} sprites descargados y convertidos; ${completed - downloaded - missing.length} ya existían.`);
  if (missing.length) {
    console.error(`${missing.length} sprites no están disponibles en PokéAPI:`);
    missing.forEach((source) => console.error(`- ${source}`));
    process.exitCode = 1;
  }
}

await main();
