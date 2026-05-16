const PROVIDER_CAPABILITIES = {
  'dlpartsco.com': {
    availability: 'accessible',
    reason: 'Deterministic D&L Parts catalog adapter is registered.',
  },
  'encompass.com': {
    availability: 'accessible',
    reason: 'Deterministic Encompass exploded-view/model parts adapter is registered.',
  },
  'searspartsdirect.com': {
    availability: 'accessible',
    reason: 'Deterministic Sears catalog adapter is registered.',
  },
  'whirlpoolparts.com': {
    availability: 'accessible',
    reason: 'Whirlpool-family manufacturer adapter is registered.',
  },
  'geapplianceparts.com': {
    availability: 'accessible',
    reason: 'GE manufacturer adapter is registered.',
  },
  'frigidaireapplianceparts.com': {
    availability: 'accessible',
    reason: 'Frigidaire/Electrolux manufacturer adapter is registered.',
  },
  'lgparts.com': {
    availability: 'accessible',
    reason: 'LG manufacturer adapter is registered.',
  },
  'samsungparts.com': {
    availability: 'accessible',
    reason: 'Samsung manufacturer adapter is registered.',
  },
  'fix.com': {
    availability: 'requires_manual_review',
    reason: 'Fix.com deterministic BOM adapter is not registered in this app.',
  },
  'partselect.com': {
    availability: 'requires_manual_review',
    reason: 'PartSelect deterministic BOM adapter is not registered in this app.',
  },
  'reliableparts.com': {
    availability: 'requires_manual_review',
    reason: 'ReliableParts deterministic BOM adapter is not registered in this app.',
  },
  'repairclinic.com': {
    availability: 'requires_manual_review',
    reason: 'RepairClinic deterministic BOM adapter is not registered in this app.',
  },
};

export function normalizeProviderDomain(provider) {
  return String(provider || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
}

export function getProviderCapability(provider) {
  const domain = normalizeProviderDomain(provider);
  return PROVIDER_CAPABILITIES[domain] || {
    availability: 'requires_manual_review',
    reason: 'No deterministic provider adapter is registered.',
  };
}

export function buildProviderAttempt({
  provider,
  stage = null,
  availability = null,
  reason = '',
  partsCount = 0,
  sectionCount = 0,
  sourceUrl = null,
}) {
  const domain = normalizeProviderDomain(provider);
  const capability = getProviderCapability(domain);

  return {
    provider: domain || String(provider || 'unknown'),
    stage,
    availability: availability || capability.availability,
    reason: reason || capability.reason,
    partsCount: Number(partsCount) || 0,
    sectionCount: Number(sectionCount) || 0,
    sourceUrl,
  };
}

export function availabilityFromError(error) {
  const status = Number(error?.status || error?.cause?.status || 0);
  const message = String(error?.message || '');
  if (status === 403 || /\b403\b/.test(message)) {
    return {
      availability: 'blocked_403',
      reason: 'Provider returned HTTP 403.',
    };
  }

  return {
    availability: 'requires_manual_review',
    reason: message || 'Provider request failed.',
  };
}

export function providerAttemptFromResult(provider, result = {}, stage = null) {
  const parts = Array.isArray(result.parts)
    ? result.parts
    : Array.isArray(result.rows)
      ? result.rows
      : [];
  const sections = new Set(
    parts
      .map((part) => part?.sectionName || part?.section || part?.rawCategory)
      .filter(Boolean)
  );
  const flags = result.coverage?.flags || result.flags || [];
  const sourceUrl =
    result.modelUrl ||
    result.sources?.[0]?.uri ||
    result.sources?.[0]?.url ||
    null;

  let availability = parts.length > 0 ? 'accessible' : getProviderCapability(provider).availability;
  let reason = parts.length > 0
    ? 'Provider returned parts.'
    : result.coverage?.retrievalState || result.retrievalState || getProviderCapability(provider).reason;

  if (flags.includes('provider-blocked-403')) {
    availability = 'blocked_403';
    reason = 'Provider returned HTTP 403.';
  } else if (flags.includes('manufacturer-no-parts') || flags.includes('manufacturer-empty-result')) {
    reason = 'Manufacturer adapter returned no parts.';
  } else if (flags.includes('ai-search-fallback-disabled')) {
    availability = 'requires_manual_review';
    reason = 'AI/search fallback is disabled and no deterministic adapter returned parts.';
  }

  return buildProviderAttempt({
    provider,
    stage,
    availability,
    reason,
    partsCount: parts.length,
    sectionCount: sections.size || Number(result.coverage?.sectionsDiscovered || 0),
    sourceUrl,
  });
}

export function mergeProviderAttempts(...attemptGroups) {
  const out = [];
  const seen = new Set();

  for (const group of attemptGroups) {
    for (const attempt of group || []) {
      if (!attempt) continue;
      const key = `${attempt.provider}|${attempt.stage}|${attempt.availability}|${attempt.reason}|${attempt.sourceUrl || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(attempt);
    }
  }

  return out;
}
