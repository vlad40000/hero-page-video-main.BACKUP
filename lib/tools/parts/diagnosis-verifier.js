import 'server-only';

import { normalizePartNumber } from '@/lib/tools/parts/http';
import { resolveEncompassPricesForParts } from '@/lib/tools/parts/pricing/encompass';
import { applyEncompassPriceSnapshot, getPartNumberFromStore, upsertPartNumberToStore } from '@/lib/tools/parts/part-number-store';
import { resolveDiagnosticPartCandidates } from '@/lib/tools/parts/diagnostic-part-search';
import { getStoredPriceSnapshot } from '@/lib/tools/parts/warehouse-store';

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'assembly', 'assy', 'part', 'appliance', 'dryer', 'washer', 'refrigerator', 'dishwasher', 'range', 'oven']);

const SYMPTOM_HINTS = [
  {
    match: /\bleak|leaking|water\s+under|water\s+on\s+floor/i,
    terms: [
      'fill hose',
      'inlet hose',
      'hose',
      'drain pump',
      'pump',
      'tub seal',
      'seal',
      'bearing',
      'tub to pump',
      'clamp',
      'valve',
      'water inlet',
    ],
  },
  {
    match: /\bdrain|standing water|won'?t empty|not empty/i,
    terms: ['drain pump', 'pump', 'tub to pump', 'drain hose', 'hose'],
  },
  {
    match: /\bfill|no water|slow fill|overfill/i,
    terms: ['water inlet', 'inlet valve', 'fill hose', 'valve', 'hose'],
  },
  {
    match: /\bshake|shaking|bang|banging|off balance|vibration/i,
    terms: ['suspension', 'damper', 'spring', 'shock', 'bearing', 'basket hub', 'hub'],
  },
  {
    match: /\block|lid|door/i,
    terms: ['lid lock', 'door lock', 'latch', 'strike', 'switch'],
  },
];

function words(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function tokenOverlapScore(a, b) {
  const left = new Set(words(a));
  const right = new Set(words(b));
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / Math.max(left.size, right.size);
}

function symptomTerms(result) {
  const text = `${result.issue || ''} ${result.partName || result.part_name || ''} ${result.description || ''}`;
  return SYMPTOM_HINTS
    .filter((hint) => hint.match.test(text))
    .flatMap((hint) => hint.terms);
}

function hintScore(terms, part) {
  if (!terms.length) return 0;
  const haystack = `${part.partName || ''} ${part.category || ''} ${part.section || ''}`.toLowerCase();
  let best = 0;
  for (const term of terms) {
    const normalized = term.toLowerCase();
    if (haystack.includes(normalized)) best = Math.max(best, Math.min(0.62, 0.42 + normalized.split(/\s+/).length * 0.06));
  }
  return best;
}

function candidatePartNameScore(candidateName, part) {
  const candidateTokens = words(candidateName);
  if (!candidateTokens.length) return 0;

  const partNameTokens = new Set(words(part.partName || ''));
  const partTokens = new Set(words(`${part.partName || ''} ${part.category || ''} ${part.section || ''}`));
  const hits = candidateTokens.filter((token) => partTokens.has(token)).length;
  const coverage = hits / candidateTokens.length;
  const criticalTokens = candidateTokens.filter((token) => ['pump', 'hose', 'seal', 'bearing', 'valve', 'lock', 'latch', 'gasket'].includes(token));
  const criticalNameHits = criticalTokens.filter((token) => partNameTokens.has(token)).length;

  let score = 0;
  if (coverage >= 0.75) score = 0.92 + coverage * 0.08;
  else if (coverage >= 0.5) score = 0.76 + coverage * 0.12;
  else if (coverage > 0) score = 0.42 + coverage * 0.2;
  else return 0;

  if (criticalTokens.length && criticalNameHits === 0) score = Math.min(score, 0.7);
  if (criticalNameHits > 0) score = Math.min(1, score + criticalNameHits * 0.08);
  if (candidateTokens.includes('pump')) {
    if (partNameTokens.has('pump') && !partNameTokens.has('hose')) score = Math.min(1, score + 0.12);
    if (partNameTokens.has('hose') && !candidateTokens.includes('hose')) score = Math.max(0, score - 0.14);
  }
  if (candidateTokens.includes('seal') || candidateTokens.includes('bearing')) {
    if (partNameTokens.has('bearing') || partNameTokens.has('seal')) score = Math.min(1, score + 0.1);
    if (partNameTokens.has('sealant')) score = Math.max(0, score - 0.2);
  }
  return score;
}

function findMatchingPart(result, contextParts = []) {
  const candidatePartNumber = normalizePartNumber(result.partNumber || result.part_number || '');
  if (candidatePartNumber) {
    const exact = contextParts.find((part) => part.partNumber === candidatePartNumber || (part.substitutePartNumbers || []).map(normalizePartNumber).includes(candidatePartNumber));
    if (exact) return { part: exact, matchType: 'part_number_exact', score: 1 };
  }

  const candidateName = result.partName || result.part_name || result.issue || '';
  const hints = symptomTerms(result);
  let best = null;
  for (const part of contextParts) {
    const score = Math.max(
      candidatePartNameScore(candidateName, part),
      tokenOverlapScore(candidateName, part.partName),
      tokenOverlapScore(candidateName, `${part.partName} ${part.category || ''} ${part.section || ''}`),
      hintScore(hints, part)
    );
    if (!best || score > best.score) best = { part, matchType: 'name_overlap', score };
  }

  return best && best.score >= 0.34 ? best : null;
}

function normalizeProbability(value) {
  const raw = String(value || '').trim();
  if (/^high$/i.test(raw)) return 'High';
  if (/^medium$/i.test(raw)) return 'Medium';
  if (/^low$/i.test(raw)) return 'Low';
  return raw || 'Medium';
}

function clampLaborHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1.5;
  return Math.max(0.25, Math.min(6, n));
}

