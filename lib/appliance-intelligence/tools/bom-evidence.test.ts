import { describe, it, expect } from "vitest";
import { buildBOMProviderEvidence } from "./bom-evidence";

describe("buildBOMProviderEvidence", () => {
  it("normalizes pure manufacturer stage properly", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "123", sectionName: "Drum" }],
        sources: [{ uri: "https://whirlpool.com/parts" }],
        coverage: { paginationComplete: true }
      },
      modelNumber: "WF2000",
      provider: "manufacturer",
      stage: "manufacturer"
    });
    expect(evidence.sourceTruthKind).toBe("manufacturer");
    expect(evidence.retrievalState).toBe("success");
    expect(evidence.assemblySections.length).toBe(1);
    expect(evidence.assemblySections[0].sectionName).toBe("Drum");
  });

  it("detects AI schematic fallback as inferred", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "456", sectionName: "General Assembly" }],
        coverage: { flags: ["ai-schematic-extraction"] }
      },
      modelNumber: "WF2000",
      provider: "ai_bot",
      stage: "manufacturer"
    });
    expect(evidence.sourceTruthKind).toBe("inferred");
    expect(evidence.retrievalState).toBe("partial");
  });

  it("labels deterministic Sears traversal as third_party even in manufacturer stage", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "789" }],
      },
      modelNumber: "WF2000",
      provider: "sears",
      stage: "manufacturer"
    });
    expect(evidence.sourceTruthKind).toBe("third_party");
  });

  it("labels gap fill distributor data as third_party", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "999" }],
      },
      modelNumber: "WF2000",
      provider: "partselect.com",
      stage: "primary_fallback"
    });
    expect(evidence.sourceTruthKind).toBe("third_party");
  });

  it("Merged result does not erase separate provider evidence entries.", () => {
    const mfgEvidence = buildBOMProviderEvidence({
      stageResult: { parts: [{ rawPartNumber: "1" }] },
      modelNumber: "WF2000",
      provider: "manufacturer",
      stage: "manufacturer"
    });
    const distEvidence = buildBOMProviderEvidence({
      stageResult: { parts: [{ rawPartNumber: "2" }] },
      modelNumber: "WF2000",
      provider: "repairclinic.com",
      stage: "primary_fallback"
    });
    expect(mfgEvidence.sourceTruthKind).toBe("manufacturer");
    expect(distEvidence.sourceTruthKind).toBe("third_party");
  });

  // --- Pass 2C.1 hardening tests ---

  it("zero-part output yields retrievalState failed and confidence 0", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [],
        coverage: { paginationComplete: true }
      },
      modelNumber: "WF2000",
      provider: "manufacturer",
      stage: "manufacturer"
    });
    expect(evidence.retrievalState).toBe("failed");
    expect(evidence.confidence).toBe(0);
  });

  it("paginationComplete false yields retrievalState partial", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "A1" }],
        coverage: { paginationComplete: false }
      },
      modelNumber: "WF2000",
      provider: "manufacturer",
      stage: "manufacturer"
    });
    expect(evidence.retrievalState).toBe("partial");
  });

  it.each([
    "ai-schematic-extraction",
    "ai-search-fallback-used",
    "partial-diagram-fetch",
    "no-diagrams-found",
    "section-fetch-failures",
    "manufacturer-empty-result",
    "manufacturer-no-parts",
    "ai-search-fallback-disabled",
  ])("flag '%s' overrides paginationComplete:true to partial", (flag) => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "A1" }],
        coverage: { paginationComplete: true, flags: [flag] }
      },
      modelNumber: "WF2000",
      provider: "manufacturer",
      stage: "manufacturer"
    });
    expect(evidence.retrievalState).toBe("partial");
  });

  it("assembly sections preserve observedPartCount per section", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [
          { rawPartNumber: "P1", sectionName: "Drum" },
          { rawPartNumber: "P2", sectionName: "Drum" },
          { rawPartNumber: "P3", sectionName: "Motor" },
        ],
        coverage: { paginationComplete: true }
      },
      modelNumber: "WF2000",
      provider: "manufacturer",
      stage: "manufacturer"
    });
    const drum = evidence.assemblySections.find(s => s.sectionName === "Drum");
    const motor = evidence.assemblySections.find(s => s.sectionName === "Motor");
    expect(drum?.observedPartCount).toBe(2);
    expect(motor?.observedPartCount).toBe(1);
  });

  it("confidence is always between 0 and 100", () => {
    const cases = [
      { provider: "manufacturer", stage: "manufacturer", paginationComplete: true },
      { provider: "repairclinic.com", stage: "primary_fallback", paginationComplete: true },
      { provider: "ai_bot", stage: "manufacturer", paginationComplete: false },
      { provider: "unknown_src", stage: "unknown_stage", paginationComplete: true },
    ];
    for (const c of cases) {
      const evidence = buildBOMProviderEvidence({
        stageResult: {
          parts: [{ rawPartNumber: "X1" }],
          coverage: { paginationComplete: c.paginationComplete }
        },
        modelNumber: "WF2000",
        provider: c.provider,
        stage: c.stage
      });
      expect(evidence.confidence).toBeGreaterThanOrEqual(0);
      expect(evidence.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("AI/inferred confidence never exceeds 60", () => {
    const flagCases = ["ai-schematic-extraction", "ai-search-fallback-used"];
    for (const flag of flagCases) {
      const evidence = buildBOMProviderEvidence({
        stageResult: {
          parts: [{ rawPartNumber: "X1" }],
          coverage: { paginationComplete: true, flags: [flag] }
        },
        modelNumber: "WF2000",
        provider: "manufacturer",
        stage: "manufacturer"
      });
      expect(evidence.sourceTruthKind).toBe("inferred");
      expect(evidence.confidence).toBeLessThanOrEqual(60);
    }
  });

  it("unknown source confidence never exceeds 50", () => {
    const evidence = buildBOMProviderEvidence({
      stageResult: {
        parts: [{ rawPartNumber: "X1" }],
        coverage: { paginationComplete: true }
      },
      modelNumber: "WF2000",
      provider: "mystery_source",
      stage: "mystery_stage"
    });
    expect(evidence.sourceTruthKind).toBe("unknown");
    expect(evidence.confidence).toBeLessThanOrEqual(50);
  });
});
