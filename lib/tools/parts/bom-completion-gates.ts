import {
  BomRetrievalState,
  normalizeBomRetrievalState,
} from '@/lib/tools/parts/retrieval-state';

export type BomCompletionInput = {
  identityResolved?: boolean;
  failed?: boolean;

  trustedTotalPartCount?: number | null;
  expectedPartCount?: number | null;
  actualCanonicalPartCount?: number | null;
  actualPartCount?: number | null;

  manifestRowCount?: number | null;
  requiredManifestRowCount?: number | null;
  mappedRequiredManifestRowCount?: number | null;
  unresolvedRequiredManifestRowCount?: number | null;

  requiredPriceCount?: number | null;
  verifiedPriceCount?: number | null;

  sourceCount?: number | null;
  sectionCount?: number | null;
  existingState?: unknown;
};

export type BomCompletionGateResult = {
  retrievalState: BomRetrievalState;
  partsComplete: boolean;
  pricingComplete: boolean;
  bomComplete: boolean;
  cacheReusable: boolean;
  shouldContinueRetrieval: boolean;
  trustedTotalPartCount: number | null;
  actualCanonicalPartCount: number;
  requiredManifestRowCount: number;
  mappedRequiredManifestRowCount: number;
  unresolvedRequiredManifestRowCount: number;
  requiredPriceCount: number;
  verifiedPriceCount: number;
  coverageRatio: number | null;
  pricingCoverageRatio: number | null;
  reasons: string[];
  warnings: string[];
};

