import { describe, it, expect } from "vitest";
import { buildRetrievalRunRecord, classifyRetrievalEvent } from "./retrieval-audit";
import type { NormalizeCacheStatusResult } from "../verification/cache-status";

// ----- fixtures -----

const accepted: NormalizeCacheStatusResult = {
  durableStatus: "parts_partial",
  cacheEligibleStatus: true,
  reason: "passthrough:parts_partial",
};

const skipped: NormalizeCacheStatusResult = {
  durableStatus: "skip_cache",
  cacheEligibleStatus: false,
  reason: "skip:unknown_status:enriched",
};

const promoted: NormalizeCacheStatusResult = {
  durableStatus: "bom_complete",
  cacheEligibleStatus: true,
  reason: "promoted:complete:valid_evidence",
};

const downgraded: NormalizeCacheStatusResult = {
  durableStatus: "parts_partial",
  cacheEligibleStatus: true,
  reason: "downgraded:complete:weak_evidence",
};

const variantBlocked: NormalizeCacheStatusResult = {
  durableStatus: "skip_cache",
  cacheEligibleStatus: false,
  reason: "skip:variant_resolution_needed",
};

const noResult: NormalizeCacheStatusResult = {
  durableStatus: "no_result",
  cacheEligibleStatus: false,
  reason: "mapped:empty",
};

const failed: NormalizeCacheStatusResult = {
  durableStatus: "failed",
  cacheEligibleStatus: false,
  reason: "passthrough:failed",
};

const manufacturerEvidence = {
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
  ...manufacturerEvidence,
  provider: "ai_bot",
  sourceTruthKind: "inferred" as const,
  retrievalState: "partial" as const,
  confidence: 55,
};

// ----- buildRetrievalRunRecord -----

describe("buildRetrievalRunRecord", () => {
  it("extracts partsCount from payload.parts", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: {
        status: "parts_partial",
        parts: [{ partNumber: "A" }, { partNumber: "B" }],
        completeness: { sectionCount: 3 },
        providerEvidences: [],
      },
      normalized: accepted,
    });
    expect(record.partsCount).toBe(2);
  });

  it("extracts sectionCount from payload.completeness.sectionCount", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: {
        status: "parts_partial",
        parts: [{ partNumber: "A" }],
        completeness: { sectionCount: 7 },
        providerEvidences: [],
      },
      normalized: accepted,
    });
    expect(record.sectionCount).toBe(7);
  });

  it("sets hasNonInferredEvidence true when manufacturer evidence is present", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: {
        status: "complete",
        parts: [{ partNumber: "A" }],
        completeness: { sectionCount: 3 },
        providerEvidences: [manufacturerEvidence],
      },
      normalized: promoted,
    });
    expect(record.hasNonInferredEvidence).toBe(true);
  });

  it("sets hasNonInferredEvidence true when third_party evidence is present", () => {
    const thirdParty = { ...manufacturerEvidence, sourceTruthKind: "third_party" as const };
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: {
        status: "parts_partial",
        parts: [{ partNumber: "A" }],
        completeness: { sectionCount: 2 },
        providerEvidences: [thirdParty],
      },
      normalized: accepted,
    });
    expect(record.hasNonInferredEvidence).toBe(true);
  });

  it("sets hasNonInferredEvidence false when all evidence is inferred", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: {
        status: "complete",
        parts: [{ partNumber: "A" }],
        completeness: { sectionCount: 3 },
        providerEvidences: [inferredEvidence, inferredEvidence],
      },
      normalized: downgraded,
    });
    expect(record.hasNonInferredEvidence).toBe(false);
  });

  it("sets hasNonInferredEvidence false when providerEvidences is empty", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: {
        status: "complete",
        parts: [{ partNumber: "A" }],
        completeness: { sectionCount: 3 },
        providerEvidences: [],
      },
      normalized: downgraded,
    });
    expect(record.hasNonInferredEvidence).toBe(false);
  });

  it("skipReason reflects normalized.reason", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: { status: "enriched", parts: [], completeness: { sectionCount: 0 } },
      normalized: skipped,
    });
    expect(record.skipReason).toBe("skip:unknown_status:enriched");
  });

  it("cacheEligible reflects normalized.cacheEligibleStatus", () => {
    const eligible = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: { status: "parts_partial", parts: [{ partNumber: "A" }], completeness: { sectionCount: 2 } },
      normalized: accepted,
    });
    const ineligible = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: { status: "empty", parts: [], completeness: { sectionCount: 0 } },
      normalized: noResult,
    });
    expect(eligible.cacheEligible).toBe(true);
    expect(ineligible.cacheEligible).toBe(false);
  });

  it("sessionId defaults to null when not provided", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: { status: "parts_partial", parts: [], completeness: { sectionCount: 0 } },
      normalized: accepted,
    });
    expect(record.sessionId).toBeNull();
  });

  it("sessionId is set when provided", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      sessionId: "session-uuid-123",
      payload: { status: "parts_partial", parts: [], completeness: { sectionCount: 0 } },
      normalized: accepted,
    });
    expect(record.sessionId).toBe("session-uuid-123");
  });

  it("captures providerEvidencesCount correctly", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: "WF2000",
      rawModel: "WF-2000",
      payload: {
        status: "complete",
        parts: [{ partNumber: "A" }],
        completeness: { sectionCount: 2 },
        providerEvidences: [manufacturerEvidence, inferredEvidence],
      },
      normalized: promoted,
    });
    expect(record.providerEvidencesCount).toBe(2);
  });
});

