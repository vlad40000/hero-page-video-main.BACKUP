import { describe, it, expect } from "vitest";
import {
  adaptManufacturerResult,
  adaptSearsTraversalResult,
  adaptGapFillResult,
  SEARS_DOMAIN,
  KNOWN_DISTRIBUTOR_DOMAINS,
} from "./provider-evidence-adapters";

// ----- result shape helpers -----

function mfrResult(overrides: Record<string, any> = {}) {
  return {
    source: "geapplianceparts.com",
    parts: [{ rawPartNumber: "WB24X10189", sectionName: "Bake Element" }],
    sources: [{ uri: "https://geapplianceparts.com/model/JBP35DRWW" }],
    coverage: { paginationComplete: true, flags: [] },
    ...overrides,
  };
}

function searsTraversalResult(overrides: Record<string, any> = {}) {
  return {
    parts: [{ rawPartNumber: "285753A", sectionName: "Drum", source: "sears" }],
    sources: [{ uri: "https://searspartsdirect.com/model/mvwb300wq2/drum" }],
    coverage: { paginationComplete: true, flags: [] },
    ...overrides,
  };
}

function gapFillResult(domain: string, overrides: Record<string, any> = {}) {
  return {
    source: domain,
    parts: [{ rawPartNumber: "134503600", sectionName: "Tub" }],
    sources: [{ uri: `https://${domain}/model/XXXX` }],
    coverage: { paginationComplete: true, flags: [] },
    ...overrides,
  };
}

// ----- adaptManufacturerResult -----

describe("adaptManufacturerResult", () => {
  it("GE adapter output is classified manufacturer", () => {
    const ev = adaptManufacturerResult(mfrResult(), "JBP35DRWW");
    expect(ev.sourceTruthKind).toBe("manufacturer");
  });

  it("Whirlpool adapter output is classified manufacturer", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ source: "whirlpoolparts.com" }),
      "WTW5000DW0"
    );
    expect(ev.sourceTruthKind).toBe("manufacturer");
  });

  it("LG adapter output is classified manufacturer", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ source: "lgparts.com" }),
      "WM3900HWA"
    );
    expect(ev.sourceTruthKind).toBe("manufacturer");
  });

  it("Frigidaire adapter output is classified manufacturer", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ source: "frigidaireapplianceparts.com" }),
      "FFSS2615TS0"
    );
    expect(ev.sourceTruthKind).toBe("manufacturer");
  });

  it("Samsung adapter output is classified manufacturer", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ source: "samsungparts.com" }),
      "WF56H9110CW"
    );
    expect(ev.sourceTruthKind).toBe("manufacturer");
  });

  it("Bosch adapter output is classified manufacturer", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ source: "bosch-home.com" }),
      "SHPM88Z75N"
    );
    expect(ev.sourceTruthKind).toBe("manufacturer");
  });

  it("adapterKey fallback used when result has no source", () => {
    const ev = adaptManufacturerResult(
      {
        parts: [{ rawPartNumber: "WB24X10189", sectionName: "Bake Element" }],
        coverage: { paginationComplete: true, flags: [] },
      },
      "JBP35DRWW",
      { adapterKey: "ge-official" }
    );
    expect(ev.sourceTruthKind).toBe("manufacturer");
    expect(ev.provider).toContain("ge-official");
  });

  it("ai-schematic-extraction flag degrades manufacturer to inferred", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ coverage: { paginationComplete: true, flags: ["ai-schematic-extraction"] } }),
      "WF2000"
    );
    expect(ev.sourceTruthKind).toBe("inferred");
  });

  it("ai-search-fallback-used flag degrades manufacturer to inferred", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ coverage: { paginationComplete: true, flags: ["ai-search-fallback-used"] } }),
      "WF2000"
    );
    expect(ev.sourceTruthKind).toBe("inferred");
  });

  it("zero-part manufacturer result has retrievalState failed", () => {
    const ev = adaptManufacturerResult(
      mfrResult({ parts: [], coverage: { paginationComplete: false, flags: [] } }),
      "WF2000"
    );
    expect(ev.retrievalState).toBe("failed");
    expect(ev.confidence).toBe(0);
  });

  it("manufacturer success result has confidence 90", () => {
    const ev = adaptManufacturerResult(mfrResult(), "JBP35DRWW");
    expect(ev.confidence).toBe(90);
  });

  it("assembly sections are preserved", () => {
    const ev = adaptManufacturerResult(
      mfrResult({
        parts: [
          { rawPartNumber: "A1", sectionName: "Drum" },
          { rawPartNumber: "A2", sectionName: "Drum" },
          { rawPartNumber: "A3", sectionName: "Motor" },
        ],
      }),
      "WF2000"
    );
    const drum = ev.assemblySections.find((s) => s.sectionName === "Drum");
    expect(drum?.observedPartCount).toBe(2);
  });
});

