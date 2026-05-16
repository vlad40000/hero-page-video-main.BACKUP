import type { BOMProviderEvidence, BOMAssemblySection } from "./schemas";

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
  const flags = stageResult?.coverage?.flags || [];
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

  let retrievalState: "success" | "partial" | "failed" | "pending" = "pending";
  if (parts.length === 0) {
    retrievalState = "failed";
  } else if (stageResult?.coverage?.paginationComplete) {
    retrievalState = "success";
  } else {
    retrievalState = "partial";
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

  return {
    provider: source || stage,
    modelNumber,
    sourceUrl,
    sourceTruthKind,
    retrievalState,
    confidence: parts.length > 0 ? (sourceTruthKind === 'inferred' ? 0.6 : 0.9) : 0,
    assemblySections,
    parts: partNumbers
  };
}
