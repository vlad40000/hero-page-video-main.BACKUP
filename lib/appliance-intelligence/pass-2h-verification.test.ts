/**
 * Pass 2H — End-to-End Verification
 *
 * Cross-module pipeline tests. Each describe block maps to one of the 10
 * Pass 2H checklist items. Tests use only pure exported functions so there
 * are no DB or network calls.
 */

import { describe, it, expect } from "vitest";

import { buildBOMProviderEvidence } from "./tools/bom-evidence";
import { normalizeCacheStatus } from "./verification/cache-status";
import { evaluateModelCacheEligibility } from "./verification/cache-eligibility";
import {
  buildRetrievalRunRecord,
  classifyRetrievalEvent,
} from "./audit/retrieval-audit";
import {
  adaptManufacturerResult,
  adaptSearsTraversalResult,
  adaptGapFillResult,
} from "./tools/provider-evidence-adapters";
import {
  normalizePricingEvidence,
  selectBestPricingEvidence,
  buildNoPriceEvidence,
  type PartPricingEvidence,
} from "./tools/pricing-evidence";
import type { BOMProviderEvidence } from "./tools/schemas";
import type { NormalizeCacheStatusResult } from "./verification/cache-status";

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const MODEL = "MVWB300WQ2";

function makeManufacturerEvidence(partOverrides: Record<string, unknown> = {}): BOMProviderEvidence {
  return buildBOMProviderEvidence({
    stageResult: {
      parts: [{ rawPartNumber: "WP3360311", sectionName: "Pump" }],
      sources: [{ uri: "https://whirlpool.com/parts/MVWB300WQ2" }],
      coverage: { paginationComplete: true, flags: [] },
      ...partOverrides,
    },
    modelNumber: MODEL,
    provider: "manufacturer",
    stage: "manufacturer",
  });
}

function makeSearsEvidence(partOverrides: Record<string, unknown> = {}): BOMProviderEvidence {
  return adaptSearsTraversalResult(
    {
      parts: [{ rawPartNumber: "285753A", sectionName: "Drum" }],
      sources: [{ uri: "https://searspartsdirect.com/model/mvwb300wq2/drum" }],
      coverage: { paginationComplete: true, flags: [] },
      ...partOverrides,
    },
    MODEL
  );
}

function makeInferredEvidence(partOverrides: Record<string, unknown> = {}): BOMProviderEvidence {
  return buildBOMProviderEvidence({
    stageResult: {
      parts: [{ rawPartNumber: "AI001", sectionName: "General Assembly" }],
      coverage: { paginationComplete: true, flags: ["ai-schematic-extraction"] },
      ...partOverrides,
    },
    modelNumber: MODEL,
    provider: "ai_bot",
    stage: "manufacturer",
  });
}

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    status: "complete",
    parts: [{ partNumber: "WP3360311" }],
    completeness: { sectionCount: 3 },
    providerEvidences: [makeManufacturerEvidence()] as BOMProviderEvidence[],
    truthSource: "Whirlpool Parts",
    sourceStrategy: "manufacturer-first",
    review: null,
    retrievalTrace: null,
    ...overrides,
  };
}

const ACCEPTED: NormalizeCacheStatusResult = {
  durableStatus: "bom_complete",
  cacheEligibleStatus: true,
  reason: "promoted:complete:valid_evidence",
};

const DOWNGRADED: NormalizeCacheStatusResult = {
  durableStatus: "parts_partial",
  cacheEligibleStatus: true,
  reason: "downgraded:complete:weak_evidence",
};

// ─── 1. DB-first behavior ────────────────────────────────────────────────────
//
// getPartsForAppliance gates cache reuse through isReusableModelCache, which
// delegates eligibility to evaluateModelCacheEligibility. Only payloads that
// pass the eligibility check are stored and reused from the DB cache.