// ----- adaptSearsTraversalResult -----

describe("adaptSearsTraversalResult", () => {
  it("Sears diagram traversal is classified third_party", () => {
    const ev = adaptSearsTraversalResult(searsTraversalResult(), "MVWB300WQ2");
    expect(ev.sourceTruthKind).toBe("third_party");
  });

  it("provider is always searspartsdirect.com", () => {
    const ev = adaptSearsTraversalResult(searsTraversalResult(), "MVWB300WQ2");
    expect(ev.provider).toBe(SEARS_DOMAIN);
  });

  it("never classified as manufacturer even when raw part rows carry source:manufacturer", () => {
    const ev = adaptSearsTraversalResult(
      {
        parts: [{ rawPartNumber: "285753A", sectionName: "Drum", source: "manufacturer" }],
        coverage: { paginationComplete: true, flags: [] },
      },
      "MVWB300WQ2"
    );
    expect(ev.sourceTruthKind).toBe("third_party");
    expect(ev.sourceTruthKind).not.toBe("manufacturer");
  });

  it("partial-diagram-fetch flag yields retrievalState partial", () => {
    const ev = adaptSearsTraversalResult(
      searsTraversalResult({
        coverage: { paginationComplete: true, flags: ["partial-diagram-fetch"] },
      }),
      "MVWB300WQ2"
    );
    expect(ev.retrievalState).toBe("partial");
  });

  it("no-diagrams-found flag yields retrievalState partial even with paginationComplete true", () => {
    const ev = adaptSearsTraversalResult(
      searsTraversalResult({
        coverage: { paginationComplete: true, flags: ["no-diagrams-found"] },
      }),
      "MVWB300WQ2"
    );
    expect(ev.retrievalState).toBe("partial");
  });

  it("AI schematic fallback via Sears traversal is classified inferred", () => {
    const ev = adaptSearsTraversalResult(
      searsTraversalResult({
        coverage: {
          paginationComplete: true,
          flags: ["ai-schematic-extraction", "ai-search-fallback-used"],
        },
      }),
      "MVWB300WQ2"
    );
    expect(ev.sourceTruthKind).toBe("inferred");
  });

  it("inferred confidence never exceeds 60", () => {
    const ev = adaptSearsTraversalResult(
      searsTraversalResult({
        coverage: { paginationComplete: true, flags: ["ai-schematic-extraction"] },
      }),
      "MVWB300WQ2"
    );
    expect(ev.confidence).toBeLessThanOrEqual(60);
  });

  it("zero-part traversal yields retrievalState failed", () => {
    const ev = adaptSearsTraversalResult(
      { parts: [], coverage: { paginationComplete: false, flags: [] } },
      "MVWB300WQ2"
    );
    expect(ev.retrievalState).toBe("failed");
  });
});

// ----- adaptGapFillResult — known distributor domains -----