// ----- classifyRetrievalEvent -----

describe("classifyRetrievalEvent", () => {
  it("skip_cache durable status produces cache_skipped", () => {
    const event = classifyRetrievalEvent("enriched", skipped);
    expect(event.eventType).toBe("cache_skipped");
  });

  it("complete downgraded to parts_partial produces cache_downgraded", () => {
    const event = classifyRetrievalEvent("complete", downgraded);
    expect(event.eventType).toBe("cache_downgraded");
    expect(event.detail).toMatchObject({ liveStatus: "complete", durableStatus: "parts_partial" });
  });

  it("target_met downgraded to parts_partial produces cache_downgraded", () => {
    const targetDowngraded: NormalizeCacheStatusResult = {
      durableStatus: "parts_partial",
      cacheEligibleStatus: true,
      reason: "downgraded:target_met:weak_evidence",
    };
    const event = classifyRetrievalEvent("target_met", targetDowngraded);
    expect(event.eventType).toBe("cache_downgraded");
  });

  it("variant_resolution_needed produces variant_blocked", () => {
    const event = classifyRetrievalEvent("variant_resolution_needed", variantBlocked);
    expect(event.eventType).toBe("variant_blocked");
    expect(event.stage).toBe("variant_resolution");
  });

  it("parts_partial passthrough produces cache_accepted", () => {
    const event = classifyRetrievalEvent("parts_partial", accepted);
    expect(event.eventType).toBe("cache_accepted");
  });

  it("bom_complete passthrough produces cache_accepted", () => {
    const bomAccepted: NormalizeCacheStatusResult = {
      durableStatus: "bom_complete",
      cacheEligibleStatus: true,
      reason: "passthrough:bom_complete",
    };
    const event = classifyRetrievalEvent("bom_complete", bomAccepted);
    expect(event.eventType).toBe("cache_accepted");
  });

  it("complete promoted to bom_complete produces cache_accepted (not downgraded)", () => {
    const event = classifyRetrievalEvent("complete", promoted);
    expect(event.eventType).toBe("cache_accepted");
  });

  it("failed produces cache_skipped", () => {
    const event = classifyRetrievalEvent("failed", failed);
    expect(event.eventType).toBe("cache_skipped");
  });

  it("no_result produces cache_skipped", () => {
    const event = classifyRetrievalEvent("empty", noResult);
    expect(event.eventType).toBe("cache_skipped");
  });

  it("summary_only produces cache_skipped", () => {
    const summaryOnly: NormalizeCacheStatusResult = {
      durableStatus: "summary_only",
      cacheEligibleStatus: false,
      reason: "passthrough:summary_only",
    };
    const event = classifyRetrievalEvent("summary_only", summaryOnly);
    expect(event.eventType).toBe("cache_skipped");
  });

  it("detail always contains liveStatus and reason", () => {
    const event = classifyRetrievalEvent("parts_partial", accepted);
    expect(event.detail).toHaveProperty("liveStatus");
    expect(event.detail).toHaveProperty("reason");
  });
});
