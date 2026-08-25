export type CollectionRecord = {
  planId?: string;
  number?: number;
  species: string;
  form: string;
  originMark: string;
  shiny: boolean;
  ot: string;
  trainerId: string;
  ball: string;
  specialOrigin: string;
  nationalRibbon: boolean;
  distantLand: boolean;
};

export type ImportCatalogEntry = {
  id: string;
  dex: number;
  name: string;
  form: string | null;
  mark?: string;
  collection?: string;
  note?: string;
  trainerName?: string;
  shinyEligible: boolean;
  normalEligible?: boolean;
  availability: "standard" | "hypothetical" | "excluded";
  gender?: "male" | "female";
  genderVariant?: "base" | "extra";
};

export type ImportMatchSummary = {
  rowsRead: number;
  matchedRows: number;
  newPlanIds: string[];
  alreadyOwned: number;
  unmatched: number;
  ambiguous: number;
};

type PokemonNames = Record<string, Record<string, string | undefined> | undefined>;

const MAX_TRANSFER_CHARACTERS = 1_000_000;
const MAX_TRANSFER_RECORDS = 10_000;

export function normalizeImportValue(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}0-9!?]+/gu, " ")
    .trim()
    .toLowerCase();
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = String(text ?? "");

  for (let index = 0; index < source.length; index += 1) {
    const value = source[index];
    if (value === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (value === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((value === "\r" || value === "\n") && !quoted) {
      if (value === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      cell += value;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some(Boolean)) rows.push(row);
  }
  if (rows[0]?.[0]?.startsWith("\uFEFF")) rows[0][0] = rows[0][0].slice(1);
  return rows;
}

const HEADER_ALIASES = {
  planId: ["planid", "plan id", "checklist id", "id checklist"],
  number: ["no", "n", "numero", "number", "national number", "nationalnumber", "nr", "番号", "번호", "编号", "編號"],
  species: ["species", "especie", "espece", "specie", "spezies", "pokemon", "ポケモン", "포켓몬", "宝可梦", "寶可夢"],
  form: ["form", "forma", "forme", "フォルム", "폼", "形态", "形態"],
  originMark: ["originmark", "origin mark", "marca de origen", "marque d origine", "marchio origine", "herkunftssymbol", "出身マーク", "출신 마크", "来源标记", "來源標記"],
  shiny: ["shiny", "variocolor", "chromatique", "schillernd", "色違い", "이로치", "异色", "異色"],
  ot: ["ot", "eo", "do", "ao", "parent", "親", "어버이", "初训家", "初訓家"],
  trainerId: ["idno", "id no", "id n", "trainer id", "id entrenador", "n id"],
  ball: ["ball", "bola", "pokeball", "poke ball", "ボール", "볼", "球"],
  specialOrigin: ["special origin", "origen especial", "origine speciale", "origine speciale", "spezielle herkunft", "特別な出身", "특별 출신", "特殊来源", "特殊來源"],
  nationalRibbon: ["national ribbon", "cinta nacional", "ruban national", "fiocco nazionale", "band der nation", "ナショナルリボン", "내셔널리본", "国家奖章", "國家獎章"],
  distantLand: ["distant land", "lugar lejano", "terre lointaine", "terra lontana", "fernes land", "遠く離れた土地", "먼 곳", "遥远的地方", "遙遠的地方"],
} as const;

function headerIndex(headers: Map<string, number>, aliases: readonly string[]) {
  for (const alias of aliases) {
    const index = headers.get(normalizeImportValue(alias));
    if (index !== undefined) return index;
  }
  return -1;
}

function valueAt(row: string[], index: number) {
  return index >= 0 && index < row.length ? row[index] : "";
}

function parseNumber(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  const number = Number.parseInt(digits, 10);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function truthy(value: unknown) {
  const normalized = normalizeImportValue(value);
  return ["1", "true", "si", "yes", "oui", "ja", "はい", "예", "네", "是", "shiny", "variocolor", "chromatique", "schillernd", "色違い", "이로치", "异色", "異色"].includes(normalized);
}

export function parseCollectionCsv(text: string) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("invalid-csv");
  const headers = new Map(rows[0].map((header, index) => [normalizeImportValue(header), index]));
  const columns = Object.fromEntries(Object.entries(HEADER_ALIASES).map(([key, aliases]) => [key, headerIndex(headers, aliases)])) as Record<keyof typeof HEADER_ALIASES, number>;
  if (columns.planId < 0 && columns.number < 0 && columns.species < 0) throw new Error("invalid-csv");

  return rows.slice(1).map((row) => ({
    planId: valueAt(row, columns.planId).trim() || undefined,
    number: parseNumber(valueAt(row, columns.number)),
    species: valueAt(row, columns.species).trim(),
    form: valueAt(row, columns.form).trim(),
    originMark: valueAt(row, columns.originMark).trim(),
    shiny: truthy(valueAt(row, columns.shiny)),
    ot: valueAt(row, columns.ot).trim(),
    trainerId: valueAt(row, columns.trainerId).trim(),
    ball: valueAt(row, columns.ball).trim(),
    specialOrigin: valueAt(row, columns.specialOrigin).trim(),
    nationalRibbon: truthy(valueAt(row, columns.nationalRibbon)),
    distantLand: truthy(valueAt(row, columns.distantLand)),
  })).filter((record) => record.planId || record.number || record.species);
}

export function parseCompactTransfer(value: unknown): CollectionRecord[] {
  if (!value || typeof value !== "object") throw new Error("invalid-transfer");
  const payload = value as { v?: unknown; s?: unknown; r?: unknown };
  if (payload.v !== 2 || payload.s !== "pokemon-home-ocr" || !Array.isArray(payload.r) || payload.r.length > MAX_TRANSFER_RECORDS) throw new Error("invalid-transfer");

  return payload.r.map((raw) => {
    if (!Array.isArray(raw) || raw.length < 4) throw new Error("invalid-transfer");
    const number = typeof raw[0] === "number" && Number.isInteger(raw[0]) && raw[0] > 0 ? raw[0] : undefined;
    if (!number) throw new Error("invalid-transfer");
    return {
      number,
      species: "",
      form: typeof raw[1] === "string" ? raw[1] : "",
      originMark: typeof raw[2] === "string" ? raw[2] : "",
      shiny: raw[3] === 1 || raw[3] === true,
      ot: "",
      trainerId: "",
      ball: "",
      specialOrigin: "",
      nationalRibbon: false,
      distantLand: false,
    };
  });
}

function base64UrlBytes(value: string) {
  if (!value || value.length > MAX_TRANSFER_CHARACTERS || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("invalid-transfer");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export async function decodeOcrTransferHash(hash: string) {
  const encoded = new URLSearchParams(hash.replace(/^#/, "")).get("ocr");
  if (!encoded) return null;
  const bytes = base64UrlBytes(encoded);
  if (typeof DecompressionStream === "undefined") throw new Error("unsupported-compression");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  return parseCompactTransfer(JSON.parse(text));
}

function canonicalOriginMark(value: string) {
  const mark = normalizeImportValue(value);
  if (mark.includes("sin marca") || mark.includes("no mark")) return "Sin marca";
  if (mark.includes("consola virtual") || mark.includes("gameboy") || mark.includes("game boy") || mark === "gb") return "GB";
  if (mark.includes("pokemon go") || mark === "go" || mark.includes("go mark")) return "go";
  if (mark.includes("pentagon") || mark === "kalos" || mark === "p") return "P";
  if (mark.includes("clover") || mark === "alola" || mark === "usum") return "USUM";
  if (mark.includes("let s go") || mark.includes("lets go") || mark === "lgpe") return "LGPE";
  if (mark === "galar" || mark.includes("galar mark") || mark === "swsh") return "SwSh";
  if (mark.includes("hisui") || mark.includes("legends arceus") || mark === "pla" || mark === "la") return "LA";
  if (mark.includes("bdsp") || mark.includes("sinnoh")) return "BDSP";
  if (mark === "paldea" || mark.includes("scarlet violet") || mark === "sv") return "SV";
  if (mark.includes("legends z a") || mark === "lza") return "LZA";
  if (mark.includes("game boy advance") || mark === "gba") return "GBA";
  return null;
}

function canonicalForm(value: string) {
  let form = normalizeImportValue(value);
  if (!form || ["estandar", "standard", "base", "original", "normal", "standardform", "forme standard", "standardform"].includes(form)) return "standard";
  if (form.startsWith("revisar forma") || form.startsWith("review form")) return "review";
  const replacements: [string, string][] = [
    ["paldea forma combatiente", "paldean combat breed"], ["paldea forma ardiente", "paldean blaze breed"], ["paldea forma acuatica", "paldean aqua breed"],
    ["tronco planta", "plant"], ["tronco arena", "sandy"], ["tronco basura", "trash"], ["rotom calor", "heat"], ["rotom lavado", "wash"],
    ["rotom frio", "frost"], ["rotom ventilador", "fan"], ["rotom corte", "mow"], ["forma tierra", "land"], ["forma cielo", "sky"],
    ["contenido", "confined"], ["desatado", "unbound"], ["estilo apasionado", "baile style"], ["estilo animado", "pom pom style"],
    ["estilo placido", "pa u style"], ["estilo refinado", "sensu style"], ["estilo brusco", "single strike"], ["estilo fluido", "rapid strike"],
    ["mar oeste", "west sea"], ["mar este", "east sea"], ["raya roja", "red stripe"], ["raya azul", "blue stripe"], ["raya blanca", "white stripe"],
    ["primavera", "spring"], ["verano", "summer"], ["otono", "fall"], ["invierno", "winter"], ["flor eterna", "eternal flower"],
    ["forma ataque", "attack"], ["forma defensa", "defense"], ["forma velocidad", "speed"], ["forma normal", "normal"],
  ];
  for (const [source, target] of replacements) form = form.replace(source, target);
  return form.replace(/^forma /, "").replace(/^form /, "").replace(/^rotom /, "").trim();
}

function formsEquivalent(left: string, right: string) {
  return left === right || (left !== "standard" && right !== "standard" && left !== "review" && right !== "review" && (left.includes(right) || right.includes(left)));
}

function entryForm(entry: ImportCatalogEntry) {
  if (entry.genderVariant === "extra" && entry.gender) return canonicalForm(entry.gender);
  return canonicalForm(entry.form ?? "");
}

function buildSpeciesIndex(entries: ImportCatalogEntry[], pokemonNames: PokemonNames) {
  const index = new Map<string, Set<number>>();
  const add = (name: string, dex: number) => {
    const key = normalizeImportValue(name);
    if (!key) return;
    if (!index.has(key)) index.set(key, new Set());
    index.get(key)?.add(dex);
  };
  entries.forEach((entry) => add(entry.name, entry.dex));
  Object.entries(pokemonNames).forEach(([dex, names]) => Object.values(names ?? {}).forEach((name) => { if (name) add(name, Number(dex)); }));
  return index;
}

function eligible(entry: ImportCatalogEntry, shiny: boolean) {
  if (entry.availability === "excluded") return false;
  return shiny ? entry.shinyEligible : entry.normalEligible !== false;
}

function planId(entry: ImportCatalogEntry, shiny: boolean) {
  return `${entry.id}:${shiny ? "shiny" : "normal"}`;
}

function inferSpecialCollection(record: CollectionRecord, dex: number, entries: ImportCatalogEntry[]) {
  const special = normalizeImportValue(record.specialOrigin);
  const ot = normalizeImportValue(record.ot);
  const trainerId = record.trainerId.replace(/[^0-9]/g, "");
  const ball = normalizeImportValue(record.ball);
  if (special.includes("colosseum")) return "shadow-colosseum";
  if (special.includes("pokemon xd") || special === "xd" || special.includes("gale of darkness")) return "shadow-xd";
  if (special.includes("dream radar")) return "radar";
  if (special.includes("dream world")) return "dream";
  if (special.includes("pokemon go")) return "go";
  if (ot === "n" && (!trainerId || trainerId === "00002" || trainerId === "2")) return "n";
  if (entries.some((entry) => entry.dex === dex && entry.collection === "trades" && entry.trainerName && normalizeImportValue(entry.trainerName) === ot)) return "trades";
  if (["cherish", "pregio", "memoire", "jubel", "pregio", "プレシャス", "프레셔스", "贵重", "貴重"].some((name) => ball.includes(name))) return "event-or-cherish";
  if (record.nationalRibbon || record.distantLand) return "shadow";
  return null;
}

function refineByOt(candidates: ImportCatalogEntry[], record: CollectionRecord) {
  const ot = normalizeImportValue(record.ot);
  if (!ot) return candidates;
  const exact = candidates.filter((entry) => entry.trainerName && normalizeImportValue(entry.trainerName) === ot);
  if (exact.length) return exact;
  const noted = candidates.filter((entry) => {
    const note = normalizeImportValue(entry.note);
    return note.includes(`ot ${ot}`) || note.includes(`eo ${ot}`) || note.includes(`do ${ot}`) || note.includes(`ao ${ot}`);
  });
  return noted.length ? noted : candidates;
}

function candidatesForRecord(record: CollectionRecord, dex: number, entries: ImportCatalogEntry[]) {
  const origin = canonicalOriginMark(record.originMark);
  const specialCollection = origin === "go" ? "go" : inferSpecialCollection(record, dex, entries);
  let candidates = entries.filter((entry) => entry.dex === dex && eligible(entry, record.shiny));
  if (specialCollection === "event-or-cherish") {
    const eventCandidates = candidates.filter((entry) => entry.collection === "events" && entry.mark === origin);
    candidates = eventCandidates.length ? eventCandidates : candidates.filter((entry) => entry.collection === "cherish");
  } else if (specialCollection === "shadow") {
    candidates = candidates.filter((entry) => entry.collection === "shadow-colosseum" || entry.collection === "shadow-xd");
  } else if (specialCollection) {
    candidates = candidates.filter((entry) => entry.collection === specialCollection);
  } else if (origin) {
    candidates = candidates.filter((entry) => !entry.collection && entry.mark === origin);
  } else {
    return [];
  }

  const wantedForm = canonicalForm(record.form);
  if (wantedForm === "review") return candidates.length > 1 ? [] : candidates;
  let formMatches = candidates.filter((entry) => formsEquivalent(wantedForm, entryForm(entry)));
  if (wantedForm === "standard" && formMatches.length > 1) {
    const base = formMatches.filter((entry) => entry.genderVariant !== "extra");
    if (base.length) formMatches = base;
  }
  return refineByOt(formMatches, record);
}

export function matchCollectionRecords(
  records: CollectionRecord[],
  entries: ImportCatalogEntry[],
  pokemonNames: PokemonNames,
  currentlyOwned: ReadonlySet<string>,
): ImportMatchSummary {
  const speciesIndex = buildSpeciesIndex(entries, pokemonNames);
  const validTargets = new Map<string, ImportCatalogEntry>();
  entries.forEach((entry) => {
    if (eligible(entry, false)) validTargets.set(planId(entry, false), entry);
    if (eligible(entry, true)) validTargets.set(planId(entry, true), entry);
  });
  const added = new Set<string>();
  let matchedRows = 0;
  let alreadyOwned = 0;
  let unmatched = 0;
  let ambiguous = 0;

  records.slice(0, MAX_TRANSFER_RECORDS).forEach((record) => {
    if (record.planId) {
      if (!validTargets.has(record.planId)) { unmatched += 1; return; }
      matchedRows += 1;
      if (currentlyOwned.has(record.planId) || added.has(record.planId)) alreadyOwned += 1;
      else added.add(record.planId);
      return;
    }
    let dex = record.number;
    if (!dex && record.species) {
      const matches = speciesIndex.get(normalizeImportValue(record.species));
      if (matches?.size === 1) dex = [...matches][0];
    }
    if (!dex) { unmatched += 1; return; }
    const candidates = candidatesForRecord(record, dex, entries);
    if (candidates.length === 0) {
      const broadCandidates = entries.filter((entry) => entry.dex === dex && eligible(entry, record.shiny));
      if (canonicalForm(record.form) === "review" && broadCandidates.length > 1) ambiguous += 1;
      else unmatched += 1;
      return;
    }
    if (candidates.length > 1) { ambiguous += 1; return; }
    const target = planId(candidates[0], record.shiny);
    matchedRows += 1;
    if (currentlyOwned.has(target) || added.has(target)) alreadyOwned += 1;
    else added.add(target);
  });

  return { rowsRead: records.length, matchedRows, newPlanIds: [...added], alreadyOwned, unmatched, ambiguous };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildOwnedProgressCsv(owned: ReadonlySet<string>, entries: ImportCatalogEntry[]) {
  const rows = [["PlanId", "No.", "Species", "Form", "Shiny", "OriginMark", "Collection"]];
  const targets = new Map<string, { entry: ImportCatalogEntry; shiny: boolean }>();
  entries.forEach((entry) => {
    if (eligible(entry, false)) targets.set(planId(entry, false), { entry, shiny: false });
    if (eligible(entry, true)) targets.set(planId(entry, true), { entry, shiny: true });
  });
  [...owned].sort().forEach((id) => {
    const target = targets.get(id);
    if (!target) return;
    rows.push([id, String(target.entry.dex), target.entry.name, target.entry.form ?? "", target.shiny ? "Yes" : "No", target.entry.mark ?? "", target.entry.collection ?? ""]);
  });
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
