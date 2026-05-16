export type ProviderEvidence = {
  supplier: string;
  method: string;
  url?: string | null;
  partMentioned: boolean;
  priceFound: boolean;
  checkedAt: string;
  error?: string | null;
};

export type ProviderPlan = {
  source: string;
  cacheTable?: string;
  profile?: any;
};