function boundedInteger(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function centsRounded(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue * 100) / 100 : 0;
}

function hasVerifiedPrice(snapshot) {
  return Boolean(snapshot?.retailPriceVerified && centsRounded(snapshot?.retailPrice) > 0);
}

function normalizeContextStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'complete' || value === 'target_met' || value === 'bom_complete') return 'bom_complete';
  if (value === 'partial' || value === 'below_floor' || value === 'parts_partial') return 'parts_partial';
  if (value === 'empty' || value === 'no_result') return 'no_result';
  if (value === 'variant_resolution_needed') return 'variant_resolution_needed';
  if (value === 'needs_fallback') return 'needs_fallback';
  return value || 'no_result';
}

function cachedPriceSnapshot(record) {
  const payload = record?.pricePayload;
  if (!payload?.retailPriceVerified) return null;

  const maxAgeHours = boundedInteger(process.env.DIAGNOSIS_PRICE_CACHE_MAX_AGE_HOURS, 168, 1, 24 * 30);
  const checkedAt = record.priceCheckedAt || payload.retailPricedAt;
  const checkedTime = checkedAt ? new Date(checkedAt).getTime() : 0;
  if (!checkedTime || Date.now() - checkedTime > maxAgeHours * 60 * 60 * 1000) return null;

  const retailPrice = centsRounded(Number(payload.retailPrice) || (Number(record.latestPriceCents) > 0 ? Number(record.latestPriceCents) / 100 : 0));
  if (!Number.isFinite(retailPrice) || retailPrice <= 0) return null;

  return {
    ...payload,
    retailPrice,
    retailPriceText: payload.retailPriceText || `$${retailPrice.toFixed(2)}`,
    retailPriceSource: payload.retailPriceSource || record.priceSource || 'supplier_catalog',
    retailPriceVerified: true,
    retailPricedAt: payload.retailPricedAt || checkedAt,
    priceCacheHit: true,
  };
}

function priceCacheKey(modelNumber, partNumber) {
  return `${String(modelNumber || '').trim().toUpperCase()}|${normalizePartNumber(partNumber)}`;
}

