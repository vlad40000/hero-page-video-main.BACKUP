import { evaluateSourceTruth } from "./source-truth";
import { evaluateBomPayloadCompleteness } from "./completeness";

export type CacheEligibilityResult = {
  eligible: boolean;
  reason: string;
  severity: "info" | "warning" | "blocked";
};

const DURABLE_CACHE_STATES = new Set([
  "parts_partial",
  "parts_complete_pricing_missing",
  "parts_complete_pricing_partial",
  "bom_complete",
]);

export function evaluateModelCacheEligibility(payload: unknown): CacheEligibilityResult {
  const data = payload as any;
  const parts = Array.isArray(data?.parts) ? data.parts : [];

  if (parts.length === 0) {
    return { eligible: false, reason: "empty_parts", severity: "blocked" };
  }

  const gate = evaluateBomPayloadCompleteness(data);
  const state = gate.retrievalState;

  if (!DURABLE_CACHE_STATES.has(state)) {
    return {
      eligible: false,
      reason: `blocked_state:${state}`,
      severity: "blocked",
    };
  }

  if (!evaluateSourceTruth(data)) {
    return { eligible: false, reason: "missing_source_truth", severity: "blocked" };
  }

  if (!gate.cacheReusable) {
    return {
      eligible: true,
      reason: `durable_partial:${state}`,
      severity: "warning",
    };
  }

  return { eligible: true, reason: "eligible", severity: "info" };
}