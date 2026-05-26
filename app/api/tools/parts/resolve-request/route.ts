import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { queueCatalogPopulationFromParts } from "@/lib/tools/parts/catalog-population";
import { resolveDiagnosticPartCandidates } from "@/lib/tools/parts/diagnostic-part-search";
import { ingestOrRefreshPartNumber } from "@/lib/tools/parts/part-number-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const LocalCandidateSchema = z.object({
  canonicalPartNumber: z.string().optional(),
  canonicalPartName: z.string().optional(),
  normalizedCategory: z.string().nullable().optional(),
  normalizedSection: z.string().nullable().optional(),
  preferredSource: z.string().nullable().optional(),
  retailPrice: z.number().nullable().optional(),
  retailPriceText: z.string().nullable().optional(),
  retailAvailability: z.string().nullable().optional(),
  retailPricingUrl: z.string().nullable().optional(),
  retailPriceSource: z.string().nullable().optional(),
  retailPriceVerified: z.boolean().optional(),
});

const BodySchema = z.object({
  modelNumber: z.string().min(1),
  serialNumber: z.string().optional(),
  brand: z.string().optional(),
  productType: z.string().optional(),
  partNumber: z.string().optional(),
  partDescription: z.string().max(500).optional(),
  localCandidates: z.array(LocalCandidateSchema).max(10).optional(),
});

type PublicPart = {
  canonicalPartNumber: string;
  canonicalPartName: string;
  normalizedCategory?: string | null;
  normalizedSection?: string | null;
  preferredSource?: string | null;
  retailPrice?: number | null;
  retailPriceText?: string | null;
  retailAvailability?: string | null;
  retailPricingUrl?: string | null;
  retailPriceSource?: string | null;
  retailPriceVerified?: boolean;
};

type PartSearchCandidate = {
  candidateIndex: number;
  issue: string;
  partName: string;
  partNumber: string;
};

const resolveCatalogCandidates = resolveDiagnosticPartCandidates as (input: {
  brand?: string;
  modelNumber: string;
  productType?: string;
  candidates: PartSearchCandidate[];
}) => Promise<any[]>;

function cleanText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function positivePrice(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.round(numberValue * 100) / 100
    : null;
}

function priceFromRecord(record: any) {
  const payload = record?.pricePayload && typeof record.pricePayload === "object"
    ? record.pricePayload
    : null;
  const payloadPrice = positivePrice(payload?.retailPrice);
  if (payloadPrice) return payloadPrice;
  const cents = Number(record?.latestPriceCents);
  if (Number.isFinite(cents) && cents > 0) return Math.round(cents) / 100;

  // Scraper-emitted rows place price inside providerRows[].rawPayload.retailPrice (or .price/.sellPrice).
  const providerRows: any[] = Array.isArray(record?.providerRows)
    ? record.providerRows
    : Array.isArray(record?.provider_rows)
    ? record.provider_rows
    : [];
  for (const row of providerRows) {
    const rawPayload = row?.rawPayload || row?.raw_payload || {};
    const nested = rawPayload?.rawPayload || rawPayload?.raw_payload || rawPayload;
    const scraped = positivePrice(
      row?.retailPrice ?? row?.retail_price ?? row?.price ??
      nested?.retailPrice ?? nested?.retail_price ?? nested?.price ?? nested?.sellPrice
    );
    if (scraped) return scraped;
  }
  return null;
}

function pricedRecordToPart(record: any, fallback: z.infer<typeof LocalCandidateSchema>, source: string): PublicPart | null {
  const price = priceFromRecord(record);
  if (!record?.canonicalPartNumber || !price) return null;
  const payload = record?.pricePayload && typeof record.pricePayload === "object"
    ? record.pricePayload
    : {};

  return {
    canonicalPartNumber: record.canonicalPartNumber,
    canonicalPartName:
      cleanText(record.canonicalPartName) ||
      cleanText(fallback.canonicalPartName) ||
      "Appliance part",
    normalizedCategory: cleanText(record.normalizedCategory) || cleanText(fallback.normalizedCategory) || "Requested part",
    normalizedSection: cleanText(record.normalizedSection) || cleanText(fallback.normalizedSection) || "Catalog pricing",
    preferredSource: cleanText(record.lastSeenSource) || cleanText(fallback.preferredSource) || source,
    retailPrice: price,
    retailPriceText: cleanText(payload.retailPriceText) || `$${price.toFixed(2)}`,
    retailAvailability: cleanText(payload.retailAvailability) || cleanText(fallback.retailAvailability) || "Available for Order",
    retailPricingUrl: cleanText(payload.retailPricingUrl) || cleanText(fallback.retailPricingUrl) || null,
    retailPriceSource: cleanText(payload.retailPriceSource) || cleanText(record.priceSource) || source,
    retailPriceVerified: true,
  };
}