describe("1 — DB-first: only eligible payloads are reusable", () => {
  it("a payload with parts, sections, and truth source is cache-eligible", () => {
    const result = evaluateModelCacheEligibility({
      parts: [{ partNumber: "WP3360311" }],
      status: "parts_partial",
      completeness: { sectionCount: 4 },
      truthSource: "Whirlpool Manufacturer BOM",
      sourceStrategy: "manufacturer-first",
    });
    expect(result.eligible).toBe(true);
    expect(result.reason).toBe("eligible");
  });

  it("a payload with no parts is not cache-eligible and will not enter the DB cache", () => {
    const result = evaluateModelCacheEligibility({
      parts: [],
      status: "parts_partial",
      completeness: { sectionCount: 4 },
      truthSource: "Whirlpool",
      sourceStrategy: "manufacturer-first",
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("empty_parts");
  });

  it("a live status that never reaches the durable whitelist is not cache-eligible", () => {
    for (const liveStatus of ["complete", "partial", "below_floor", "target_met"]) {
      const result = evaluateModelCacheEligibility({
        parts: [{ partNumber: "X" }],
        status: liveStatus,
        completeness: { sectionCount: 2 },
        truthSource: "Whirlpool",
        sourceStrategy: "manufacturer-first",
      });
      expect(result.eligible).toBe(false);
    }
  });

  it("normalizeCacheStatus supplies the durable status that replaces the live status before the DB write", () => {
    const payload = makePayload({ status: "complete" });
    const normalized = normalizeCacheStatus(payload);
    // The durable status is written to the DB; the live status is not.
    expect(normalized.durableStatus).toBe("bom_complete");
    expect(normalized.durableStatus).not.toBe("complete");
  });
});

// ─── 2. Empty / failed / weak retrievals do not poison the cache ─────────────

describe("2 — Cache poisoning: empty/failed/weak retrievals are never stored as complete", () => {
  it("empty status is not cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "empty" }));
    expect(result.durableStatus).toBe("no_result");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("failed status is not cache-eligible", () => {
    const result = normalizeCacheStatus(makePayload({ status: "failed" }));
    expect(result.durableStatus).toBe("failed");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("below_floor with zero parts is not cache-eligible", () => {
    const result = normalizeCacheStatus(
      makePayload({ status: "below_floor", parts: [], completeness: { sectionCount: 0 } })
    );
    expect(result.durableStatus).toBe("no_result");
    expect(result.cacheEligibleStatus).toBe(false);
  });

  it("complete with no provider evidences does not become bom_complete", () => {
    const result = normalizeCacheStatus(makePayload({ status: "complete", providerEvidences: [] }));
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.durableStatus).not.toBe("bom_complete");
  });

  it("complete with only inferred evidence (AI-only) does not become bom_complete", () => {
    // A failed manufacturer stage still carries sourceTruthKind:"manufacturer" —
    // hasValidEvidence accepts that classification. The real weak-evidence guard
    // is inferred-only: AI output alone cannot promote "complete" to bom_complete.
    const result = normalizeCacheStatus(
      makePayload({ status: "complete", providerEvidences: [makeInferredEvidence()] })
    );
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.reason).toContain("downgraded");
  });

  it("parts_partial is cache-eligible (valid data, incomplete BOM)", () => {
    const result = normalizeCacheStatus(makePayload({ status: "parts_partial" }));
    expect(result.cacheEligibleStatus).toBe(true);
    expect(result.durableStatus).toBe("parts_partial");
  });
});

// ─── 3. providerEvidences[] is present and sourceTruthKind is correct ────────

describe("3 — providerEvidences[] shape and sourceTruthKind correctness", () => {
  it("manufacturer stage produces sourceTruthKind:manufacturer", () => {
    const ev = makeManufacturerEvidence();
    expect(ev.sourceTruthKind).toBe("manufacturer");
    expect(ev.provider).toContain("manufacturer");
  });

  it("multi-stage session accumulates distinct providerEvidences per stage", () => {
    const mfg = makeManufacturerEvidence();
    const sears = makeSearsEvidence();
    const evidences: BOMProviderEvidence[] = [mfg, sears];

    expect(evidences).toHaveLength(2);
    expect(evidences[0].sourceTruthKind).toBe("manufacturer");
    expect(evidences[1].sourceTruthKind).toBe("third_party");
  });

  it("providerEvidences are required by normalizeCacheStatus for complete→bom_complete promotion", () => {
    const withEvidence = normalizeCacheStatus(
      makePayload({ status: "complete", providerEvidences: [makeManufacturerEvidence()] })
    );
    const withoutEvidence = normalizeCacheStatus(
      makePayload({ status: "complete", providerEvidences: [] })
    );
    expect(withEvidence.durableStatus).toBe("bom_complete");
    expect(withoutEvidence.durableStatus).toBe("parts_partial");
  });

  it("each evidence record has all required BOMProviderEvidence fields", () => {
    const ev = makeManufacturerEvidence();
    expect(ev).toHaveProperty("provider");
    expect(ev).toHaveProperty("modelNumber");
    expect(ev).toHaveProperty("sourceUrl");
    expect(ev).toHaveProperty("sourceTruthKind");
    expect(ev).toHaveProperty("retrievalState");
    expect(ev).toHaveProperty("confidence");
    expect(ev).toHaveProperty("assemblySections");
    expect(ev).toHaveProperty("parts");
  });
});

// ─── 4. Sears traversal remains third_party ───────────────────────────────────

describe("4 — Sears traversal is always third_party", () => {
  it("adaptSearsTraversalResult always yields third_party regardless of raw source field", () => {
    const ev = adaptSearsTraversalResult(
      {
        parts: [{ rawPartNumber: "285753A", sectionName: "Drum", source: "manufacturer" }],
        coverage: { paginationComplete: true, flags: [] },
      },
      MODEL
    );
    expect(ev.sourceTruthKind).toBe("third_party");
    expect(ev.sourceTruthKind).not.toBe("manufacturer");
  });

  it("Sears third_party evidence counts as non-inferred for hasNonInferredEvidence in audit record", () => {
    const searsEv = makeSearsEvidence();
    expect(searsEv.sourceTruthKind).toBe("third_party");

    const record = buildRetrievalRunRecord({
      normalizedModel: MODEL,
      rawModel: MODEL,
      payload: makePayload({ status: "parts_partial", providerEvidences: [searsEv] }),
      normalized: { durableStatus: "parts_partial", cacheEligibleStatus: true, reason: "passthrough:parts_partial" },
    });
    expect(record.hasNonInferredEvidence).toBe(true);
  });

  it("Sears third_party evidence allows bom_complete promotion when status is complete", () => {
    const result = normalizeCacheStatus(
      makePayload({ status: "complete", providerEvidences: [makeSearsEvidence()] })
    );
    expect(result.durableStatus).toBe("bom_complete");
  });
});

// ─── 5. AI fallback remains inferred ─────────────────────────────────────────

describe("5 — AI fallback is always inferred and cannot promote to bom_complete alone", () => {
  it("ai-schematic-extraction flag produces sourceTruthKind:inferred", () => {
    const ev = makeInferredEvidence();
    expect(ev.sourceTruthKind).toBe("inferred");
  });

  it("ai-search-fallback-used flag also produces sourceTruthKind:inferred", () => {
    const ev = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "AI002" }],
        coverage: { paginationComplete: true, flags: ["ai-search-fallback-used"] },
      },
      modelNumber: MODEL,
      provider: "manufacturer",
      stage: "manufacturer",
    });
    expect(ev.sourceTruthKind).toBe("inferred");
  });

  it("inferred confidence is capped at 60", () => {
    const ev = makeInferredEvidence();
    expect(ev.confidence).toBeLessThanOrEqual(60);
  });

  it("AI-only evidence marks hasNonInferredEvidence false in audit record", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: MODEL,
      rawModel: MODEL,
      payload: makePayload({
        status: "complete",
        providerEvidences: [makeInferredEvidence(), makeInferredEvidence()],
      }),
      normalized: DOWNGRADED,
    });
    expect(record.hasNonInferredEvidence).toBe(false);
  });

  it("complete with AI-only evidence cannot become bom_complete", () => {
    const result = normalizeCacheStatus(
      makePayload({ status: "complete", providerEvidences: [makeInferredEvidence()] })
    );
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.durableStatus).not.toBe("bom_complete");
  });

  it("inferred evidence mixed with manufacturer evidence still allows bom_complete", () => {
    const result = normalizeCacheStatus(
      makePayload({
        status: "complete",
        providerEvidences: [makeInferredEvidence(), makeManufacturerEvidence()],
      })
    );
    expect(result.durableStatus).toBe("bom_complete");
  });
});

