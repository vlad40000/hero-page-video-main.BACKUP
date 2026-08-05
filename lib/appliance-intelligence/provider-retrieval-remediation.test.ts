import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/tools/parts/providers/distributor/sears", () => ({
  fetchSearsDistributorBom: vi.fn(async () => ({
    summary: "Sears blocked",
    source: "searspartsdirect.com",
    parts: [],
    sources: [{ title: "Sears PartsDirect", uri: "https://www.searspartsdirect.com/search?q=MLE2000AYW" }],
    coverage: {
      provider: "sears-distributor",
      sectionsDiscovered: 0,
      sectionsFetched: 0,
      sectionFetchFailures: 0,
      paginationComplete: false,
      flags: ["provider-blocked-403"],
      retrievalState: "blocked_403",
    },
    providerAttempts: [
      {
        provider: "searspartsdirect.com",
        stage: "distributor_fallback",
        availability: "blocked_403",
        reason: "Provider returned HTTP 403.",
        partsCount: 0,
        sectionCount: 0,
        sourceUrl: "https://www.searspartsdirect.com/search?q=MLE2000AYW",
      },
    ],
  })),
}));

vi.mock("@/lib/tools/parts/gemini", () => ({
  fetchPartsList: vi.fn(async (_modelNumber: string, providerPlan: any) => {
    const domain = providerPlan.allowedDomains?.[0];
    if (domain !== "partselect.com") {
      return { summary: "", parts: [], sources: [] };
    }

    return {
      summary: "PartSelect BOM",
      parts: [
        {
          partNumber: "WP33002535",
          name: "Dryer drum belt",
          section: "Motor and drive",
          source: "partselect.com",
        },
      ],
      sources: [{ title: "PartSelect", uri: "https://www.partselect.com/Models/MLE2000AYW/" }],
    };
  }),
}));

import { normalizeCacheStatus } from "./verification/cache-status";
import { fetchGapFillBom } from "@/lib/tools/parts/providers/distributor/gap-fill";

describe("provider retrieval remediation", () => {
  const previousFallback = process.env.ENABLE_GEMINI_SEARCH_FALLBACK;

  afterEach(() => {
    if (previousFallback === undefined) {
      delete process.env.ENABLE_GEMINI_SEARCH_FALLBACK;
    } else {
      process.env.ENABLE_GEMINI_SEARCH_FALLBACK = previousFallback;
    }
  });

  it("continues past a Sears 403 when another provider can return parts", async () => {
    process.env.ENABLE_GEMINI_SEARCH_FALLBACK = "true";

    const result = await fetchGapFillBom({
      modelNumber: "MLE2000AYW",
      brand: "Maytag",
      domains: ["searspartsdirect.com", "partselect.com"],
      plan: {},
    });

    expect(result.parts).toHaveLength(1);
    expect(result.sourceBreakdown["searspartsdirect.com"]).toBe(0);
    expect(result.sourceBreakdown["partselect.com"]).toBe(1);
    expect(result.providerAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "searspartsdirect.com",
          availability: "blocked_403",
        }),
        expect.objectContaining({
          provider: "partselect.com",
          availability: "accessible",
          partsCount: 1,
        }),
      ])
    );
  });

  it("keeps provider_exhausted out of the cache", () => {
    const normalized = normalizeCacheStatus({
      status: "provider_exhausted",
      parts: [],
      completeness: { sectionCount: 0 },
      providerEvidences: [],
    });

    expect(normalized).toEqual({
      durableStatus: "no_result",
      cacheEligibleStatus: false,
      reason: "mapped:provider_exhausted",
    });
  });
});
