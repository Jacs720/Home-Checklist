import { strFromU8, unzipSync } from "fflate";

const MAX_WORKBOOK_BYTES = 15 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 80 * 1024 * 1024;
const MAX_SOURCE_ROWS = 10_000;

export type AustinJohnWorkbook = {
  sheetName: string;
  versionLabel: string | null;
  rowsRead: number;
  sourceDexes: number[];
  ownedDexes: number[];
};

export type AustinJohnPreview = AustinJohnWorkbook & {
  matchedDexes: number[];
  matchedOwnedDexes: number[];
  matched: number;
  owned: number;
  missing: number;
  unmatched: number;
  alreadyOwned: number;
  newOwned: number;
  replaceRemovals: number;
};

export type AustinJohnImportErrorCode = "file-too-large" | "shiny-workbook" | "invalid-workbook";

export class AustinJohnImportError extends Error {
  readonly code: AustinJohnImportErrorCode;

  constructor(code: AustinJohnImportErrorCode) {
    super(code);
    this.name = "AustinJohnImportError";
    this.code = code;
  }
}

type CellValue = string | number | boolean | null;
type SheetRow = Map<number, CellValue>;
type SheetReference = { name: string; relationshipId: string };

function normalizeImportValue(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}0-9!?]+/gu, " ")
    .trim()
    .toLowerCase();
}

function decodeXml(value: string) {
  return value.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (entity, token: string) => {
    const named: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
    const normalized = token.toLowerCase();
    if (named[normalized]) return named[normalized];
    const codePoint = normalized.startsWith("#x")
      ? Number.parseInt(normalized.slice(2), 16)
      : Number.parseInt(normalized.slice(1), 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
  });
}

