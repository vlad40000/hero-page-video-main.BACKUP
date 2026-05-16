export type PartFinderStatus =
  | "bom_complete"
  | "parts_partial"
  | "needs_fallback"
  | "no_result"
  | "variant_resolution_needed";

export type PartFinderPart = {
  canonicalPartNumber: string;
  canonicalPartName: string;
  normalizedCategory?: string | null;
  normalizedSection?: string | null;
  preferredSource?: string | null;
  serialApplicability?: string[] | null;
  conflictFlags?: unknown[];
  retailPrice?: number | null;
  retailPriceText?: string | null;
  retailAvailability?: string | null;
  retailPricingUrl?: string | null;
  retailPriceSource?: string | null;
  retailPriceVerified?: boolean;
};

export type PartFinderSource = {
  title: string;
  uri: string;
};

export type PartFinderVariantCandidate = {
  revision: string;
  label: string;
  confidence?: number;
};

export type PartFinderResponse = {
  status: PartFinderStatus;
  message: string;
  searchSessionId: string | null;
  hasMore: boolean;
  nextStage: string | null;

  modelNumber: string | null;
  canonicalModel?: string | null;
  brand?: string | null;
  productType?: string | null;
  serialNumberUsed?: string | null;

  parts: PartFinderPart[];
  partsShown?: number;
  partsKnownSoFar?: number;
  partsFilteredCount?: number;

  sources: PartFinderSource[];
  review?: {
    summary?: string;
    confidence?: string;
  } | null;

  candidates?: PartFinderVariantCandidate[];
  reason?: string;
  cache?: string;
  applicabilityMode?: string;
};

export type StartSearchInput = {
  action: "start";
  modelNumber: string;
  serialNumber?: string;
  partNumber?: string;
  partDescription?: string;
  brand?: string;
  productType?: string;
  exhaustiveMode?: boolean;
};

export type ContinueSearchInput = {
  action: "continue";
  searchSessionId: string;
  revision?: string;
};

export type PartFinderRequest = StartSearchInput | ContinueSearchInput;

export type ExtractedModelPayload = {
  modelNumber?: string | null;
  serialNumber?: string | null;
  brand?: string | null;
  productType?: string | null;
  engineeringCode?: string | null;
  normalizedModel?: string | null;
  normalizedSerial?: string | null;
  imageUrl?: string | null;
  cache?: string | null;
};
