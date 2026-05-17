import crypto from "crypto";
import { put } from "@vercel/blob";

import type {
  ContinueSearchInput,
  ExtractedModelPayload,
  PartFinderPart,
  PartFinderResponse,
  PartFinderSource,
  PartFinderStatus,
  StartSearchInput,
} from "./types";

import { startApplianceSearchSession, continueApplianceSearchSession } from "@/lib/tools/parts/parts-service";
import { normalizeModelNumber } from "@/lib/tools/parts/normalize";
import { memoryCache } from "@/lib/tools/parts/mem-cache";
import { findModelInStore, isReusableModelCache } from "@/lib/tools/parts/model-store";
import { ingestOrRefreshPartNumber } from "@/lib/tools/parts/part-number-store";
import { queueCatalogPopulationFromParts } from "@/lib/tools/parts/catalog-population";
import { decodeSerialNumber } from "@/lib/tools/parts/serial/decoder";
import { filterPartsBySerialApplicability } from "@/lib/tools/parts/serial/applicability";
import { extractNameplateFromImage } from "@/lib/tools/parts/gemini";
import { saveNameplateExtraction, findExtractionByHash } from "@/lib/tools/parts/nameplate-extraction";
import { resolveCanonicalModel } from "@/lib/tools/parts/model-resolution";
import { normalizeSerialNumber } from "@/lib/tools/parts/serial/normalize";

function normalizeStatus(status: unknown): PartFinderStatus {
  const value = String(status || "").trim().toLowerCase();

  if (value === "variant_resolution_needed") return "variant_resolution_needed";
  if (value === "bom_complete") return "bom_complete";
  if (value === "parts_partial") return "parts_partial";
  if (value === "needs_fallback") return "needs_fallback";
  if (value === "no_result") return "no_result";
  if (value === "provider_exhausted") return "provider_exhausted";

  // donor internal statuses
  if (value === "complete" || value === "target_met") return "bom_complete";
  if (value === "partial" || value === "below_floor") return "parts_partial";
  if (value === "empty") return "no_result";

  return "no_result";
}

function normalizeSources(input: unknown): PartFinderSource[] {
  if (!Array.isArray(input)) return [];

  return input.reduce((acc: PartFinderSource[], source) => {
    if (!source || typeof source !== "object") return acc;

    const record = source as Record<string, unknown>;
    const title = String(record.title || record.label || record.uri || "").trim();
    const uri = String(record.uri || "").trim();

    if (title || uri) {
      acc.push({
        title: title || uri,
        uri: uri || "",
      });
    }
    return acc;
  }, []);
}

function numberOrNull(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue * 100) / 100 : null;
}

function normalizeAvailabilityLabel(value: unknown): string | null {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (/^in\s*stock$/i.test(text) || /^pia$/i.test(text)) return "Available for Order";
  return text;
}

function firstProviderRow(record: Record<string, unknown>): Record<string, unknown> {
  const rows = Array.isArray(record.providerRows)
    ? record.providerRows
    : Array.isArray(record.provider_rows)
    ? record.provider_rows
    : [];
  const first = rows.find((row) => row && typeof row === "object");
  return first ? (first as Record<string, unknown>) : {};
}

function priceFromRecord(record: Record<string, unknown>, providerRow: Record<string, unknown>): number | null {
  const rawPayload = providerRow.rawPayload || providerRow.raw_payload;
  const nestedRawPayload =
    rawPayload && typeof rawPayload === "object"
      ? (rawPayload as Record<string, unknown>).rawPayload ||
        (rawPayload as Record<string, unknown>).raw_payload
      : null;

  return numberOrNull(
    record.retailPrice ||
      record.retail_price ||
      providerRow.retailPrice ||
      providerRow.retail_price ||
      providerRow.price ||
      (rawPayload as Record<string, unknown> | undefined)?.price ||
      (nestedRawPayload as Record<string, unknown> | undefined)?.price ||
      (nestedRawPayload as Record<string, unknown> | undefined)?.sellPrice
  );
}