describe("adaptGapFillResult", () => {
  it.each([...KNOWN_DISTRIBUTOR_DOMAINS])(
    "%s catalog result is classified third_party",
    (domain) => {
      const ev = adaptGapFillResult(gapFillResult(domain), "WF2000", domain);
      expect(ev.sourceTruthKind).toBe("third_party");
    }
  );

  it("dlpartsco.com (D&L Parts) is classified third_party", () => {
    const ev = adaptGapFillResult(gapFillResult("dlpartsco.com"), "WF2000", "dlpartsco.com");
    expect(ev.sourceTruthKind).toBe("third_party");
  });

  it("partselect.com is classified third_party", () => {
    const ev = adaptGapFillResult(gapFillResult("partselect.com"), "WF2000", "partselect.com");
    expect(ev.sourceTruthKind).toBe("third_party");
  });

  it("repairclinic.com is classified third_party", () => {
    const ev = adaptGapFillResult(gapFillResult("repairclinic.com"), "WF2000", "repairclinic.com");
    expect(ev.sourceTruthKind).toBe("third_party");
  });

  it("reliableparts.com is classified third_party", () => {
    const ev = adaptGapFillResult(gapFillResult("reliableparts.com"), "WF2000", "reliableparts.com");
    expect(ev.sourceTruthKind).toBe("third_party");
  });

  it("ai-search-fallback-used flag degrades any domain to inferred", () => {
    const ev = adaptGapFillResult(
      gapFillResult("repairclinic.com", {
        coverage: { paginationComplete: false, flags: ["ai-search-fallback-used"] },
      }),
      "WF2000",
      "repairclinic.com"
    );
    expect(ev.sourceTruthKind).toBe("inferred");
  });

  it("ai-search-fallback-disabled flag keeps third_party (no AI ran)", () => {
    const ev = adaptGapFillResult(
      gapFillResult("partselect.com", {
        coverage: { paginationComplete: false, flags: ["ai-search-fallback-disabled"] },
      }),
      "WF2000",
      "partselect.com"
    );
    // disabled means AI was NOT used — domain match still classifies third_party
    expect(ev.sourceTruthKind).toBe("third_party");
  });

  it("empty gap-fill result yields retrievalState failed", () => {
    const ev = adaptGapFillResult(
      { source: "partselect.com", parts: [], coverage: { paginationComplete: false, flags: [] } },
      "WF2000",
      "partselect.com"
    );
    expect(ev.retrievalState).toBe("failed");
    expect(ev.confidence).toBe(0);
  });

  it("third_party success result has confidence 80", () => {
    const ev = adaptGapFillResult(gapFillResult("partselect.com"), "WF2000", "partselect.com");
    expect(ev.confidence).toBe(80);
  });

  it("inferred gap-fill confidence never exceeds 60", () => {
    const ev = adaptGapFillResult(
      gapFillResult("reliableparts.com", {
        coverage: { paginationComplete: true, flags: ["ai-search-fallback-used"] },
      }),
      "WF2000",
      "reliableparts.com"
    );
    expect(ev.confidence).toBeLessThanOrEqual(60);
  });
});

// ----- cross-adapter: classification never bleeds across adapters -----

describe("cross-adapter classification isolation", () => {
  it("manufacturer adapter never produces third_party for OEM domains", () => {
    for (const domain of ["geapplianceparts.com", "whirlpoolparts.com", "lgparts.com"]) {
      const ev = adaptManufacturerResult(mfrResult({ source: domain }), "WF2000");
      expect(ev.sourceTruthKind).not.toBe("third_party");
    }
  });

  it("Sears traversal adapter never produces manufacturer regardless of input", () => {
    const ev = adaptSearsTraversalResult(
      mfrResult({ source: "geapplianceparts.com" }),
      "WF2000"
    );
    expect(ev.sourceTruthKind).not.toBe("manufacturer");
    expect(ev.sourceTruthKind).toBe("third_party");
  });

  it("gap-fill adapter never produces manufacturer for any distributor domain", () => {
    for (const domain of KNOWN_DISTRIBUTOR_DOMAINS) {
      const ev = adaptGapFillResult(gapFillResult(domain), "WF2000", domain);
      expect(ev.sourceTruthKind).not.toBe("manufacturer");
    }
  });
});
