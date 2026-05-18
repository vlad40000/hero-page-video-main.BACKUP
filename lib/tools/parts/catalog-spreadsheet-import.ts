import "server-only";

import { inflateRawSync } from "node:zlib";

import { normalizePartNumber } from "@/lib/tools/parts/http";
import { normalizeModelNumber } from "@/lib/tools/parts/normalize";
import {
  applyEncompassPriceSnapshot,
  getPartNumberFromStore,
  upsertPartNumbersForModel,
} from "@/lib/tools/parts/part-number-store";

type SpreadsheetRow = Record<string, string>;

type ParsedSpreadsheet = {
  sheetName: string | null;
  rows: SpreadsheetRow[];
};

type RegistryImportPart = {
  partNumber: string;
  canonicalPartNumber: string;
  rawPartNumber: string;
  canonicalPartName: string;
  normalizedCategory: string | null;
  normalizedSection: string | null;
  observedModels: string[];
  substituteChain: string[];
  providerRows: unknown[];
  sourceConfidence: Record<string, unknown>;
  firstSeenSource: string;
  lastSeenSource: string;
  retailPrice: number | null;
  retailPriceText: string | null;
  retailPriceSource: string | null;
  retailPriceUrl: string | null;
};

export type CatalogSpreadsheetImportInput = {
  data: ArrayBuffer;
  fileName: string;
  contentType?: string | null;
  modelNumber?: string | null;
  source?: string | null;
};

export type CatalogSpreadsheetImportResult = {
  fileName: string;
  sheetName: string | null;
  source: string;
  modelNumber: string | null;
  totalRows: number;
  validRows: number;
  uniqueParts: number;
  insertedParts: number;
  updatedParts: number;
  skippedRows: number;
  pricedParts: number;
  samplePartNumbers: string[];
};

const FIELD_ALIASES = {
  partNumber: ["partnumber", "partno", "mpn", "oemnumber", "oempartnumber", "canonicalpartnumber"],
  description: ["description", "partdescription", "partname", "name", "canonicalpartname"],
  price: ["priceusd", "price", "retailprice", "retailpriceusd", "supplierprice"],
  manualPrice: ["ebaymanualpriceusd", "manualpriceusd", "manualprice", "ebayprice"],
  priceSource: ["pricesource", "source", "supplier", "provider"],
  priceUrl: ["priceurl", "supplierurl", "providerurl", "parturl"],
  ebayUrl: ["ebaypriceurl", "ebayurl"],
  section: ["assemblysection", "section", "diagramsection", "normalizedsection"],
  category: ["category", "normalizedcategory", "partcategory"],
  diagramUrl: ["diagramurl", "schematicurl", "assemblyurl"],
  refId: ["refid", "referenceid", "diagramref", "itemid", "position"],
  quantity: ["quantity", "qty"],
} as const;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function firstField(row: SpreadsheetRow, aliases: readonly string[]): string | null {
  for (const alias of aliases) {
    const value = text(row[alias]);
    if (value) return value;
  }
  return null;
}

function parseMoney(value: unknown): number | null {
  const match = text(value).replace(/,/g, "").match(/-?\$?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function sourceFromUrl(value: string | null): string | null {
  if (!value || !/^https?:\/\//i.test(value)) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function inferModelFromFileName(fileName: string): string | null {
  const upper = fileName.toUpperCase();
  const labeled = upper.match(/(?:BOM|MODEL|PARTS)[\s._-]*([A-Z0-9]{5,})/);
  const candidate = labeled?.[1] || upper.match(/\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6,}\b/)?.[0];
  return candidate ? normalizeModelNumber(candidate) || null : null;
}

function detectDelimiter(textValue: string): string {
  const firstLine = textValue.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] || "";
  return (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";
}

function parseDelimitedText(textValue: string, delimiter = detectDelimiter(textValue)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const input = textValue.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value)) rows.push(row);
  return rows;
}