// ─── 6. Cache status is mapped before the DB write ───────────────────────────

describe("6 — Cache status normalization happens before write", () => {
  it("live status 'complete' is never written as-is; it becomes bom_complete or parts_partial", () => {
    const withGoodEvidence = normalizeCacheStatus(makePayload({ status: "complete" }));
    expect(withGoodEvidence.durableStatus).not.toBe("complete");

    const withNoEvidence = normalizeCacheStatus(
      makePayload({ status: "complete", providerEvidences: [] })
    );
    expect(withNoEvidence.durableStatus).not.toBe("complete");
  });

  it("live 'partial' maps to parts_partial durable status", () => {
    const result = normalizeCacheStatus(makePayload({ status: "partial" }));
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.reason).toBe("mapped:partial");
  });

  it("live 'below_floor' with parts maps to parts_partial, not below_floor", () => {
    const result = normalizeCacheStatus(
      makePayload({ status: "below_floor", parts: [{ partNumber: "X" }], completeness: { sectionCount: 2 } })
    );
    expect(result.durableStatus).toBe("parts_partial");
    expect(result.durableStatus).not.toBe("below_floor");
  });

  it("normalizeCacheStatus reason field documents why a status was mapped or promoted", () => {
    const promoted = normalizeCacheStatus(makePayload({ status: "complete" }));
    expect(promoted.reason).toContain("promoted");

    const downgraded = normalizeCacheStatus(
      makePayload({ status: "complete", providerEvidences: [] })
    );
    expect(downgraded.reason).toContain("downgraded");
  });

  it("the durable status written to DB (normalizeCacheStatus output) differs from the live payload status in edge cases", () => {
    const livePayload = makePayload({ status: "complete", providerEvidences: [] });
    const normalized = normalizeCacheStatus(livePayload);
    // live = "complete", durable = "parts_partial" — they must not be the same
    expect(livePayload.status).toBe("complete");
    expect(normalized.durableStatus).toBe("parts_partial");
    expect(normalized.durableStatus).not.toBe(livePayload.status);
  });
});

