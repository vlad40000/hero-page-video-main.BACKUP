export type ProviderEvidence = {
  supplier: string;
  method: string;
  url?: string | null;
  partMentioned: boolean;
  priceFound: boolean;
  checkedAt: string;
  error?: string | null;
};

export type BOMAssemblySection = {
  sectionName: string;
  expectedPartCount: number;
  observedPartCount: number;
};

export type BOMProviderEvidence = {
  provider: string;
  modelNumber: string;
  sourceUrl: string | null;
  sourceTruthKind: "manufacturer" | "third_party" | "inferred" | "unknown";
  retrievalState: "success" | "partial" | "failed" | "pending";
  confidence: number;
  assemblySections: BOMAssemblySection[];
  parts: string[];
};

export type ProviderPlan = {
  source: string;
  cacheTable?: string;
  profile?: any;
};