function targetedCandidateToPart(candidate: any): PublicPart | null {
  const partNumber = cleanText(candidate?.partNumber);
  const price = positivePrice(candidate?.retailPrice);
  if (!partNumber || !price || candidate?.retailPriceVerified !== true) return null;

  return {
    canonicalPartNumber: partNumber,
    canonicalPartName: cleanText(candidate.partName) || "Appliance part",
    normalizedCategory: "Requested part",
    normalizedSection: "Targeted catalog search",
    preferredSource: cleanText(candidate.source) || cleanText(candidate.retailPriceSource) || "targeted_part_search",
    retailPrice: price,
    retailPriceText: cleanText(candidate.retailPriceText) || `$${price.toFixed(2)}`,
    retailAvailability: cleanText(candidate.retailAvailability) || "Available for Order",
    retailPricingUrl: cleanText(candidate.retailPricingUrl) || cleanText(candidate.sourceUrl) || null,
    retailPriceSource: cleanText(candidate.retailPriceSource) || cleanText(candidate.source) || "targeted_part_search",
    retailPriceVerified: true,
  };
}

function dedupeParts(parts: PublicPart[]) {
  const byNumber = new Map<string, PublicPart>();
  for (const part of parts) {
    const key = cleanText(part.canonicalPartNumber).toUpperCase();
    if (!key) continue;
    const existing = byNumber.get(key);
    if (!existing || (!existing.retailPriceVerified && part.retailPriceVerified)) {
      byNumber.set(key, part);
    }
  }
  return [...byNumber.values()];
}

export async function POST(request: NextRequest) {
  try {
    const body = BodySchema.parse(await request.json());
    const modelNumber = cleanText(body.modelNumber).toUpperCase();
    const requestedPartNumber = cleanText(body.partNumber).toUpperCase();
    const requestedPartDescription = cleanText(body.partDescription);
    const localCandidates = body.localCandidates || [];

    const pricedLocalParts = (
      await Promise.all(
        localCandidates
          .filter((part) => cleanText(part.canonicalPartNumber))
          .slice(0, 6)
          .map(async (part) => {
            const record = await ingestOrRefreshPartNumber({
              partNumber: part.canonicalPartNumber,
              rawPartNumber: part.canonicalPartNumber,
              canonicalPartName: part.canonicalPartName || null,
              normalizedCategory: part.normalizedCategory || null,
              normalizedSection: part.normalizedSection || null,
              modelNumber,
              source: part.preferredSource || "part-finder-local-request",
              providerRows: [
                {
                  source: part.preferredSource || "part-finder-local-request",
                  rawPartNumber: part.canonicalPartNumber,
                  rawPartName: part.canonicalPartName || null,
                  rawCategory: part.normalizedCategory || null,
                  sectionName: part.normalizedSection || null,
                  modelNumber,
                },
              ],
            });
            return pricedRecordToPart(record, part, "supplier_catalog");
          })
      )
    ).filter((part): part is PublicPart => Boolean(part));

    let targetedParts: PublicPart[] = [];
    if (pricedLocalParts.length === 0 && (requestedPartDescription || requestedPartNumber)) {
      const candidates: PartSearchCandidate[] = [];
      if (requestedPartDescription) {
        candidates.push({
          candidateIndex: 0,
          issue: "customer part request",
          partName: requestedPartDescription,
          partNumber: "",
        });
      }
      if (requestedPartNumber) {
        candidates.push({
          candidateIndex: candidates.length,
          issue: "customer part number request",
          partName: requestedPartDescription || "requested appliance part",
          partNumber: requestedPartNumber,
        });
      }

      const resolved = await resolveCatalogCandidates({
        brand: body.brand || "",
        modelNumber,
        productType: body.productType || "",
        candidates,
      });

      targetedParts = dedupeParts(resolved.map(targetedCandidateToPart).filter((part): part is PublicPart => Boolean(part)));
    }

    const parts = dedupeParts([...pricedLocalParts, ...targetedParts]);

    if (parts.length > 0) {
      queueCatalogPopulationFromParts({
        modelNumber,
        canonicalModel: modelNumber,
        parts,
        source: targetedParts.length > 0 ? "part-finder-targeted-request" : "part-finder-priced-local-request",
      });
    }

    return NextResponse.json({
      parts,
      message:
        parts.length > 0
          ? "Verified catalog price found. Call now to confirm final pricing and availability."
          : "No verified catalog price was returned yet. Call now and Road Runner can confirm pricing and availability human-to-human.",
      source: targetedParts.length > 0 ? "targeted_catalog_search" : pricedLocalParts.length > 0 ? "local_catalog_price_refresh" : "unresolved",
    });
  } catch (error) {
    console.error("resolve part request route error", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid part request.",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resolve part request.",
      },
      { status: 500 }
    );
  }
}