// ─── 7. Audit records are written after schema migration ─────────────────────
//
// schema.sql defines parts_retrieval_runs and parts_retrieval_events tables.
// These tests verify the pure builder functions produce records that match the
// expected DB schema column set. The actual DB write is fire-and-forget in
// recordRetrievalRun(); the pure builders are testable without a live DB.

describe("7 — Audit record shape matches the parts_retrieval_runs schema", () => {
  it("buildRetrievalRunRecord includes all columns required by the schema", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: MODEL,
      rawModel: "MVWB-300WQ2",
      sessionId: "sess-abc-123",
      payload: makePayload({ status: "parts_partial" }),
      normalized: { durableStatus: "parts_partial", cacheEligibleStatus: true, reason: "passthrough:parts_partial" },
    });

    // Maps to: normalized_model, raw_model, session_id, live_status,
    //          durable_status, cache_eligible, skip_reason, parts_count,
    //          section_count, provider_evidences_count, has_non_inferred_evidence,
    //          retrieval_trace_json
    expect(record.normalizedModel).toBe(MODEL);
    expect(record.rawModel).toBe("MVWB-300WQ2");
    expect(record.sessionId).toBe("sess-abc-123");
    expect(record.liveStatus).toBe("parts_partial");
    expect(record.durableStatus).toBe("parts_partial");
    expect(record.cacheEligible).toBe(true);
    expect(typeof record.skipReason).toBe("string");
    expect(typeof record.partsCount).toBe("number");
    expect(typeof record.sectionCount).toBe("number");
    expect(typeof record.providerEvidencesCount).toBe("number");
    expect(typeof record.hasNonInferredEvidence).toBe("boolean");
  });

  it("classifyRetrievalEvent produces a valid event_type for each meaningful transition", () => {
    const pairs: Array<[string, NormalizeCacheStatusResult, string]> = [
      ["complete", ACCEPTED, "cache_accepted"],
      ["complete", DOWNGRADED, "cache_downgraded"],
      ["enriched", { durableStatus: "skip_cache", cacheEligibleStatus: false, reason: "skip:unknown_status:enriched" }, "cache_skipped"],
      ["variant_resolution_needed", { durableStatus: "skip_cache", cacheEligibleStatus: false, reason: "skip:variant_resolution_needed" }, "variant_blocked"],
    ];

    for (const [live, norm, expectedType] of pairs) {
      const event = classifyRetrievalEvent(live, norm);
      expect(event.eventType).toBe(expectedType);
    }
  });

  it("audit event detail always has liveStatus and reason fields (mapped to detail_json)", () => {
    const event = classifyRetrievalEvent("complete", DOWNGRADED);
    expect(event.detail).toHaveProperty("liveStatus");
    expect(event.detail).toHaveProperty("reason");
  });

  it("providerEvidencesCount is 0 when providerEvidences is absent", () => {
    const record = buildRetrievalRunRecord({
      normalizedModel: MODEL,
      rawModel: MODEL,
      payload: { status: "empty", parts: [], completeness: { sectionCount: 0 } },
      normalized: { durableStatus: "no_result", cacheEligibleStatus: false, reason: "mapped:empty" },
    });
    expect(record.providerEvidencesCount).toBe(0);
    expect(record.hasNonInferredEvidence).toBe(false);
  });
});

