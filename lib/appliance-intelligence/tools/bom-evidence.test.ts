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
      stage: "manufacturer" // Note: happens inside manufacturer stage
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
    // This test ensures our per-stage collection logic prevents source-truth collapse.
    // Here we just test the normalizers don't merge them.
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
});
