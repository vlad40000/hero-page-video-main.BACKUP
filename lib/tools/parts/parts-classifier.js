import { evaluateBomCompletion } from '@/lib/tools/parts/bom-completion-gates';
import { normalizeBomRetrievalState } from '@/lib/tools/parts/retrieval-state';

export const RETRIEVAL_TARGETS = {
  minVerifiedParts: 40,
  minAssembliesCovered: 4,
  minSourcesTried: 3,
  minCoverageScore: 0.7,
  minPartsPerBucket: 3,
};

export const BUCKET_KEYWORDS = {
  control: ['control', 'panel', 'interface', 'board', 'display', 'timer', 'knob', 'touch', 'switch'],
  cabinet: ['cabinet', 'outer', 'case', 'top', 'base', 'frame', 'housing', 'door', 'lid', 'handle'],
  interior: ['drum', 'tub', 'basket', 'rack', 'shelf', 'bin', 'drawer', 'light', 'liner', 'seal', 'gasket', 'hinge'],
  thermal_engine: ['motor', 'compressor', 'pump', 'belt', 'drive', 'transmission', 'fan', 'blower', 'evaporator', 'condenser', 'heater', 'element', 'burner', 'igniter', 'spark', 'magnetron'],
  fluid_plumbing: ['hose', 'valve', 'drain', 'fill', 'distributor', 'dispenser', 'water', 'filter', 'ice', 'maker', 'spray', 'arm'],
  sensor_elec: ['sensor', 'thermistor', 'switch', 'wiring', 'harness', 'cord', 'fuse', 'protector', 'overload', 'solenoid'],
  misc: ['hardware', 'screw', 'clip', 'clamp', 'manual', 'label', 'feet', 'leg', 'accessory', 'spring', 'bracket'],
};

/**
 * @typedef {('empty'|'below_floor'|'partial'|'target_met'|'complete'|'blocked')} RetrievalStatus
 */

/**
 * Classifies the result of a parts retrieval pass into 6 legacy explicit states.
 * Kept for compatibility while the canonical BOM gate is wired through the app.
 */
export function classifyResult({
  verifiedRows = 0,
  assembliesCovered = 0,
  sourcesTried = 0,
  coverageScore = 0,
  blocked = false,
}) {
  if (verifiedRows === 0) {
    return blocked ? 'blocked' : 'empty';
  }

  if (verifiedRows < RETRIEVAL_TARGETS.minVerifiedParts) {
    return blocked ? 'blocked' : 'below_floor';
  }

  if (assembliesCovered < RETRIEVAL_TARGETS.minAssembliesCovered || coverageScore < RETRIEVAL_TARGETS.minCoverageScore) {
    return blocked ? 'blocked' : 'partial';
  }

  if (sourcesTried < RETRIEVAL_TARGETS.minSourcesTried) {
    return 'target_met';
  }

  return 'complete';
}

export function calculateBucketCoverage(parts = []) {
  const bucketCounts = {};
  Object.keys(BUCKET_KEYWORDS).forEach(k => bucketCounts[k] = 0);

  parts.forEach(part => {
    // Reconciled parts use canonicalPartName and normalizedSection
    const text = `${part.normalizedSection || part.section || ''} ${part.canonicalPartName || part.name || ''}`.toLowerCase();
    for (const [key, keywords] of Object.entries(BUCKET_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        bucketCounts[key]++;
        break;
      }
    }
  });

  const coveredBuckets = Object.entries(bucketCounts).filter(([_, count]) => count >= RETRIEVAL_TARGETS.minPartsPerBucket);
  return {
    count: coveredBuckets.length,
    buckets: coveredBuckets.map(([k]) => k),
  };
}

function countTrustedSources(session = {}) {
  const trace = session.retrievalTrace || {};
  const providerAttempts = Array.isArray(trace.providerAttempts) ? trace.providerAttempts : [];
  if (providerAttempts.length > 0) return providerAttempts.length;
  return Object.values(trace).filter(v => v === true).length || 1;
}