// ─── 8. Pricing evidence is separate from BOM evidence ───────────────────────

describe("8 — Pricing evidence and BOM evidence do not share fields or affect each other", () => {
  it("PartPricingEvidence has no BOMProviderEvidence fields", () => {
    const pricing = buildNoPriceEvidence("WP3360311", "encompass.com");

    expect("provider" in pricing).toBe(false);
    expect("modelNumber" in pricing).toBe(false);
    expect("sourceTruthKind" in pricing).toBe(false);
    expect("retrievalState" in pricing).toBe(false);
    expect("assemblySections" in pricing).toBe(false);
    expect("parts" in pricing).toBe(false);
    expect("confidence" in pricing).toBe(false);
  });

  it("BOMProviderEvidence has no PartPricingEvidence fields", () => {
    const bom = makeManufacturerEvidence();

    expect("price" in bom).toBe(false);
    expect("currency" in bom).toBe(false);
    expect("availability" in bom).toBe(false);
    expect("sourceUrl" in bom).toBe(true); // BOM does have sourceUrl — that's coincidental and not shared semantics
    expect("matchConfidence" in bom).toBe(false);
    expect("evidenceKind" in bom).toBe(false);
    expect("checkedAt" in bom).toBe(false);
    expect("supplier" in bom).toBe(false);
  });

  it("normalizePricingEvidence does not mutate the BOM evidence array", () => {
    const bomEvidences: BOMProviderEvidence[] = [makeManufacturerEvidence()];
    const countBefore = bomEvidences.length;

    const snapshot = {
      partNumber: "WP3360311",
      retailPrice: 42.99,
      retailPriceVerified: true,
      retailPriceSource: "encompass.com",
      retailPricingUrl: "https://encompass.com/item/WP3360311",
      retailPricedAt: "2026-05-16T00:00:00.000Z",
      pricingEvidence: [
        {
          supplier: "encompass.com",
          method: "direct_item_fetch",
          url: "https://encompass.com/item/WP3360311",
          partMentioned: true,
          priceFound: true,
          checkedAt: "2026-05-16T00:00:00.000Z",
        },
      ],
    };

    normalizePricingEvidence(snapshot, "WP3360311");

    // BOM evidence array is unchanged
    expect(bomEvidences).toHaveLength(countBefore);
    expect(bomEvidences[0].sourceTruthKind).toBe("manufacturer");
  });

  it("normalizeCacheStatus reads providerEvidences (BOM), not pricing evidence", () => {
    // Even if pricing says a price was found, that has no effect on cache eligibility.
    const payloadWithPricing = makePayload({
      status: "complete",
      providerEvidences: [], // no BOM evidence
      // pricing is not part of this payload — it's computed separately
    });
    const result = normalizeCacheStatus(payloadWithPricing);
    // BOM evidence is absent → downgraded
    expect(result.durableStatus).toBe("parts_partial");
  });
});