function normalizeParts(input: unknown): PartFinderPart[] {
  if (!Array.isArray(input)) return [];

  return input.reduce((acc: PartFinderPart[], part) => {
    if (!part || typeof part !== "object") return acc;

    const record = part as Record<string, unknown>;
    const providerRow = firstProviderRow(record);
    const retailPrice = priceFromRecord(record, providerRow);
    const rawPayload = providerRow.rawPayload || providerRow.raw_payload;
    const nestedRawPayload =
      rawPayload && typeof rawPayload === "object"
        ? (rawPayload as Record<string, unknown>).rawPayload ||
          (rawPayload as Record<string, unknown>).raw_payload
        : null;
    const retailAvailability = normalizeAvailabilityLabel(
      record.retailAvailability ||
        record.retail_availability ||
        providerRow.retailAvailability ||
        providerRow.availabilityStatus ||
        (rawPayload as Record<string, unknown> | undefined)?.availabilityStatus ||
        (nestedRawPayload as Record<string, unknown> | undefined)?.availabilityStatus ||
        ""
    );
    const retailPricingUrl = String(
      record.retailPricingUrl ||
        record.retail_pricing_url ||
        providerRow.evidenceUrl ||
        providerRow.sectionUrl ||
        (rawPayload as Record<string, unknown> | undefined)?.evidenceUrl ||
        (rawPayload as Record<string, unknown> | undefined)?.sectionUrl ||
        ""
    ).trim();
    const retailPriceSource = String(
      record.retailPriceSource ||
        record.retail_price_source ||
        providerRow.source ||
        record.preferredSource ||
        record.preferred_source ||
        record.source ||
        ""
    ).trim();

    const canonicalPartNumber = String(
      record.canonicalPartNumber ||
        record.canonical_part_number ||
        record.partNumber ||
        record.rawPartNumber ||
        record.raw_part_number ||
        ""
    )
      .trim()
      .toUpperCase();

    if (!canonicalPartNumber) return acc;

    acc.push({
      canonicalPartNumber,
      canonicalPartName: String(
        record.canonicalPartName ||
          record.canonical_part_name ||
          record.name ||
          record.partName ||
          record.rawPartName ||
          record.raw_part_name ||
          "Unnamed part"
      ).trim(),
      normalizedCategory: String(
        record.normalizedCategory ||
          record.normalized_category ||
          record.category ||
          record.rawCategory ||
          record.raw_category ||
          ""
      ).trim() || null,
      normalizedSection: String(
        record.normalizedSection ||
          record.normalized_section ||
          record.section ||
          record.sectionName ||
          record.section_name ||
          ""
      ).trim() || null,
      preferredSource: String(
        record.preferredSource || record.preferred_source || record.source || ""
      ).trim() || null,
      serialApplicability: Array.isArray(record.serialApplicability)
        ? (record.serialApplicability as string[])
        : Array.isArray(record.serial_applicability)
        ? (record.serial_applicability as string[])
        : null,
      conflictFlags: Array.isArray(record.conflictFlags)
        ? record.conflictFlags
        : Array.isArray(record.conflict_flags)
        ? record.conflict_flags
        : [],
      retailPrice,
      retailPriceText:
        typeof record.retailPriceText === "string"
          ? record.retailPriceText
          : typeof record.retail_price_text === "string"
          ? record.retail_price_text
          : retailPrice
          ? `$${retailPrice.toFixed(2)}`
          : null,
      retailAvailability,
      retailPricingUrl: retailPricingUrl || null,
      retailPriceSource: retailPriceSource || null,
      retailPriceVerified: Boolean(record.retailPriceVerified || record.retail_price_verified || retailPrice),
    });

    return acc;
  }, []);
}

