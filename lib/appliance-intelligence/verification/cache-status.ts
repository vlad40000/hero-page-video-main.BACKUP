import type { BOMProviderEvidence } from "../tools/schemas";
import { evaluateBomPayloadCompleteness } from "./completeness";

export type DurableCacheStatus =
  | "parts_partial"
  | "parts_complete_pricing_missing"
  | "parts_complete_pricing_partial"
  | "bom_complete"
  | "no_result"
  | "failed"
  | "summary_only"
  | "skip_cache";

export type NormalizeCacheStatusResult = {
  durableStatus: DurableCacheStatus;
  cacheEligibleStatus: boolean;
  reason: string;
};

function hasValidEvidence(payload: any): boolean {
  const parts = Array.isArray(payload?.parts) ? payload.parts : [];
  const sectionCount = Number(payload?.completeness?.sectionCount ?? 0);
  const evidences: BOMProviderEvidence[] = Array.isArray(payload?.providerEvidences)
    ? payload.providerEvidences
    : [];

  if (parts.length === 0) return false;
  if (sectionCount === 0) return false;
  if (evidences.length === 0) return false;

  const hasNonInferred = evidences.some(
    (e) => e.sourceTruthKind === "manufacturer" || e.sourceTruthKind === "third_party"
  );
  const reviewConfidence = Number(payload?.review?.confidence ?? 0);
  const hasExplicitReview = reviewConfidence >= 70;

  return hasNonInferred || hasExplicitReview;
}

export function normalizeCacheStatus(payload: unknown): NormalizeCacheStatusResult {
  const raw = payload as any;
  const status = String(raw?.retrievalState ?? raw?.retrieval_state ?? raw?.status ?? "").toLowerCase().trim();
  const parts = Array.isArray(raw?.parts) ? raw.parts : [];
  const sectionCount = Number(raw?.completeness?.sectionCount ?? 0);
  const gate = evaluateBomPayloadCompleteness(raw);

  if (parts.length === 0) {
    if (status === "failed" || gate.retrievalState === "failed") {
      return {
        durableStatus: "failed",
        cacheEligibleStatus: false,
        reason: "blocked:failed_empty_parts",
      };
    }

    return {
      durableStatus: "no_result",
      cacheEligibleStatus: false,
      reason: "blocked:empty_parts",
    };
  }

  switch (gate.retrievalState) {
    case "bom_complete":
      return {
        durableStatus: "bom_complete",
        cacheEligibleStatus: true,
        reason: "gate:bom_complete",
      };

    case "parts_complete_pricing_partial":
      return {
        durableStatus: "parts_complete_pricing_partial",
        cacheEligibleStatus: true,
        reason: "gate:parts_complete_pricing_partial",
      };

    case "parts_complete_pricing_missing":
      return {
        durableStatus: "parts_complete_pricing_missing",
        cacheEligibleStatus: true,
        reason: "gate:parts_complete_pricing_missing",
      };

    case "parts_partial":
      return {
        durableStatus: "parts_partial",
        cacheEligibleStatus: true,
        reason: "gate:parts_partial",
      };
  }

  switch (status) {
    case "bom_complete":
      return {
        durableStatus: "bom_complete",
        cacheEligibleStatus: true,
        reason: "passthrough:bom_complete",
      };

    case "parts_complete_pricing_missing":
      return {
        durableStatus: "parts_complete_pricing_missing",
        cacheEligibleStatus: true,
        reason: "passthrough:parts_complete_pricing_missing",
      };

    case "parts_complete_pricing_partial":
      return {
        durableStatus: "parts_complete_pricing_partial",
        cacheEligibleStatus: true,
        reason: "passthrough:parts_complete_pricing_partial",
      };

    case "parts_partial":
      return {
        durableStatus: "parts_partial",
        cacheEligibleStatus: true,
        reason: "passthrough:parts_partial",
      };

    case "complete":
    case "target_met":
      if (!hasValidEvidence(raw)) {
        return {
          durableStatus: "parts_partial",
          cacheEligibleStatus: true,
          reason: `downgraded:${status}:weak_evidence`,
        };
      }
      return {
        durableStatus: "parts_complete_pricing_missing",
        cacheEligibleStatus: true,
        reason: `mapped:${status}:parts_complete_pricing_unknown`,
      };

    case "partial":
      return {
        durableStatus: "parts_partial",
        cacheEligibleStatus: true,
        reason: "mapped:partial",
      };

    case "below_floor":
      if (parts.length > 0 && sectionCount > 0) {
        return {
          durableStatus: "parts_partial",
          cacheEligibleStatus: true,
          reason: "mapped:below_floor:has_parts_sections",
        };
      }
      return {
        durableStatus: "no_result",
        cacheEligibleStatus: false,
        reason: "mapped:below_floor:no_parts_or_sections",
      };

    case "empty":
      return {
        durableStatus: "no_result",
        cacheEligibleStatus: false,
        reason: "mapped:empty",
      };

    case "no_result":
      return {
        durableStatus: "no_result",
        cacheEligibleStatus: false,
        reason: "passthrough:no_result",
      };

    case "provider_exhausted":
      return {
        durableStatus: "no_result",
        cacheEligibleStatus: false,
        reason: "mapped:provider_exhausted",
      };

    case "failed":
      return {
        durableStatus: "failed",
        cacheEligibleStatus: false,
        reason: "passthrough:failed",
      };

    case "summary_only":
      return {
        durableStatus: "summary_only",
        cacheEligibleStatus: false,
        reason: "passthrough:summary_only",
      };

    case "variant_resolution_needed":
      return {
        durableStatus: "skip_cache",
        cacheEligibleStatus: false,
        reason: "skip:variant_resolution_needed",
      };

    default:
      return {
        durableStatus: "skip_cache",
        cacheEligibleStatus: false,
        reason: `skip:unknown_status:${status || "missing"}`,
      };
  }
}