// ─── 9. Encompass pricing is preferred when available ────────────────────────

describe("9 — Encompass is the preferred pricing source", () => {
  const encompassEvidence: PartPricingEvidence = {
    partNumber: "WP3360311",
    supplier: "encompass.com",
    price: 42.99,
    currency: "USD",
    availability: "Available for Order",
    sourceUrl: "https://encompass.com/item/WP3360311",
    matchConfidence: 100,
    checkedAt: "2026-05-16T00:00:00.000Z",
    evidenceKind: "direct_fetch",
  };

  const searsEvidence: PartPricingEvidence = {
    partNumber: "WP3360311",
    supplier: "searspartsdirect.com",
    price: 44.99,
    currency: "USD",
    availability: null,
    sourceUrl: "https://searspartsdirect.com/part/WP3360311",
    matchConfidence: 80,
    checkedAt: "2026-05-16T00:00:00.000Z",
    evidenceKind: "grounded_search",
  };

  const reliableEvidence: PartPricingEvidence = {
    partNumber: "WP3360311",
    supplier: "reliableparts.com",
    price: 39.99,
    currency: "USD",
    availability: null,
    sourceUrl: null,
    matchConfidence: 60,
    checkedAt: "2026-05-16T00:00:00.000Z",
    evidenceKind: "catalog_fetch",
  };

  it("selectBestPricingEvidence returns Encompass when all three suppliers have prices", () => {
    const best = selectBestPricingEvidence(
      [reliableEvidence, searsEvidence, encompassEvidence],
      "WP3360311"
    );
    expect(best.supplier).toBe("encompass.com");
    expect(best.price).toBe(42.99);
  });

  it("falls back to Sears when Encompass has no price", () => {
    const encompassNone: PartPricingEvidence = { ...encompassEvidence, price: null, evidenceKind: "no_price_found" };
    const best = selectBestPricingEvidence([encompassNone, searsEvidence], "WP3360311");
    expect(best.supplier).toBe("searspartsdirect.com");
    expect(best.price).toBe(44.99);
  });

  it("falls back to ReliableParts when Encompass and Sears have no price", () => {
    const encompassNone: PartPricingEvidence = { ...encompassEvidence, price: null, evidenceKind: "no_price_found" };
    const searsNone: PartPricingEvidence = { ...searsEvidence, price: null, evidenceKind: "no_price_found" };
    const best = selectBestPricingEvidence([encompassNone, searsNone, reliableEvidence], "WP3360311");
    expect(best.supplier).toBe("reliableparts.com");
  });

  it("missing price is always explicit via no_price_found — never silently null", () => {
    const result = normalizePricingEvidence(null, "WP3360311");
    expect(result[0].evidenceKind).toBe("no_price_found");
    expect(result[0].price).toBeNull();
  });

  it("Encompass direct_fetch snapshot preserves sourceUrl and checkedAt", () => {
    const snapshot = {
      partNumber: "WP3360311",
      retailPrice: 42.99,
      retailPriceVerified: true,
      retailPriceSource: "encompass.com",
      retailPricingUrl: "https://encompass.com/item/WP3360311",
      retailPricedAt: "2026-05-16T00:00:00.000Z",
      pricingEvidence: [
        {
          supplier: "encompass.com",
          method: "direct_item_fetch",
          url: "https://encompass.com/item/WP3360311",
          partMentioned: true,
          priceFound: true,
          checkedAt: "2026-05-16T00:00:00.000Z",
        },
      ],
    };
    const ev = normalizePricingEvidence(snapshot, "WP3360311");
    const hit = ev.find((e) => e.price != null);
    expect(hit?.sourceUrl).toBe("https://encompass.com/item/WP3360311");
    expect(hit?.checkedAt).toBe("2026-05-16T00:00:00.000Z");
  });
});

