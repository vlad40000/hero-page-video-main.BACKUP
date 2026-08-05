import type { BOMProviderEvidence, BOMAssemblySection } from "./schemas";

const PARTIAL_FLAGS = new Set([
  "ai-schematic-extraction",
  "ai-search-fallback-used",
  "partial-diagram-fetch",
  "no-diagrams-found",
  "section-fetch-failures",
  "manufacturer-empty-result",
  "manufacturer-no-parts",
  "ai-search-fallback-disabled",
]);

export function buildBOMProviderEvidence({
  stageResult,
  modelNumber,
  provider,
  stage
}: {
  stageResult: any;
  modelNumber: string;
  provider: string;
  stage: string;
}): BOMProviderEvidence {
  const parts = stageResult?.parts || [];
  const sources = stageResult?.sources || [];
  const flags: string[] = stageResult?.coverage?.flags || [];
  const source = String(provider || stageResult?.source || "").toLowerCase();

  let sourceTruthKind: "manufacturer" | "third_party" | "inferred" | "unknown" = "unknown";

  if (flags.includes("ai-schematic-extraction") || flags.includes("ai-search-fallback-used")) {
    sourceTruthKind = "inferred";
  } else if (
    source.includes("sears") ||
    source.includes("encompass") ||
    source.includes("partselect") ||
    source.includes("repairclinic") ||
    source.includes("reliableparts") ||
    source.includes("dlpartsco") ||
    source.includes("distributor") ||
    source.includes("third_party") ||
    stage.includes("fallback")
  ) {
    sourceTruthKind = "third_party";
  } else if (source.includes("manufacturer") || (stage === "manufacturer" && sourceTruthKind === "unknown")) {
    sourceTruthKind = "manufacturer";
  }

  const hasPartialFlag = flags.some(f => PARTIAL_FLAGS.has(f));

  let retrievalState: "success" | "partial" | "failed" | "pending" = "pending";
  if (parts.length === 0) {
    retrievalState = "failed";
  } else if (hasPartialFlag || !stageResult?.coverage?.paginationComplete) {
    retrievalState = "partial";
  } else {
    retrievalState = "success";
  }

  const sectionCounts: Record<string, number> = {};
  for (const part of parts) {
    const sName = String(part?.sectionName || part?.section || part?.rawCategory || "General Assembly").trim();
    sectionCounts[sName] = (sectionCounts[sName] || 0) + 1;
  }

  const assemblySections: BOMAssemblySection[] = Object.entries(sectionCounts).map(([sectionName, count]) => ({
    sectionName,
    expectedPartCount: count,
    observedPartCount: count
  }));

  let sourceUrl = null;
  if (sources.length > 0) {
    sourceUrl = sources[0].uri || sources[0].url || sources[0].title || null;
  }

  const partNumbers = parts.map((p: any) => p.rawPartNumber || p.partNumber).filter(Boolean);

  let confidence = 0;
  if (parts.length > 0) {
    if (sourceTruthKind === "inferred") {
      confidence = retrievalState === "partial" ? 50 : 60;
    } else if (sourceTruthKind === "unknown") {
      confidence = retrievalState === "partial" ? 40 : 50;
    } else if (retrievalState === "success") {
      confidence = sourceTruthKind === "manufacturer" ? 90 : 80;
    } else {
      // partial state for manufacturer or third_party — capped at 75
      confidence = sourceTruthKind === "manufacturer" ? 70 : 65;
    }
  }

  return {
    provider: source || stage,
    modelNumber,
    sourceUrl,
    sourceTruthKind,
    retrievalState,
    confidence,
    assemblySections,
    parts: partNumbers
  };
}