function toPublicResponse(raw: Record<string, unknown>): PartFinderResponse {
  const parts = normalizeParts(raw.parts);
  const sources = normalizeSources(raw.sources);

  return {
    status: normalizeStatus(raw.status),
    message: String(raw.message || raw.summary || "Search complete.").trim(),
    searchSessionId: raw.searchSessionId ? String(raw.searchSessionId) : null,
    hasMore: Boolean(raw.hasMore),
    nextStage: raw.nextStage ? String(raw.nextStage) : null,

    modelNumber: raw.modelNumber ? String(raw.modelNumber) : null,
    canonicalModel: raw.canonicalModel
      ? String(raw.canonicalModel)
      : raw.canonical_model
      ? String(raw.canonical_model)
      : null,
    brand: raw.brand ? String(raw.brand) : null,
    productType: raw.productType
      ? String(raw.productType)
      : raw.product_type
      ? String(raw.product_type)
      : null,
    serialNumberUsed: raw.serialNumberUsed ? String(raw.serialNumberUsed) : null,

    parts,
    partsShown:
      typeof raw.partsShown === "number" ? raw.partsShown : parts.length,
    partsKnownSoFar:
      typeof raw.partsKnownSoFar === "number"
        ? raw.partsKnownSoFar
        : typeof raw.partsSupersetCount === "number"
        ? raw.partsSupersetCount
        : parts.length,
    partsFilteredCount:
      typeof raw.partsFilteredCount === "number" ? raw.partsFilteredCount : 0,

    sources,

    review:
      raw.review && typeof raw.review === "object"
        ? {
            summary:
              typeof (raw.review as Record<string, unknown>).summary === "string"
                ? String((raw.review as Record<string, unknown>).summary)
                : undefined,
            confidence:
              typeof (raw.review as Record<string, unknown>).confidence === "string"
                ? String((raw.review as Record<string, unknown>).confidence)
                : undefined,
          }
        : null,

    candidates: Array.isArray(raw.candidates)
      ? (raw.candidates as Array<Record<string, unknown>>).map((candidate) => ({
          revision: String(candidate.revision || "").trim(),
          label: String(candidate.label || candidate.revision || "").trim(),
          confidence:
            typeof candidate.confidence === "number" ? candidate.confidence : undefined,
        }))
      : undefined,
    reason: raw.reason ? String(raw.reason) : undefined,
    cache: raw.cache ? String(raw.cache) : undefined,
    applicabilityMode: raw.applicabilityMode ? String(raw.applicabilityMode) : undefined,
    completeness: raw.completeness,
    providerEvidences: Array.isArray(raw.providerEvidences) ? raw.providerEvidences : undefined,
    retrievalTrace: raw.retrievalTrace,
    providerTrace: Array.isArray(raw.providerTrace)
      ? raw.providerTrace
      : raw.retrievalTrace && typeof raw.retrievalTrace === "object" && Array.isArray((raw.retrievalTrace as Record<string, unknown>).providerAttempts)
      ? ((raw.retrievalTrace as Record<string, unknown>).providerAttempts as unknown[])
      : undefined,
  };
}

function queuePartFinderCatalogPopulation(response: PartFinderResponse, source: string) {
  queueCatalogPopulationFromParts({
    modelNumber: response.modelNumber,
    canonicalModel: response.canonicalModel,
    parts: response.parts,
    source,
  });
}

export async function startPartsSearch(
  input: StartSearchInput
): Promise<PartFinderResponse> {
  const trimmedModel = String(input.modelNumber || "").trim();
  if (!trimmedModel) {
    throw new Error("A model number is required.");
  }

  const norm = normalizeModelNumber(trimmedModel);
  const requestedPartNumber = String((input as Record<string, unknown>).partNumber || "").trim();
  const requestedPartDescription = String((input as Record<string, unknown>).partDescription || "").trim();

  if (requestedPartNumber) {
    void ingestOrRefreshPartNumber({
      partNumber: requestedPartNumber,
      modelNumber: trimmedModel,
      source: "part-finder-search",
    }).catch(() => {});
  }

  // Match donor route behavior exactly: fast cache reuse first.
  const memHit = memoryCache.get(norm);
  if (
    memHit &&
    typeof memHit === "object" &&
    Array.isArray((memHit as Record<string, unknown>).parts) &&
    isReusableModelCache(memHit) &&
    !input.exhaustiveMode
  ) {
    const memRecord = memHit as Record<string, unknown>;
    const filterResult = filterPartsBySerialApplicability(
      Array.isArray(memRecord.parts) ? memRecord.parts : [],
      {
        serialNumber: input.serialNumber,
        serialProfile: memRecord.serialProfile,
      }
    );

    const response = toPublicResponse({
      ...memRecord,
      modelNumber: trimmedModel,
      parts: filterResult.applicableParts,
      cache: "memory-hit",
      status: memRecord.status || "complete",
      hasMore: false,
      searchSessionId: null,
      serialNumberUsed: input.serialNumber || null,
      applicabilityMode: filterResult.applicabilityMode,
      partsShown: filterResult.applicableParts.length,
      partsFilteredCount: filterResult.filteredOutParts.length,
    });
    queuePartFinderCatalogPopulation(response, "part-finder-memory-hit");
    return response;
  }

  const dbHit = await findModelInStore(norm);
  if (
    dbHit &&
    Array.isArray(dbHit.parts) &&
    isReusableModelCache(dbHit) &&
    !input.exhaustiveMode
  ) {
    let serialProfile: unknown = null;

    if (input.serialNumber) {
      serialProfile = await decodeSerialNumber(input.serialNumber, {
        brand: input.brand || null,
        model: dbHit.canonicalModel || trimmedModel,
      });
    }

    const filterResult = filterPartsBySerialApplicability(dbHit.parts || [], {
      serialNumber: input.serialNumber,
      serialProfile,
    });

    const payload = {
      ...dbHit,
      modelNumber: trimmedModel,
      serialNumberUsed: input.serialNumber || null,
      serialProfile,
      parts: filterResult.applicableParts,
      cache: "db-hit",
      status: dbHit.status || (dbHit.parts.length > 0 ? "parts_partial" : "no_result"),
      hasMore: false,
      searchSessionId: null,
      applicabilityMode: filterResult.applicabilityMode,
      partsShown: filterResult.applicableParts.length,
      partsFilteredCount: filterResult.filteredOutParts.length,
    };

    memoryCache.set(norm, payload);

    const response = toPublicResponse(payload as Record<string, unknown>);
    queuePartFinderCatalogPopulation(response, "part-finder-db-hit");
    return response;
  }

  const live = await startApplianceSearchSession({
    modelNumber: trimmedModel,
    serialNumber: String(input.serialNumber || "").trim(),
    partDescription: requestedPartDescription,
    brand: input.brand || null,
    productType: input.productType || null,
    exhaustiveMode: Boolean(input.exhaustiveMode),
  } as any);

  const response = toPublicResponse({
    ...(live as Record<string, unknown>),
    modelNumber: trimmedModel,
    serialNumberUsed: input.serialNumber || null,
  });
  queuePartFinderCatalogPopulation(response, "part-finder-live-search");
  return response;
}