function snapshotFromTargetedCandidate(candidate) {
  const retailPrice = centsRounded(candidate?.retailPrice);
  if (!Number.isFinite(retailPrice) || retailPrice <= 0 || candidate?.retailPriceVerified !== true) return null;

  return {
    partNumber: candidate.partNumber,
    retailPrice,
    retailPriceText: candidate.retailPriceText || `$${retailPrice.toFixed(2)}`,
    retailAvailability: candidate.retailAvailability || null,
    retailPricingUrl: candidate.retailPricingUrl || candidate.sourceUrl || null,
    retailPriceSource: candidate.retailPriceSource || candidate.source || 'targeted_part_search',
    retailPriceVerified: true,
    retailPricedAt: candidate.retailPricedAt || new Date().toISOString(),
    pricingEvidence: [{
      supplier: candidate.retailPriceSource || candidate.source,
      method: 'targeted_part_fitment_search',
      url: candidate.retailPricingUrl || candidate.sourceUrl,
      partMentioned: true,
      priceFound: true,
      checkedAt: candidate.retailPricedAt || new Date().toISOString(),
    }],
  };
}

async function resolveTargetedPriceSnapshot({
  raw,
  fallbackIndex,
  verifiedPartNumber,
  verifiedPartName,
  partsContext,
  modelNumber,
}) {
  const [candidate] = await resolveDiagnosticPartCandidates({
    brand: partsContext.brand,
    modelNumber,
    productType: partsContext.productType,
    candidates: [{
      candidateIndex: fallbackIndex,
      issue: raw.issue,
      partName: verifiedPartName || raw.partName || raw.part_name,
      partNumber: verifiedPartNumber,
    }],
  });

  return snapshotFromTargetedCandidate(candidate);
}