export function calculateCanonicalBomGate(reconciled = {}, session = {}, options = {}) {
  const masterParts = reconciled.masterParts || [];
  const coverage = calculateBucketCoverage(masterParts);
  const sourceCount = countTrustedSources(session);
  const sectionCount = reconciled.sectionCount || coverage.count || options.sectionCount || 0;
  const actualCanonicalPartCount = masterParts.length;
  const completenessScore = Number(reconciled.completenessScore || 0);

  const trustedTotalPartCount =
    options.trustedTotalPartCount ??
    options.expectedPartCount ??
    session.trustedTotalPartCount ??
    session.expectedPartCount ??
    null;

  return evaluateBomCompletion({
    identityResolved: Boolean(session.identity || session.canonicalModel || session.request?.modelNumber),
    failed: session.status === 'blocked' || session.status === 'failed' || options.failed === true,
    existingState: session.status,
    trustedTotalPartCount,
    expectedPartCount: options.expectedPartCount ?? null,
    actualCanonicalPartCount,
    manifestRowCount: options.manifestRowCount ?? actualCanonicalPartCount,
    requiredManifestRowCount: options.requiredManifestRowCount ?? trustedTotalPartCount ?? actualCanonicalPartCount,
    mappedRequiredManifestRowCount: options.mappedRequiredManifestRowCount ?? actualCanonicalPartCount,
    unresolvedRequiredManifestRowCount: options.unresolvedRequiredManifestRowCount ?? 0,
    requiredPriceCount: options.requiredPriceCount ?? trustedTotalPartCount ?? actualCanonicalPartCount,
    verifiedPriceCount: options.verifiedPriceCount ?? 0,
    sourceCount,
    sectionCount,
  });
}

export function calculateCompleteness(reconciled, session) {
  const masterCount = reconciled.masterParts?.length || 0;
  const coverage = calculateBucketCoverage(reconciled.masterParts || []);
  const sourcesTried = countTrustedSources(session);
  const coverageScore = Math.min(1.0, coverage.count / (RETRIEVAL_TARGETS.minAssembliesCovered + 1));

  const status = classifyResult({
    verifiedRows: masterCount,
    assembliesCovered: coverage.count,
    sourcesTried,
    coverageScore,
    blocked: session.status === 'blocked' || session.status === 'failed',
  });

  const bomGate = calculateCanonicalBomGate(reconciled, session, {
    sectionCount: coverage.count,
  });

  return {
    status,
    retrievalState: bomGate.retrievalState,
    bomGate,
    masterCount,
    coverage,
    sourcesTried,
    coverageScore,
  };
}

export function classifyBomResult({
  masterRowCount = 0,
  sectionCount = 0,
  paginationComplete = false,
  flags = [],
  trustedTotalPartCount = null,
  expectedPartCount = null,
  requiredPriceCount = null,
  verifiedPriceCount = 0,
  sourceCount = null,
  identityResolved = true,
  failed = false,
  canonical = false,
}) {
  const legacyStatus = (() => {
    if (masterRowCount === 0) return failed ? 'blocked' : 'empty';
    if (masterRowCount < RETRIEVAL_TARGETS.minVerifiedParts) return 'below_floor';
    if (sectionCount < RETRIEVAL_TARGETS.minAssembliesCovered) return 'partial';
    return 'complete';
  })();

  if (!canonical) return legacyStatus;

  return evaluateBomCompletion({
    identityResolved,
    failed,
    existingState: normalizeBomRetrievalState(legacyStatus),
    trustedTotalPartCount,
    expectedPartCount,
    actualCanonicalPartCount: masterRowCount,
    manifestRowCount: masterRowCount,
    requiredManifestRowCount: trustedTotalPartCount ?? expectedPartCount ?? masterRowCount,
    mappedRequiredManifestRowCount: masterRowCount,
    unresolvedRequiredManifestRowCount: 0,
    requiredPriceCount: requiredPriceCount ?? trustedTotalPartCount ?? expectedPartCount ?? masterRowCount,
    verifiedPriceCount,
    sourceCount,
    sectionCount,
  }).retrievalState;
}