function toCount(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function toOptionalPositiveCount(value: unknown): number | null {
  const count = toCount(value, 0);
  return count > 0 ? count : null;
}

function ratio(numerator: number, denominator: number | null): number | null {
  if (!denominator || denominator <= 0) return null;
  return Math.max(0, Math.min(1, numerator / denominator));
}

export function evaluateBomCompletion(input: BomCompletionInput): BomCompletionGateResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const existingState = normalizeBomRetrievalState(input.existingState, 'identity_only');

  const identityResolved = Boolean(input.identityResolved);
  const failed = Boolean(input.failed) || existingState === 'failed';

  const trustedTotalPartCount =
    toOptionalPositiveCount(input.trustedTotalPartCount) ??
    toOptionalPositiveCount(input.expectedPartCount);

  const actualCanonicalPartCount = toCount(
    input.actualCanonicalPartCount ?? input.actualPartCount,
    0,
  );

  const manifestRowCount = toCount(input.manifestRowCount, 0);
  const requiredManifestRowCount = toCount(input.requiredManifestRowCount, trustedTotalPartCount ?? 0);
  const mappedRequiredManifestRowCount = toCount(
    input.mappedRequiredManifestRowCount,
    Math.min(actualCanonicalPartCount, requiredManifestRowCount || actualCanonicalPartCount),
  );
  const unresolvedRequiredManifestRowCount = toCount(
    input.unresolvedRequiredManifestRowCount,
    requiredManifestRowCount > 0
      ? Math.max(0, requiredManifestRowCount - mappedRequiredManifestRowCount)
      : 0,
  );

  const requiredPriceCount = toCount(input.requiredPriceCount, trustedTotalPartCount ?? actualCanonicalPartCount);
  const verifiedPriceCount = toCount(input.verifiedPriceCount, 0);
  const sourceCount = toCount(input.sourceCount, 0);
  const sectionCount = toCount(input.sectionCount, 0);

  if (failed) {
    reasons.push('Retrieval failed or provider fallback was exhausted.');
  }

  if (!identityResolved) {
    reasons.push('No resolved appliance identity.');
  }

  if (!trustedTotalPartCount) {
    reasons.push('No trusted expected part count has been accepted.');
  }

  if (actualCanonicalPartCount === 0) {
    reasons.push('No canonical BOM rows are available.');
  }

  if (trustedTotalPartCount && manifestRowCount > 0 && manifestRowCount < trustedTotalPartCount) {
    warnings.push(`Manifest has ${manifestRowCount} rows, trusted count requires ${trustedTotalPartCount}.`);
  }

  if (requiredManifestRowCount > 0 && unresolvedRequiredManifestRowCount > 0) {
    warnings.push(`${unresolvedRequiredManifestRowCount} required manifest row(s) are unresolved.`);
  }

  if (sectionCount === 0 && actualCanonicalPartCount > 0) {
    warnings.push('Part rows exist, but no assembly/section coverage was reported.');
  }

  const hasRequiredManifestCoverage = requiredManifestRowCount > 0
    ? mappedRequiredManifestRowCount >= requiredManifestRowCount && unresolvedRequiredManifestRowCount === 0
    : Boolean(trustedTotalPartCount && actualCanonicalPartCount >= trustedTotalPartCount);

  const meetsTrustedCount = Boolean(
    trustedTotalPartCount && actualCanonicalPartCount >= trustedTotalPartCount,
  );

  const partsComplete = Boolean(
    identityResolved &&
    trustedTotalPartCount &&
    actualCanonicalPartCount > 0 &&
    meetsTrustedCount &&
    hasRequiredManifestCoverage,
  );

  const pricingComplete = Boolean(
    partsComplete &&
    requiredPriceCount > 0 &&
    verifiedPriceCount >= requiredPriceCount,
  );

  let retrievalState: BomRetrievalState;

  if (failed) {
    retrievalState = 'failed';
  } else if (!identityResolved) {
    retrievalState = 'no_result';
  } else if (!trustedTotalPartCount && sourceCount === 0 && actualCanonicalPartCount === 0) {
    retrievalState = 'identity_only';
  } else if (!trustedTotalPartCount && sourceCount > 0 && actualCanonicalPartCount === 0) {
    retrievalState = 'sources_resolved';
  } else if (!partsComplete) {
    retrievalState = actualCanonicalPartCount > 0 || sourceCount > 0 ? 'parts_partial' : 'identity_only';
  } else if (pricingComplete) {
    retrievalState = 'bom_complete';
  } else if (verifiedPriceCount > 0) {
    retrievalState = 'parts_complete_pricing_partial';
  } else {
    retrievalState = 'parts_complete_pricing_missing';
  }

  if (retrievalState === 'bom_complete' && actualCanonicalPartCount === 0) {
    retrievalState = 'failed';
    reasons.push('Guardrail prevented zero-row BOM from being marked complete.');
  }

  const cacheReusable = retrievalState === 'bom_complete'
    || retrievalState === 'parts_complete_pricing_missing'
    || retrievalState === 'parts_complete_pricing_partial';

  const shouldContinueRetrieval = retrievalState === 'identity_only'
    || retrievalState === 'sources_resolved'
    || retrievalState === 'parts_partial'
    || retrievalState === 'parts_complete_pricing_missing'
    || retrievalState === 'parts_complete_pricing_partial';

  return {
    retrievalState,
    partsComplete,
    pricingComplete,
    bomComplete: retrievalState === 'bom_complete',
    cacheReusable,
    shouldContinueRetrieval,
    trustedTotalPartCount,
    actualCanonicalPartCount,
    requiredManifestRowCount,
    mappedRequiredManifestRowCount,
    unresolvedRequiredManifestRowCount,
    requiredPriceCount,
    verifiedPriceCount,
    coverageRatio: ratio(actualCanonicalPartCount, trustedTotalPartCount),
    pricingCoverageRatio: ratio(verifiedPriceCount, requiredPriceCount || null),
    reasons,
    warnings,
  };
}

export function isReusableBomCache(input: BomCompletionInput): boolean {
  return evaluateBomCompletion(input).cacheReusable;
}

export function isBomComplete(input: BomCompletionInput): boolean {
  return evaluateBomCompletion(input).bomComplete;
}
