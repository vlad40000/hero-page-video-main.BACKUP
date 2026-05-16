import { evaluateSourceTruth } from "./source-truth";
import { evaluateCompleteness } from "./completeness";

export type CacheEligibilityResult = {
  eligible: boolean;
  reason: string;
  severity: "info" | "warning" | "blocked";
};

export function evaluateModelCacheEligibility(payload: unknown): CacheEligibilityResult {
  const parts = Array.isArray((payload as any)?.parts) ? (payload as any).parts : [];
  const status = String((payload as any)?.status || "").toLowerCase();

  if (parts.length === 0) {
    return { eligible: false, reason: "empty_parts", severity: "blocked" };
  }

  if (["no_result", "failed", "summary_only"].includes(status)) {
    return { eligible: false, reason: `blocked_status:${status}`, severity: "blocked" };
  }

  if (!evaluateCompleteness(payload)) {
    return { eligible: false, reason: "missing_assembly_sections", severity: "blocked" };
  }

  if (!evaluateSourceTruth(payload)) {
    return { eligible: false, reason: "missing_source_truth", severity: "blocked" };
  }

  return { eligible: true, reason: "eligible", severity: "info" };
}