export async function verifyDiagnosticResultsWithPartsContext(results = [], partsContext = {}, options = {}) {
  const contextParts = Array.isArray(partsContext.parts) ? partsContext.parts : [];
  const verified = [];
  const modelNumber = partsContext.canonicalModel || partsContext.normalizedModel || partsContext.modelNumber || '';
  const maxResults = boundedInteger(options.maxResults ?? process.env.DIAGNOSIS_VERIFY_MAX_RESULTS, 3, 1, 5);
  const maxTargetedPartSearches = boundedInteger(options.maxTargetedPartSearches ?? process.env.DIAGNOSIS_TARGETED_PART_SEARCH_MAX, 3, 0, 5);
  const maxPriceLookups = boundedInteger(options.maxPriceLookups ?? process.env.DIAGNOSIS_PRICE_LOOKUP_MAX, 3, 0, 5);
  const contextStatus = normalizeContextStatus(partsContext.status);
  const allowTargetedSearch = contextStatus !== 'variant_resolution_needed';
  const scopedResults = (results || []).slice(0, maxResults);
  const preparedResults = scopedResults.map((raw, index) => ({
    index,
    raw,
    match: findMatchingPart(raw, contextParts),
  }));
  const fallbackCandidatesByIndex = new Map();
  const unmatchedForSearch = preparedResults
    .filter((prepared) => !prepared.match)
    .filter(() => allowTargetedSearch)
    .slice(0, maxTargetedPartSearches);
  const priceCache = new Map();
  const requestContext = options.requestContext || null;

  if (unmatchedForSearch.length > 0) {
    const fallbackCandidates = await resolveDiagnosticPartCandidates({
      brand: partsContext.brand,
      modelNumber,
      productType: partsContext.productType,
      candidates: unmatchedForSearch.map(({ raw, index }) => ({
        candidateIndex: index,
        issue: raw.issue,
        partName: raw.partName || raw.part_name,
        partNumber: raw.partNumber || raw.part_number,
      })),
    });

    for (const candidate of fallbackCandidates) {
      fallbackCandidatesByIndex.set(candidate.candidateIndex, candidate);
    }
  }

  const verificationRows = preparedResults.map(({ raw, match, index }) => {
    const fallbackCandidate = fallbackCandidatesByIndex.get(index) || null;
    const verifiedPartNumber = match?.part?.partNumber || fallbackCandidate?.partNumber || '';
    const verifiedPartName = match?.part?.partName || fallbackCandidate?.partName || raw.partName || raw.part_name || 'Unverified part';
    const snapshot = fallbackCandidate ? snapshotFromTargetedCandidate(fallbackCandidate) : null;

    if (verifiedPartNumber && snapshot) {
      priceCache.set(priceCacheKey(modelNumber, verifiedPartNumber), snapshot);
    }

    return {
      raw,
      match,
      index,
      fallbackCandidate,
      verifiedPartNumber,
      verifiedPartName,
      snapshot,
      priceBudgetSkipped: false,
    };
  });

  await Promise.allSettled(
    verificationRows
      .filter((row) => row.verifiedPartNumber)
      .map((row) => (
        upsertPartNumberToStore({
          partNumber: row.verifiedPartNumber,
          canonicalPartName: row.verifiedPartName,
          normalizedCategory: row.match?.part?.category || null,
          normalizedSection: row.match?.part?.section || null,
          observedModels: [modelNumber].filter(Boolean),
          source: row.match?.part?.preferredSource || row.fallbackCandidate?.source || 'diagnosis-verifier',
          providerRows: row.match?.part?.providerRows || (row.fallbackCandidate ? [row.fallbackCandidate] : []),
        })
      ))
  );

  for (const row of verificationRows) {
    if (!row.verifiedPartNumber || row.snapshot) continue;

    if (row.match?.part?.retailPriceVerified) {
      row.snapshot = {
        retailPrice: row.match.part.retailPrice,
        retailPriceText: row.match.part.retailPriceText,
        retailAvailability: row.match.part.retailAvailability,
        retailPricingUrl: row.match.part.retailPricingUrl,
        retailPriceSource: row.match.part.retailPriceSource,
        retailPriceVerified: true,
      };
      priceCache.set(priceCacheKey(modelNumber, row.verifiedPartNumber), row.snapshot);
    }
  }

  const cacheTargets = verificationRows.filter((row) => (
    row.verifiedPartNumber &&
    !hasVerifiedPrice(row.snapshot) &&
    (row.match || row.fallbackCandidate)
  ));

  const cachedSettled = await Promise.allSettled(
    cacheTargets.map((row) => getPartNumberFromStore(row.verifiedPartNumber, { markLookup: true }))
  );

  cachedSettled.forEach((settled, index) => {
    if (settled.status !== 'fulfilled') return;

    const row = cacheTargets[index];
    const snapshot = cachedPriceSnapshot(settled.value);
    const key = priceCacheKey(modelNumber, row.verifiedPartNumber);
    if (snapshot) {
      row.snapshot = snapshot;
      priceCache.set(key, snapshot);
    } else if (priceCache.has(key)) {
      row.snapshot = priceCache.get(key);
    }
  });

  const warehousePriceTargets = cacheTargets.filter((row) => (
    row.verifiedPartNumber &&
    !hasVerifiedPrice(row.snapshot)
  ));
  const warehouseSettled = await Promise.allSettled(
    warehousePriceTargets.map((row) => (
      getStoredPriceSnapshot(row.verifiedPartNumber, { modelNumber })
    ))
  );

  warehouseSettled.forEach((settled, index) => {
    if (settled.status !== 'fulfilled' || !hasVerifiedPrice(settled.value)) return;

    const row = warehousePriceTargets[index];
    const key = priceCacheKey(modelNumber, row.verifiedPartNumber);
    row.snapshot = settled.value;
    priceCache.set(key, settled.value);
  });

  const directTargetsByKey = new Map();
  for (const row of cacheTargets) {
    if (hasVerifiedPrice(row.snapshot)) continue;

    const key = priceCacheKey(modelNumber, row.verifiedPartNumber);
    if (priceCache.has(key)) {
      row.snapshot = priceCache.get(key);
      continue;
    }

    if (directTargetsByKey.has(key)) continue;
    if (directTargetsByKey.size >= maxPriceLookups) {
      row.priceBudgetSkipped = true;
      continue;
    }

    directTargetsByKey.set(key, { key, partNumber: row.verifiedPartNumber });
  }

  const directLookupTargets = [...directTargetsByKey.values()];
  if (directLookupTargets.length > 0) {
    const directPriceMap = await resolveEncompassPricesForParts(
      directLookupTargets.map((target) => target.partNumber),
      {
        maxLookups: directLookupTargets.length,
        concurrency: Math.min(2, directLookupTargets.length),
        modelNumber,
        tool: 'diagnosis',
        bucket: 'diag.lite_grounded',
        requestContext,
      }
    );

    for (const target of directLookupTargets) {
      const snapshot = directPriceMap.get(target.partNumber) || null;
      if (snapshot) priceCache.set(target.key, snapshot);
    }

    for (const row of cacheTargets) {
      if (hasVerifiedPrice(row.snapshot)) continue;

      const snapshot = priceCache.get(priceCacheKey(modelNumber, row.verifiedPartNumber));
      if (snapshot) row.snapshot = snapshot;
    }
  }

  const remainingPriceLookups = Math.max(0, maxPriceLookups - directLookupTargets.length);
  const targetedRows = verificationRows
    .filter((row) => !hasVerifiedPrice(row.snapshot) && allowTargetedSearch && row.verifiedPartNumber)
    .slice(0, remainingPriceLookups);

  for (let i = 0; i < targetedRows.length; i += 2) {
    const chunk = targetedRows.slice(i, i + 2);
    const targetedSettled = await Promise.allSettled(
      chunk.map((row) => (
        resolveTargetedPriceSnapshot({
          raw: row.raw,
          fallbackIndex: row.index,
          verifiedPartNumber: row.verifiedPartNumber,
          verifiedPartName: row.verifiedPartName,
          partsContext,
          modelNumber,
        })
      ))
    );

    targetedSettled.forEach((settled, index) => {
      if (settled.status !== 'fulfilled' || !hasVerifiedPrice(settled.value)) return;

      const row = chunk[index];
      row.snapshot = settled.value;
      priceCache.set(priceCacheKey(modelNumber, row.verifiedPartNumber), settled.value);
    });
  }

  await Promise.allSettled(
    verificationRows
      .filter((row) => row.verifiedPartNumber && row.snapshot)
      .map((row) => applyEncompassPriceSnapshot(row.verifiedPartNumber, row.snapshot))
  );

  for (const row of verificationRows) {
    const { raw, match, fallbackCandidate, verifiedPartNumber, verifiedPartName, snapshot, priceBudgetSkipped } = row;
    const priced = hasVerifiedPrice(snapshot);

    const verificationStatus = priced
      ? (match ? 'model_part_verified' : fallbackCandidate ? 'targeted_part_search_verified' : 'unverified')
      : 'unpriced_pending_quote';
    const warnings = [];
    if (!match && !fallbackCandidate) warnings.push('Candidate part was not found in model-specific parts context.');
    if (priceBudgetSkipped) warnings.push('Price verification budget reached; Road Runner will confirm parts price by phone.');
    if (!allowTargetedSearch && !match) warnings.push('Exact model and serial were not enough to complete catalog fitment automatically.');
    if (contextStatus && contextStatus !== 'bom_complete') warnings.push('Road Runner will confirm final part fitment before sale.');
    if (!priced) warnings.push('No verified supplier price yet — call Road Runner for the current parts price.');

    verified.push({
      issue: String(raw.issue || 'Likely appliance issue').trim(),
      partName: String(verifiedPartName).trim(),
      partNumber: verifiedPartNumber || '',
      partPrice: priced ? centsRounded(snapshot?.retailPrice) : 0,
      laborHours: clampLaborHours(raw.laborHours || raw.labor_hours),
      probability: normalizeProbability(raw.probability),
      description: String(raw.description || '').trim(),
      verificationStatus,
      verificationConfidence: match ? Math.round(match.score * 100) : fallbackCandidate ? Math.round((fallbackCandidate.confidence || 0) * 100) : 0,
      matchedPartNumber: match?.part?.partNumber || fallbackCandidate?.partNumber || null,
      partPriceSource: priced ? (snapshot?.retailPriceSource || null) : null,
      partPriceVerified: priced,
      partPricingUrl: priced ? (snapshot?.retailPricingUrl || null) : null,
      partAvailability: priced ? (snapshot?.retailAvailability || null) : null,
      contextWarnings: warnings,
      provenance: [
        ...(partsContext.provenance || []),
        ...(fallbackCandidate?.provenance || []),
        ...(priced && snapshot ? [{ source: snapshot.retailPriceSource, uri: snapshot.retailPricingUrl, note: 'Internal supplier catalog price verification.' }] : []),
      ],
    });
  }

  return verified;
}