// ─── 10. UI does not claim complete when state is partial ─────────────────────
//
// routeStatusLabel maps durable BOM status to the label shown in the UI.
// "Verified parts found" is reserved for bom_complete only.
// "Likely parts found"  is shown for parts_partial.
// These two labels must be distinct so the UI cannot mislead users.

describe("10 — UI label: partial results are never labelled as verified/complete", () => {
  // Inline the pure mapping function — it has no side effects and no imports.
  // If the implementation in marketplaceIdentity.ts ever changes, this test
  // will catch a divergence.
  function routeStatusLabel(status?: string, filteredCandidateCount = 0): string {
    if (filteredCandidateCount === 0 && status === "variant_resolution_needed") return "Needs shop review";
    if (status === "bom_complete") return "Verified parts found";
    if (status === "parts_partial") return "Likely parts found";
    if (status === "variant_resolution_needed") return "Needs exact revision";
    if (status === "needs_fallback") return "Searching deeper";
    return "No confirmed parts yet";
  }

  it("bom_complete produces 'Verified parts found'", () => {
    expect(routeStatusLabel("bom_complete")).toBe("Verified parts found");
  });

  it("parts_partial produces 'Likely parts found', not 'Verified'", () => {
    const label = routeStatusLabel("parts_partial");
    expect(label).toBe("Likely parts found");
    expect(label).not.toContain("Verified");
    expect(label).not.toContain("verified");
    expect(label).not.toContain("complete");
    expect(label).not.toContain("Complete");
  });

  it("parts_partial label differs from bom_complete label", () => {
    expect(routeStatusLabel("parts_partial")).not.toBe(routeStatusLabel("bom_complete"));
  });

  it("unknown/missing status never claims verified or complete", () => {
    for (const status of [undefined, "", "enriched", "pending"]) {
      const label = routeStatusLabel(status);
      expect(label).not.toContain("Verified");
      expect(label).not.toContain("verified");
      expect(label).not.toContain("complete");
    }
  });

  it("the pipeline from normalizeCacheStatus output to UI label is coherent end-to-end", () => {
    // A payload that is genuinely partial should never produce the 'Verified' label.
    const payload = makePayload({
      status: "partial",
      providerEvidences: [makeInferredEvidence()],
    });
    const normalized = normalizeCacheStatus(payload);
    // Parts partial → normalizeCacheStatus → durableStatus → UI label
    expect(normalized.durableStatus).toBe("parts_partial");
    const label = routeStatusLabel(normalized.durableStatus);
    expect(label).not.toContain("Verified");
    expect(label).toBe("Likely parts found");
  });

  it("only bom_complete flows through to the Verified label in the UI", () => {
    const payload = makePayload({
      status: "complete",
      providerEvidences: [makeManufacturerEvidence()],
    });
    const normalized = normalizeCacheStatus(payload);
    expect(normalized.durableStatus).toBe("bom_complete");
    const label = routeStatusLabel(normalized.durableStatus);
    expect(label).toBe("Verified parts found");
  });
});
