import "server-only";

import { after } from "next/server";

import { normalizeModelNumber } from "@/lib/tools/parts/normalize";
import { normalizePartNumber } from "@/lib/tools/parts/http";
import {
  applyEncompassPriceSnapshot,
  upsertPartNumbersForModel,
} from "@/lib/tools/parts/part-number-store";

type PartLike = Record<string, unknown>;

type QueueCatalogPopulationInput = {
  modelNumber?: string | null;
  canonicalModel?: string | null;
  parts?: unknown;
  source: string;
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const candidate = text(value);
    if (candidate) return candidate;
  }
  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function numberOrNull(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function normalizeCatalogPartInput(part: PartLike, fallbackModel: string, source: string) {
  const partNumber = normalizePartNumber(
    firstText(
      part.canonicalPartNumber,
      part.canonical_part_number,
      part.partNumber,
      part.part_number,
      part.rawPartNumber,
      part.raw_part_number
    ) || ""
  );

  if (!partNumber) return null;

  const providerRows = asArray(part.providerRows || part.provider_rows);

  return {
    partNumber,
    canonicalPartNumber: partNumber,
    rawPartNumber:
      firstText(part.rawPartNumber, part.raw_part_number, part.partNumber, part.part_number) || partNumber,
    canonicalPartName:
      firstText(
        part.canonicalPartName,
        part.canonical_part_name,
        part.partName,
        part.part_name,
        part.name,
        part.rawPartName,
        part.raw_part_name
      ) || "Appliance part",
    normalizedCategory: firstText(part.normalizedCategory, part.normalized_category, part.category, part.rawCategory),
    normalizedSection: firstText(part.normalizedSection, part.normalized_section, part.section, part.sectionName),
    observedModels: [fallbackModel].filter(Boolean),
    substituteChain: asArray(part.substituteChain || part.substitute_chain || part.substitutes || part.substitutePartNumbers)
      .map((value) => normalizePartNumber(text(value)))
      .filter(Boolean),
    providerRows: providerRows.length ? providerRows : [part],
    sourceConfidence: {
      [firstText(part.preferredSource, part.preferred_source, part.source, source) || source]: {
        observed: true,
        catalogPopulation: true,
      },
    },
    firstSeenSource: firstText(part.preferredSource, part.preferred_source, part.source, source) || source,
    lastSeenSource: firstText(part.preferredSource, part.preferred_source, part.source, source) || source,
    retailPrice: numberOrNull(part.retailPrice),
    retailPriceText: firstText(part.retailPriceText),
    retailPriceSource: firstText(part.retailPriceSource, part.retail_price_source, part.priceSource, source),
    retailPriceVerified: part.retailPriceVerified === true || part.retail_price_verified === true,
  };
}

function scheduleAfterResponse(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task();
  }
}

export function queueCatalogPopulationFromParts(input: QueueCatalogPopulationInput) {
  const parts = asArray(input.parts).filter((part): part is PartLike => typeof part === "object" && part !== null);
  if (!parts.length) return;

  const model = normalizeModelNumber(input.canonicalModel || input.modelNumber || "");
  const rows = parts
    .map((part) => normalizeCatalogPartInput(part, model, input.source))
    .filter((part): part is NonNullable<ReturnType<typeof normalizeCatalogPartInput>> => Boolean(part));

  if (!rows.length) return;

  scheduleAfterResponse(async () => {
    try {
      await upsertPartNumbersForModel(model, rows, input.source);

      const pricedRows = rows.filter((row) => row.retailPrice);
      const applyPriceSnapshot = applyEncompassPriceSnapshot as unknown as (
        partNumber: string,
        snapshot: Record<string, unknown>
      ) => Promise<unknown>;

      if (pricedRows.length) {
        await Promise.all(
          pricedRows.map((row) =>
            applyPriceSnapshot(row.partNumber, {
              retailPrice: row.retailPrice,
              retailPriceText: row.retailPriceText || `$${row.retailPrice?.toFixed(2)}`,
              retailPriceSource: row.retailPriceSource || input.source,
              retailPriceVerified: row.retailPriceVerified,
              retailPricedAt: new Date().toISOString(),
            })
          )
        );
      }
    } catch (error) {
      console.error("catalog population background task failed", error);
    }
  });
}
