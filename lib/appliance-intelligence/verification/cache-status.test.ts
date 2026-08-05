import { describe, it, expect } from "vitest";
import { normalizeCacheStatus } from "./cache-status";

const nonInferredEvidence = {
  provider: "manufacturer",
  modelNumber: "WF2000",
  sourceUrl: null,
  sourceTruthKind: "manufacturer" as const,
  retrievalState: "success" as const,
  confidence: 90,
  assemblySections: [{ sectionName: "Drum", expectedPartCount: 5, observedPartCount: 5 }],
  parts: ["WP123"],
};

const inferredEvidence = {
  provider: "ai_bot",
  modelNumber: "WF2000",
  sourceUrl: null,
  sourceTruthKind: "inferred" as const,
  retrievalState: "partial" as const,
  confidence: 55,
  assemblySections: [{ sectionName: "General Assembly", expectedPartCount: 3, observedPartCount: 3 }],
  parts: ["AI001"],
};

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    parts: [{ partNumber: "X1" }],
    completeness: { sectionCount: 3 },
    providerEvidences: [nonInferredEvidence],
    ...overrides,
  };
}

describe("normalizeCacheStatus", () => {
  it("partial maps to parts_partial and is cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "partial" }));
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.cacheEligibleStatus).toBe(true);
  });

  it("below_floor with valid parts and sections maps to parts_partial", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "below_floor",
        parts: [{ partNumber: "X1" }, { partNumber: "X2" }],
        completeness: { sectionCount: 2 },
      })
    );
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.cacheEligibleStatus).toBe(true);
  });

  it("empty maps to no_result and is not cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "empty" }));
    expect(result.durableStatus).toBe("no_result");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("variant_resolution_needed maps to skip_cache and is not cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "variant_resolution_needed" }));
    expect(result.durableStatus).toBe("skip_cache");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("complete with weak evidence (no providerEvidences) does not become bom_complete", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "complete",
        providerEvidences: [],
      })
    );
    expect(result.durableStatus).not.toBe("bom_complete");
    expect(result.cacheEligibleStatus).toBe(true); // still writable as parts_partial
    expect(result.durableStatus).toBe("parts_partial");
  });

  it("complete with valid non-inferred evidence becomes bom_complete", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "complete",
        providerEvidences: [nonInferredEvidence],
      })
    );
    expect(result.durableStatus).toBe("bom_complete");
    expect(result.cacheEligibleStatus).toBe(true);
  });

  it("target_met with valid evidence becomes bom_complete", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "target_met",
        providerEvidences: [nonInferredEvidence],
      })
    );
    expect(result.durableStatus).toBe("bom_complete");
    expect(result.cacheEligibleStatus).toBe(true);
  });

  it("AI-only evidence (all inferred) cannot become bom_complete", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "complete",
        providerEvidences: [inferredEvidence, inferredEvidence],
      })
    );
    expect(result.durableStatus).not.toBe("bom_complete");
    expect(result.durableStatus).toBe("parts_partial");
  });

  it("unknown status maps to skip_cache and is never cache-eligible", () => {
    for (const unknownStatus of ["enriched", "processing", "zebra", "", null, undefined]) {
      const result = normalizeCacheStatus(makePayload({ status: unknownStatus }));
      expect(result.durableStatus).toBe("skip_cache");
      expect(result.cacheEligibleStatus).toBe(false);
    }
  });

  // Additional boundary cases

  it("below_floor with zero parts maps to no_result", () => {
    const result = normalizeCacheStatus(
      makePayload({ status: "below_floor", parts: [], completeness: { sectionCount: 3 } })
    );
    expect(result.durableStatus).toBe("no_result");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("below_floor with zero sections maps to no_result", () => {
    const result = normalizeCacheStatus(
      makePayload({ status: "below_floor", completeness: { sectionCount: 0 } })
    );
    expect(result.durableStatus).toBe("no_result");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("bom_complete passthrough is cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "bom_complete" }));
    expect(result.durableStatus).toBe("bom_complete");
    expect(result.cacheEligibleStatus).toBe(true);
  });

  it("parts_partial passthrough is cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "parts_partial" }));
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.cacheEligibleStatus).toBe(true);
  });

  it("failed passthrough is not cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "failed" }));
    expect(result.durableStatus).toBe("failed");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("summary_only passthrough is not cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "summary_only" }));
    expect(result.durableStatus).toBe("summary_only");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("complete with only inferred + unknown evidence does not become bom_complete", () => {
    const unknownEvidence = { ...inferredEvidence, sourceTruthKind: "unknown" as const };
    const result = normalizeCacheStatus(
      makePayload({
        status: "complete",
        providerEvidences: [inferredEvidence, unknownEvidence],
      })
    );
    expect(result.durableStatus).toBe("parts_partial");
  });

  it("complete with explicit review confidence >= 70 can become bom_complete even without manufacturer evidence", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "complete",
        providerEvidences: [inferredEvidence],
        review: { confidence: 85 },
      })
    );
    expect(result.durableStatus).toBe("bom_complete");
    expect(result.cacheEligibleStatus).toBe(true);
  });

  it("complete with review confidence below 70 and AI-only evidence does not become bom_complete", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "complete",
        providerEvidences: [inferredEvidence],
        review: { confidence: 60 },
      })
    );
    expect(result.durableStatus).toBe("parts_partial");
  });
});