function rowsFromMatrix(matrix: string[][]): SpreadsheetRow[] {
  const headerIndex = matrix.findIndex((row) => row.some((value) => text(value)));
  if (headerIndex < 0) return [];

  const headers = matrix[headerIndex].map((header, index) => normalizeHeader(header) || `column${index + 1}`);
  return matrix.slice(headerIndex + 1).flatMap<SpreadsheetRow>((row) => {
    if (!row.some((value) => text(value))) return [];
    const record: SpreadsheetRow = {};
    headers.forEach((header, index) => {
      record[header] = text(row[index]);
    });
    return [record];
  });
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function attr(tag: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\s${escaped}=["']([^"']*)["']`, "i"));
  return match ? decodeXml(match[1]) : null;
}

function stripTags(value: string): string {
  return decodeXml(value.replace(/<[^>]+>/g, ""));
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const min = Math.max(0, buffer.length - 66000);
  for (let index = buffer.length - 22; index >= min; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) return index;
  }
  throw new Error("Invalid XLSX file.");
}

function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  const eocd = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocd + 10);
  let pointer = buffer.readUInt32LE(eocd + 16);

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) break;

    const compression = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const name = buffer.toString("utf8", pointer + 46, pointer + 46 + nameLength).replace(/\\/g, "/");

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = compression === 0 ? Buffer.from(compressed) : compression === 8 ? inflateRawSync(compressed) : null;

    if (data) entries.set(name.toLowerCase(), data);
    pointer += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function parseSharedStrings(xml: string): string[] {
  const values: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  let match: RegExpExecArray | null;

  while ((match = siRegex.exec(xml))) {
    const textNodes = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map((node) => decodeXml(node[1]));
    values.push(textNodes.length ? textNodes.join("") : stripTags(match[1]));
  }

  return values;
}

function columnIndex(cellRef: string | null): number | null {
  const letters = cellRef?.match(/[A-Z]+/i)?.[0];
  if (!letters) return null;
  return [...letters.toUpperCase()].reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function parseWorksheet(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(xml))) {
    const values: string[] = [];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/gi;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const type = attr(attrs, "t");
      const ref = attr(attrs, "r");
      const index = columnIndex(ref) ?? values.length;
      const rawValue = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i)?.[1] || "";
      const inlineValue = body.match(/<is\b[^>]*>([\s\S]*?)<\/is>/i)?.[1] || "";
      const value =
        type === "s"
          ? sharedStrings[Number(rawValue)] || ""
          : type === "inlineStr"
            ? stripTags(inlineValue)
            : decodeXml(rawValue);

      while (values.length < index) values.push("");
      values[index] = text(value);
    }

    if (values.some((value) => value)) rows.push(values);
  }

  return rows;
}

function firstWorksheetPath(entries: Map<string, Buffer>): { path: string; name: string | null } {
  const workbookXml = entries.get("xl/workbook.xml")?.toString("utf8") || "";
  const relsXml = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8") || "";
  const firstSheetTag = workbookXml.match(/<sheet\b[^>]*>/i)?.[0] || "";
  const relId = attr(firstSheetTag, "r:id");
  const name = attr(firstSheetTag, "name");

  if (relId && relsXml) {
    const relRegex = /<Relationship\b[^>]*>/gi;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = relRegex.exec(relsXml))) {
      if (attr(relMatch[0], "Id") === relId) {
        const target = attr(relMatch[0], "Target") || "worksheets/sheet1.xml";
        const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
        return { path: path.replace(/\/+/g, "/").toLowerCase(), name };
      }
    }
  }

  return { path: "xl/worksheets/sheet1.xml", name };
}

function parseXlsx(buffer: Buffer): ParsedSpreadsheet {
  const entries = readZipEntries(buffer);
  const sharedStrings = parseSharedStrings(entries.get("xl/sharedstrings.xml")?.toString("utf8") || "");
  const worksheet = firstWorksheetPath(entries);
  const sheetXml = entries.get(worksheet.path);
  if (!sheetXml) throw new Error("No readable worksheet found in XLSX file.");

  return {
    sheetName: worksheet.name,
    rows: rowsFromMatrix(parseWorksheet(sheetXml.toString("utf8"), sharedStrings)),
  };
}

function parseSpreadsheet(input: CatalogSpreadsheetImportInput): ParsedSpreadsheet {
  const fileName = input.fileName.toLowerCase();
  const buffer = Buffer.from(input.data);

  if (fileName.endsWith(".xlsx") || input.contentType?.includes("spreadsheetml")) {
    return parseXlsx(buffer);
  }

  if (fileName.endsWith(".csv") || fileName.endsWith(".tsv") || fileName.endsWith(".txt") || input.contentType?.includes("csv")) {
    const textValue = buffer.toString("utf8");
    return {
      sheetName: null,
      rows: rowsFromMatrix(parseDelimitedText(textValue, fileName.endsWith(".tsv") ? "\t" : detectDelimiter(textValue))),
    };
  }

  throw new Error("Upload a CSV, TSV, TXT, or XLSX parts spreadsheet.");
}

function buildImportPart(row: SpreadsheetRow, rowNumber: number, source: string, modelNumber: string | null, fileName: string): RegistryImportPart | null {
  const rawPartNumber = firstField(row, FIELD_ALIASES.partNumber);
  const partNumber = normalizePartNumber(rawPartNumber || "");
  if (!partNumber) return null;

  const price = parseMoney(firstField(row, FIELD_ALIASES.price)) ?? parseMoney(firstField(row, FIELD_ALIASES.manualPrice));
  const priceUrl = firstField(row, FIELD_ALIASES.priceUrl) || firstField(row, FIELD_ALIASES.ebayUrl);
  const priceSource = firstField(row, FIELD_ALIASES.priceSource) || sourceFromUrl(priceUrl) || source;
  const description = firstField(row, FIELD_ALIASES.description) || "Appliance part";
  const section = firstField(row, FIELD_ALIASES.section);
  const category = firstField(row, FIELD_ALIASES.category);
  const diagramUrl = firstField(row, FIELD_ALIASES.diagramUrl);
  const refId = firstField(row, FIELD_ALIASES.refId);

  const providerRow = {
    source: priceSource,
    importSource: source,
    fileName,
    rowNumber,
    refId,
    partNumber,
    description,
    price,
    priceSource,
    priceUrl,
    diagramUrl,
    assemblySection: section,
    quantity: firstField(row, FIELD_ALIASES.quantity),
    modelNumber,
    raw: row,
  };

  return {
    partNumber,
    canonicalPartNumber: partNumber,
    rawPartNumber: rawPartNumber || partNumber,
    canonicalPartName: description,
    normalizedCategory: category,
    normalizedSection: section,
    observedModels: modelNumber ? [modelNumber] : [],
    substituteChain: [],
    providerRows: [providerRow],
    sourceConfidence: {
      [priceSource]: {
        observed: true,
        spreadsheetImport: true,
      },
    },
    firstSeenSource: priceSource,
    lastSeenSource: priceSource,
    retailPrice: price,
    retailPriceText: price ? `$${price.toFixed(2)}` : null,
    retailPriceSource: priceSource,
    retailPriceUrl: priceUrl,
  };
}

function mergeImportParts(parts: RegistryImportPart[]): RegistryImportPart[] {
  const merged = new Map<string, RegistryImportPart>();

  for (const part of parts) {
    const existing = merged.get(part.partNumber);
    if (!existing) {
      merged.set(part.partNumber, part);
      continue;
    }

    existing.observedModels = [...new Set([...existing.observedModels, ...part.observedModels])];
    existing.providerRows = [...existing.providerRows, ...part.providerRows];
    existing.sourceConfidence = { ...existing.sourceConfidence, ...part.sourceConfidence };
    existing.normalizedCategory ||= part.normalizedCategory;
    existing.normalizedSection ||= part.normalizedSection;

    if (!existing.retailPrice && part.retailPrice) {
      existing.retailPrice = part.retailPrice;
      existing.retailPriceText = part.retailPriceText;
      existing.retailPriceSource = part.retailPriceSource;
      existing.retailPriceUrl = part.retailPriceUrl;
    }
  }

  return [...merged.values()];
}

export async function importCatalogSpreadsheet(input: CatalogSpreadsheetImportInput): Promise<CatalogSpreadsheetImportResult> {
  const parsed = parseSpreadsheet(input);
  const modelNumber = normalizeModelNumber(input.modelNumber || "") || inferModelFromFileName(input.fileName);
  const source = text(input.source) || "spreadsheet-import";
  const rowParts = parsed.rows
    .map((row, index) => buildImportPart(row, index + 2, source, modelNumber, input.fileName))
    .filter((part): part is RegistryImportPart => Boolean(part));
  const parts = mergeImportParts(rowParts);

  if (!parts.length) {
    throw new Error("No usable part numbers were found in the spreadsheet.");
  }

  const existing = await Promise.all(parts.map((part) => getPartNumberFromStore(part.partNumber)));
  const existingPartNumbers = new Set(
    existing.flatMap((part) => (part ? [String(part.canonicalPartNumber)] : []))
  );
  const pricedParts = parts.filter((part) => part.retailPrice);
  const applyPriceSnapshot = applyEncompassPriceSnapshot as unknown as (
    partNumber: string,
    snapshot: Record<string, unknown>
  ) => Promise<unknown>;

  await upsertPartNumbersForModel(modelNumber, parts, source);

  await Promise.all(
    pricedParts.map((part) =>
      applyPriceSnapshot(part.partNumber, {
        retailPrice: part.retailPrice,
        retailPriceText: part.retailPriceText,
        retailPriceSource: part.retailPriceSource || source,
        retailPriceVerified: true,
        retailPricedAt: new Date().toISOString(),
        sourceUrl: part.retailPriceUrl,
        importSource: source,
        fileName: input.fileName,
      })
    )
  );

  return {
    fileName: input.fileName,
    sheetName: parsed.sheetName,
    source,
    modelNumber,
    totalRows: parsed.rows.length,
    validRows: rowParts.length,
    uniqueParts: parts.length,
    insertedParts: parts.filter((part) => !existingPartNumbers.has(part.partNumber)).length,
    updatedParts: parts.filter((part) => existingPartNumbers.has(part.partNumber)).length,
    skippedRows: parsed.rows.length - rowParts.length,
    pricedParts: pricedParts.length,
    samplePartNumbers: parts.slice(0, 8).map((part) => part.partNumber),
  };
}