function attribute(source: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`(?:^|\\s)${escaped}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? decodeXml(match[1] ?? match[2] ?? "") : null;
}

function xmlText(xml: string) {
  return [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map((match) => decodeXml(match[1])).join("");
}

function zipText(files: Record<string, Uint8Array>, path: string) {
  const normalized = path.replace(/^\//, "").replace(/\\/g, "/");
  const value = files[normalized];
  return value ? strFromU8(value) : null;
}

function resolveZipPath(basePath: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = `${basePath.slice(0, basePath.lastIndexOf("/") + 1)}${target}`.replace(/\\/g, "/").split("/");
  const resolved: string[] = [];
  parts.forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") resolved.pop(); else resolved.push(part);
  });
  return resolved.join("/");
}

function workbookSheets(workbookXml: string) {
  const sheets: SheetReference[] = [];
  for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?\s*>/gi)) {
    const name = attribute(match[1], "name");
    const relationshipId = attribute(match[1], "r:id");
    if (name && relationshipId) sheets.push({ name, relationshipId });
  }
  return sheets;
}

function relationshipTargets(relationshipsXml: string) {
  const targets = new Map<string, string>();
  for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?\s*>/gi)) {
    const id = attribute(match[1], "Id");
    const target = attribute(match[1], "Target");
    if (id && target) targets.set(id, resolveZipPath("xl/workbook.xml", target));
  }
  return targets;
}

function sharedStrings(sharedStringsXml: string | null) {
  if (!sharedStringsXml) return [];
  return [...sharedStringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)].map((match) => xmlText(match[1]));
}

function columnIndex(cellReference: string) {
  const letters = cellReference.match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) return -1;
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function cellValue(attributes: string, body: string, strings: string[]): CellValue {
  const type = attribute(attributes, "t");
  if (type === "inlineStr") return xmlText(body);
  const rawValue = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i)?.[1];
  if (rawValue === undefined) return null;
  const decoded = decodeXml(rawValue);
  if (type === "s") return strings[Number.parseInt(decoded, 10)] ?? null;
  if (type === "b") return decoded === "1";
  if (type === "str" || type === "e") return decoded;
  const numeric = Number(decoded);
  return decoded.trim() !== "" && Number.isFinite(numeric) ? numeric : decoded;
}

function worksheetRows(worksheetXml: string, strings: string[]) {
  const rows: SheetRow[] = [];
  for (const rowMatch of worksheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)) {
    const row = new Map<number, CellValue>();
    const cellPattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gi;
    for (const cellMatch of rowMatch[1].matchAll(cellPattern)) {
      const reference = attribute(cellMatch[1], "r");
      const index = reference ? columnIndex(reference) : -1;
      if (index >= 0) row.set(index, cellValue(cellMatch[1], cellMatch[2] ?? "", strings));
    }
    if (row.size) rows.push(row);
    if (rows.length > MAX_SOURCE_ROWS) throw new AustinJohnImportError("invalid-workbook");
  }
  return rows;
}

function normalizedCell(value: CellValue | undefined) {
  return normalizeImportValue(value);
}

function locateHeader(rows: SheetRow[]) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 40); rowIndex += 1) {
    const row = rows[rowIndex];
    const columns = [...row.keys()];
    const find = (aliases: string[]) => columns.find((column) => aliases.includes(normalizedCell(row.get(column)))) ?? -1;
    const name = find(["name", "pokemon", "species"]);
    const dex = find(["dex", "national dex", "national pokedex", "nat"]);
    const keyword = find(["keyword"]);
    const form = find(["form name", "form", "forma"]);
    if (name < 0 || dex < 0 || keyword < 0) continue;
    let progress = find(["complete", "completed", "progress", "owned", "have"]);
    if (progress < 0 && normalizedCell(row.get(dex + 1)) === "1") progress = dex + 1;
    if (progress < 0) progress = columns.find((column) => column > dex && normalizedCell(row.get(column)) === "1") ?? -1;
    if (progress >= 0) return { rowIndex, name, dex, keyword, form, progress };
  }
  throw new AustinJohnImportError("invalid-workbook");
}

function isOwnedProgress(value: CellValue | undefined) {
  return value === 0 || (typeof value === "string" && value.trim() === "0");
}

function findVersionLabel(rows: SheetRow[]) {
  for (const row of rows.slice(0, 12)) {
    for (const value of row.values()) {
      if (typeof value === "string" && /(?:non-)?shiny\s+version/i.test(value)) return value.trim();
    }
  }
  return null;
}

function sheetNameMatches(name: string, shiny: boolean) {
  const normalized = normalizeImportValue(name);
  if (shiny) return ["s living", "s living dex", "s livingdex"].includes(normalized);
  return ["living", "living dex", "livingdex"].includes(normalized)
    || (normalized.includes("living") && !normalized.includes("form") && !normalized.includes("lite") && !normalized.startsWith("s "));
}

export function parseAustinJohnWorkbook(buffer: ArrayBuffer): AustinJohnWorkbook {
  if (!buffer.byteLength || buffer.byteLength > MAX_WORKBOOK_BYTES) throw new AustinJohnImportError("file-too-large");
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(buffer));
  } catch {
    throw new AustinJohnImportError("invalid-workbook");
  }
  const uncompressedBytes = Object.values(files).reduce((total, value) => total + value.byteLength, 0);
  if (uncompressedBytes > MAX_UNCOMPRESSED_BYTES) throw new AustinJohnImportError("file-too-large");
  const workbookXml = zipText(files, "xl/workbook.xml");
  const relationshipsXml = zipText(files, "xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relationshipsXml) throw new AustinJohnImportError("invalid-workbook");
  const sheets = workbookSheets(workbookXml);
  const targets = relationshipTargets(relationshipsXml);
  const strings = sharedStrings(zipText(files, "xl/sharedStrings.xml"));
  const readSheet = (sheet: SheetReference | undefined) => {
    const path = sheet ? targets.get(sheet.relationshipId) : null;
    const xml = path ? zipText(files, path) : null;
    return xml ? worksheetRows(xml, strings) : null;
  };

  const keySheet = sheets.find((sheet) => normalizeImportValue(sheet.name) === "key");
  const keyRows = readSheet(keySheet) ?? [];
  const versionLabel = findVersionLabel(keyRows);
  const shinyDetected = Boolean(versionLabel && /^shiny\s+version/i.test(versionLabel)) || sheets.some((sheet) => sheetNameMatches(sheet.name, true));
  const livingSheet = sheets.find((sheet) => sheetNameMatches(sheet.name, false));
  if (shinyDetected) throw new AustinJohnImportError("shiny-workbook");
  if (!livingSheet) throw new AustinJohnImportError("invalid-workbook");
  const rows = readSheet(livingSheet);
  if (!rows) throw new AustinJohnImportError("invalid-workbook");
  const header = locateHeader(rows);
  const sourceDexes = new Set<number>();
  const ownedDexes = new Set<number>();
  let rowsRead = 0;
  for (const row of rows.slice(header.rowIndex + 1)) {
    const dexValue = row.get(header.dex);
    const dex = typeof dexValue === "number" ? dexValue : Number.parseInt(String(dexValue ?? ""), 10);
    if (!Number.isInteger(dex) || dex <= 0 || dex > 10_000) continue;
    rowsRead += 1;
    sourceDexes.add(dex);
    if (isOwnedProgress(row.get(header.progress))) ownedDexes.add(dex);
  }
  if (!rowsRead || !sourceDexes.size) throw new AustinJohnImportError("invalid-workbook");
  return {
    sheetName: livingSheet.name,
    versionLabel,
    rowsRead,
    sourceDexes: [...sourceDexes].sort((left, right) => left - right),
    ownedDexes: [...ownedDexes].sort((left, right) => left - right),
  };
}

export function buildAustinJohnPreview(
  workbook: AustinJohnWorkbook,
  supportedDexes: ReadonlySet<number>,
  currentlyOwned: ReadonlySet<number>,
): AustinJohnPreview {
  const matchedDexes = workbook.sourceDexes.filter((dex) => supportedDexes.has(dex));
  const matchedOwnedDexes = workbook.ownedDexes.filter((dex) => supportedDexes.has(dex));
  const matchedOwned = new Set(matchedOwnedDexes);
  return {
    ...workbook,
    matchedDexes,
    matchedOwnedDexes,
    matched: matchedDexes.length,
    owned: matchedOwnedDexes.length,
    missing: matchedDexes.length - matchedOwnedDexes.length,
    unmatched: workbook.sourceDexes.length - matchedDexes.length,
    alreadyOwned: matchedOwnedDexes.filter((dex) => currentlyOwned.has(dex)).length,
    newOwned: matchedOwnedDexes.filter((dex) => !currentlyOwned.has(dex)).length,
    replaceRemovals: [...currentlyOwned].filter((dex) => !matchedOwned.has(dex)).length,
  };
}
