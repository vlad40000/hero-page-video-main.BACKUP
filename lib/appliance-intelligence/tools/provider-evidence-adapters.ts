import { buildBOMProviderEvidence } from "./bom-evidence";
import type { BOMProviderEvidence } from "./schemas";

// Canonical domain strings used as provider identity in evidence records.
export const SEARS_DOMAIN = "searspartsdirect.com";

export const KNOWN_DISTRIBUTOR_DOMAINS = new Set([
  "searspartsdirect.com",
  "partselect.com",
  "repairclinic.com",
  "reliableparts.com",
  "dlpartsco.com",
]);

// ---- Manufacturer adapter ----
// Used for GE, Whirlpool, Frigidaire, LG, Samsung, Bosch, and any future
// OEM adapters. Classification is "manufacturer" unless AI-extraction flags
// are present on the result, in which case it degrades to "inferred".

export function adaptManufacturerResult(
  result: unknown,
  modelNumber: string,
  options: { adapterKey?: string; brand?: string } = {}
): BOMProviderEvidence {
  const raw = result as any;
  // Prefer the explicit domain from the result. Fall back to a string that
  // contains "manufacturer" so buildBOMProviderEvidence's source check
  // classifies it correctly even without a domain name.
  const source =
    String(raw?.source ?? "").trim() ||
    (options.adapterKey ? `manufacturer:${options.adapterKey}` : "manufacturer");

  return buildBOMProviderEvidence({
    stageResult: raw,
    modelNumber,
    provider: source,
    stage: "manufacturer",
  });
}

// ---- Sears diagram-traversal adapter (Worker 5 + 6 pipeline) ----
// Wraps outputs from fetchDiagramIndex + fetchDiagramPartsWithRetry.
// Always forces provider = searspartsdirect.com so classification is
// "third_party" regardless of what individual part rows carry in their
// source field. If the traversal triggered the AI schematic miner,
// the ai-schematic-extraction / ai-search-fallback-used flags on the
// stageResult will still push the classification to "inferred" correctly.

export function adaptSearsTraversalResult(
  result: unknown,
  modelNumber: string
): BOMProviderEvidence {
  return buildBOMProviderEvidence({
    stageResult: result as any,
    modelNumber,
    provider: SEARS_DOMAIN,
    stage: "sears_traversal",
  });
}

// ---- Gap-fill distributor adapter ----
// Covers: searspartsdirect.com (catalog path), partselect.com,
// repairclinic.com, reliableparts.com, dlpartsco.com.
// Classification is "third_party" for deterministic catalog results.
// Degrades to "inferred" when ai-search-fallback-used flag is present.

export function adaptGapFillResult(
  result: unknown,
  modelNumber: string,
  domain: string
): BOMProviderEvidence {
  return buildBOMProviderEvidence({
    stageResult: result as any,
    modelNumber,
    provider: domain,
    stage: "primary_fallback",
  });
}