export async function continuePartsSearch(
  input: ContinueSearchInput
): Promise<PartFinderResponse> {
  if (!input.searchSessionId) {
    throw new Error("A searchSessionId is required.");
  }

  const data = await continueApplianceSearchSession({
    searchSessionId: input.searchSessionId,
    revision: input.revision || null,
  } as any);

  const response = toPublicResponse(data as Record<string, unknown>);
  queuePartFinderCatalogPopulation(response, "part-finder-continue-search");
  return response;
}

export async function extractModelFromImage(file: File): Promise<ExtractedModelPayload> {
  if (!file) {
    throw new Error("An image file is required.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  const existing = await findExtractionByHash(base64Image);
  if (existing) {
    return {
      modelNumber: existing.raw_model || null,
      serialNumber: existing.raw_serial || null,
      brand: existing.brand || null,
      productType: existing.product_type || null,
      engineeringCode: existing.engineering_code || null,
      normalizedModel: existing.raw_model ? normalizeModelNumber(existing.raw_model) : null,
      normalizedSerial: existing.raw_serial ? normalizeSerialNumber(existing.raw_serial) : null,
      imageUrl: existing.image_url || null,
      cache: "nameplate-hit",
    };
  }

  const extracted = await extractNameplateFromImage(base64Image, mimeType);

  let imageUrl: string | null = null;

  try {
    const blob = await put(
      `nameplates/${crypto.randomUUID()}-${file.name || "rating-plate.jpg"}`,
      file,
      { access: "public" }
    );
    imageUrl = blob.url;
  } catch {
    // Blob storage is optional for Phase 1.
  }

  await saveNameplateExtraction({
    imageBase64: base64Image,
    brand: extracted.brand || null,
    rawModel: extracted.modelNumber || null,
    rawSerial: extracted.serialNumber || null,
    productType: extracted.productType || null,
    engineeringCode: extracted.engineeringCode || null,
    confidence: extracted.confidence || {},
    imageUrl,
  }).catch(() => {});

  if (extracted.modelNumber) {
    void resolveCanonicalModel(extracted.modelNumber).catch(() => {});
  }

  return {
    modelNumber: extracted.modelNumber || null,
    serialNumber: extracted.serialNumber || null,
    brand: extracted.brand || null,
    productType: extracted.productType || null,
    engineeringCode: extracted.engineeringCode || null,
    normalizedModel: extracted.modelNumber ? normalizeModelNumber(extracted.modelNumber) : null,
    normalizedSerial: extracted.serialNumber ? normalizeSerialNumber(extracted.serialNumber) : null,
    imageUrl,
    cache: "not-cached",
  };
}
