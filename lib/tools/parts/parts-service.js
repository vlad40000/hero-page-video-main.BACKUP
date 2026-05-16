import { normalizeModelNumber } from '@/lib/tools/parts/normalize';
import { findModelInStore, isReusableModelCache, upsertModelToStore } from '@/lib/tools/parts/model-store';
import { resolveCanonicalModel } from '@/lib/tools/parts/model-resolution';
import { ingestRawParts } from '@/lib/tools/parts/parts-ingest';
import { reconcileParts, persistMasterParts } from '@/lib/tools/parts/parts-reconcile';
import { buildOptimizedResponse } from '@/lib/tools/parts/parts-graph';
import { buildProviderPlan } from '@/lib/tools/parts/provider-registry';
import { fetchManufacturerBom } from '@/lib/tools/parts/providers/manufacturer';
import { fetchGapFillBom } from '@/lib/tools/parts/providers/distributor/gap-fill';
import { memoryCache } from '@/lib/tools/parts/mem-cache';
import { calculateCompleteness, classifyBomResult, RETRIEVAL_TARGETS } from '@/lib/tools/parts/parts-classifier';

import { decodeSerialNumber } from '@/lib/tools/parts/serial/decoder';
import { filterPartsBySerialApplicability } from '@/lib/tools/parts/serial/applicability';
import {
  createSearchSession,
  getSearchSession,
  updateSearchSession,
} from '@/lib/tools/parts/search-session-store';

import { extractIdentity, validateIdentity } from './identity-service';
import { routeSource } from './source-router';
import { resolveVariant } from './variant-resolver';
import { fetchDiagramIndex } from './diagram-indexer';
import { fetchDiagramPartsWithRetry } from './diagram-fetcher';
import { runWithConcurrency } from './concurrency-util';
import { reviewBOM } from './reviewer';
import { extractSchematicBOM } from './gemini';
import { buildBOMProviderEvidence } from '@/lib/appliance-intelligence/tools/bom-evidence';
import { normalizeCacheStatus } from '@/lib/appliance-intelligence/verification/cache-status';
import { recordRetrievalRun } from '@/lib/appliance-intelligence/audit/retrieval-audit';

function normalizePN(pn) {
  return String(pn || '').trim().toUpperCase().replace(/[\s-]+/g, '');
}

function toReconcileRow(row = {}) {
  const rawPartNumber = String(
    row.raw_part_number ||
    row.rawPartNumber ||
    row.partNumber ||
    ''
  ).trim().toUpperCase();

  return {
    source: String(row.source || 'unknown').trim().toLowerCase(),
    section_name: String(row.section_name || row.sectionName || row.section || 'General Assembly').trim(),
    diagram_ref: row.diagram_ref || row.diagramRef || null,
    provider_item_id: row.provider_item_id || row.providerItemId || null,
    raw_part_number: rawPartNumber,
    raw_part_name: String(row.raw_part_name || row.rawPartName || row.name || row.partName || '').trim(),
    raw_category: String(row.raw_category || row.rawCategory || row.category || row.sectionName || row.section || '').trim(),
    quantity: row.quantity || null,
    substitute_part_number: row.substitute_part_number || row.substitutePartNumber || row.substitute || row.substitutePart || null,
    serial_note: row.serial_note || row.serialNote || row.applicability || null,
    raw_payload: row.raw_payload || row.rawPayload || row,
  };
}

function toReconcileRows(rows = []) {
  return (rows || []).map((row) => toReconcileRow(row)).filter((row) => row.raw_part_number);
}

function toRawRow(row = {}, sourceFallback = 'unknown') {
  return {
    source: String(row.source || sourceFallback || 'unknown').trim().toLowerCase(),
    rawPartNumber: String(row.rawPartNumber || row.partNumber || '').trim().toUpperCase(),
    rawPartName: String(row.rawPartName || row.name || '').trim(),
    rawCategory: String(row.rawCategory || row.category || 'General').trim(),
    sectionName: String(row.sectionName || row.section || 'General').trim(),
    substitutePartNumber: row.substitutePartNumber || null,
    serialNote: row.serialNote || null,
    quantity: row.quantity || null,
    diagramRef: row.diagramRef || null,
    rawPayload: row,
  };
}

function uniqRaw(rows = []) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = `${row.rawPartNumber}:${row.source}:${row.sectionName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function countRowsBySource(rows = []) {
  const counts = {};
  for (const row of rows) {
    const source = String(row?.source || 'unknown').trim().toLowerCase() || 'unknown';
    counts[source] = (counts[source] || 0) + 1;
  }
  return counts;
}

function collectSources(primary = null, secondary = null) {
  const seen = new Set();
  const out = [];
  for (const source of [...(primary?.sources || []), ...(secondary?.sources || [])]) {
    const key = source?.uri || source?.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(source);
  }
  return out;
}

function mergeResults(primary = null, secondary = null, plan = {}) {
  const pParts = (primary?.parts || []).map((row) => toRawRow(row, primary?.source));
  const sParts = (secondary?.parts || []).map((row) => toRawRow(row, secondary?.source));
  const combined = uniqRaw([...pParts, ...sParts]);

  const fallbackSourcesUsed = Object.entries(secondary?.sourceBreakdown || {})
    .filter(([, count]) => count > 0)
    .map(([domain]) => domain);

  const uniqFlags = [
    ...new Set([...(primary?.coverage?.flags || []), ...(secondary?.coverage?.flags || [])].filter(Boolean)),
  ];

  const primaryPagination = primary?.coverage?.paginationComplete;
  const secondaryPagination = secondary?.coverage?.paginationComplete;
  const paginationComplete =
    typeof secondaryPagination === 'boolean' && secondary?.source === 'manufacturer'
      ? secondaryPagination
      : Boolean(primaryPagination || secondaryPagination);

  return {
    summary: primary?.summary || secondary?.summary || `OEM BOM for ${plan.normalizedModel}.`,
    parts: combined,
    sources: collectSources(primary, secondary),
    source: primary?.parts?.length > 0 ? primary.source : (secondary?.source || 'unknown'),
    truthSource: plan.truthSource || primary?.truthSource || secondary?.truthSource || 'Manufacturer + gap-fill',
    sourceStrategy: secondary?.parts?.length
      ? 'manufacturer-plus-multi-gap-fill'
      : (primary?.sourceStrategy || plan.strategy || 'manufacturer-first'),
    fallbackAvailable: plan.distributorFallbacks || [],
    fallbackSourcesUsed,
    rowsBySource: countRowsBySource(combined),
    coverage: {
      provider: primary?.coverage?.provider || secondary?.coverage?.provider || 'mixed',
      sectionsDiscovered: Math.max(primary?.coverage?.sectionsDiscovered || 0, secondary?.coverage?.sectionsDiscovered || 0),
      sectionsFetched: (primary?.coverage?.sectionsFetched || 0) + (secondary?.coverage?.sectionsFetched || 0),
      sectionFetchFailures: (primary?.coverage?.sectionFetchFailures || 0) + (secondary?.coverage?.sectionFetchFailures || 0),
      paginationComplete,
      flags: uniqFlags,
    },
  };
}

function shouldRunGapFill({ manufacturerData, initialStatus, plan }) {
  const manufacturerRows = manufacturerData?.parts?.length || 0;
  const sectionCount = manufacturerData?.coverage?.sectionsDiscovered || 0;
  const paginationComplete = Boolean(manufacturerData?.coverage?.paginationComplete);
  const flags = manufacturerData?.coverage?.flags || [];
  const criticalFlags = ['manufacturer-no-parts', 'manufacturer-empty-result', 'section-fetch-failures'];

  if (initialStatus === 'needs_fallback' || initialStatus === 'parts_partial') return true;
  if (manufacturerRows < (plan.minRawRows || 12)) return true;
  if (sectionCount < 3) return true;
  if (!paginationComplete) return true;
  if (flags.some((flag) => criticalFlags.includes(flag))) return true;

  return false;
}

function hasSerialMetadata(parts = []) {
  return parts.some((part) =>
    Array.isArray(part?.serialApplicability)
      ? part.serialApplicability.length > 0
      : Boolean(part?.serialNote || part?.providerRows?.some((row) => row?.serial_note || row?.serialNote))
  );
}

async function runDeterministicWorkerPass(session, route) {
  const { identity, variant } = session;
  
  // Worker 5: Diagram Index
  const indexResult = await fetchDiagramIndex({ identity, route, variant });
  if (!indexResult.ok || !indexResult.diagrams?.length) {
    return { parts: [], sources: [], coverage: { flags: ['no-diagrams-found'] } };
  }

  const diagramCount = indexResult.diagrams.length;
  console.log(`[Worker 5] Found ${diagramCount} diagrams for ${variant.resolved_model}`);

  // Worker 6: Parallel Fetch
  const sectionResults = await runWithConcurrency(
    indexResult.diagrams,
    4,
    async (diagram) => fetchDiagramPartsWithRetry({ diagram })
  );

  const allParts = sectionResults.flat().map(p => toRawRow(p, p.source));
  const succeededCount = sectionResults.filter(r => r.length > 0).length;

  return {
    parts: allParts,
    sources: indexResult.diagrams.map(d => ({ title: d.label, uri: d.url })),
    coverage: {
      sectionsDiscovered: diagramCount,
      sectionsFetched: succeededCount,
      paginationComplete: succeededCount === diagramCount,
      flags: succeededCount < diagramCount ? ['partial-diagram-fetch'] : []
    }
  };
}

async function fetchCompleteLiveBOM(modelNumber, plan) {
  // We'll keep this for legacy / non-session calls if needed, 
  // but let's focus on the staged session flow below.
  return { parts: [], sources: [], coverage: { flags: ['session-required'] } };
}

/**
 * --- STAGED SESSION HELPERS ---
 */

function buildManufacturerLookupModel(variant = {}) {
  const resolvedModel = String(variant?.resolved_model || '').trim();
  const resolvedRevision = String(variant?.resolved_revision || '').trim();

  if (!resolvedRevision) return resolvedModel;
  if (resolvedModel.endsWith(resolvedRevision)) return resolvedModel;

  return `${resolvedModel}${resolvedRevision}`;
}



function buildDeterministicRoute(route = {}) {
  const primary = String(route?.primary_source || '');
  const fallbacks = Array.isArray(route?.fallback_sources) ? route.fallback_sources : [];
  if (primary.includes('sears') || primary === 'sears') return route;
  if (fallbacks.some((src) => String(src || '').includes('sears') || String(src || '') === 'sears')) {
    return { ...route, primary_source: 'sears' };
  }
  return null;
}



async function runManufacturerStage(session) {
  const { modelNumber, brand } = session.request;
  const lookupModel = buildManufacturerLookupModel(session.variant);

  console.log(`[Staged Retrieval] Manufacturer Catalog Pass for ${lookupModel || modelNumber}`);

  let manufacturerResult = await fetchManufacturerBom({
    modelNumber: lookupModel || modelNumber,
    brand,
  });

  const deterministicRoute = buildDeterministicRoute(session.route);
  const shouldTryDiagramTraversal = !manufacturerResult?.parts?.length && deterministicRoute;

  if (shouldTryDiagramTraversal) {
    let workerResult = await runDeterministicWorkerPass(session, deterministicRoute);

    // If deterministic pass yields zero parts (likely due to 403 block), 
    // trigger the AI Schematic Miner recovery pass.
    if (workerResult.parts.length === 0 && process.env.ENABLE_GEMINI_SEARCH_FALLBACK === 'true') {
      console.log(`[Staged Retrieval] Deterministic fail/blocked. Triggering emergency AI Schematic Miner for ${modelNumber}`);
      const aiResult = await extractSchematicBOM(modelNumber, brand);
      
      if (aiResult.parts.length > 0) {
        workerResult = {
          parts: aiResult.parts.map(p => ({
            source: p.source,
            sectionName: p.section || 'General Assembly',
            rawPartNumber: p.partNumber,
            rawPartName: p.name,
            providerItemId: p.partNumber,
            diagramRef: p.diagramRef || null,
          })),
          sources: aiResult.sources || [],
          coverage: { 
            flags: ['ai-schematic-extraction', 'ai-search-fallback-used'],
            sectionsDiscovered: new Set(aiResult.parts.map(p => p.section)).size,
            sectionsFetched: new Set(aiResult.parts.map(p => p.section)).size,
            paginationComplete: true,
          },
          truthSource: aiResult.truthSource,
          sourceStrategy: aiResult.sourceStrategy,
        };
      }
    } else if (workerResult.parts.length === 0) {
      workerResult.coverage = {
        ...(workerResult.coverage || {}),
        flags: [...new Set([...(workerResult.coverage?.flags || []), 'ai-search-fallback-disabled'])],
      };
    }

    if (workerResult.parts.length > 0) {
      manufacturerResult = {
        summary:
          manufacturerResult?.summary ||
          `Deterministic catalog data for ${lookupModel || modelNumber}`,
        parts: workerResult.parts,
        sources: workerResult.sources,
        source: deterministicRoute.primary_source,
        coverage: {
          sectionFetchFailures: 0,
          ...workerResult.coverage,
        },
        truthSource: workerResult.truthSource || manufacturerResult?.truthSource || 'Catalog traversal',
        sourceStrategy: workerResult.sourceStrategy || manufacturerResult?.sourceStrategy || 'deterministic-pipeline',
      };
    }
  }

  const finalSummary = manufacturerResult?.summary || (manufacturerResult?.parts?.length > 0 ? `Verified catalog data for ${lookupModel || modelNumber}` : null);

  session.providerEvidences = [
    ...(session.providerEvidences || []),
    buildBOMProviderEvidence({
      stageResult: manufacturerResult || {},
      modelNumber: session.canonicalModel || modelNumber,
      provider: manufacturerResult?.source || deterministicRoute?.primary_source || 'manufacturer',
      stage: 'manufacturer'
    })
  ];

  return {
    summary: finalSummary,
    parts: manufacturerResult?.parts || [],
    sources: manufacturerResult?.sources || [],
    source: manufacturerResult?.source || session.route.primary_source,
    coverage: {
      sectionsDiscovered: manufacturerResult?.coverage?.sectionsDiscovered || 0,
      sectionsFetched: manufacturerResult?.coverage?.sectionsFetched || 0,
      sectionFetchFailures: manufacturerResult?.coverage?.sectionFetchFailures || 0,
      paginationComplete: Boolean(manufacturerResult?.coverage?.paginationComplete),
      flags: manufacturerResult?.coverage?.flags || [],
    },
    truthSource: manufacturerResult?.truthSource || 'Catalog traversal',
    sourceStrategy: manufacturerResult?.sourceStrategy || 'deterministic-pipeline',
  };
}

async function runPrimaryFallbackStage(session) {
  const { modelNumber, brand } = session.request;
  const plan = buildProviderPlan({ modelNumber, brand, exhaustiveMode: session.request.exhaustiveMode });
  const domains = plan.primaryDistributorDomains || [];

  console.log(`[Staged Retrieval] Primary Recovery for ${modelNumber}`);
  
  let primaryDistData;
  try {
    primaryDistData = await fetchGapFillBom({
      modelNumber,
      brand,
      plan,
      domains,
    });
  } catch (err) {
    console.error('Primary stage fail', err);
    primaryDistData = { parts: [], sources: [], sourceBreakdown: {} };
  }

  const manufacturerResult = {
    parts: session.accumulatedRawParts,
    sources: session.accumulatedSources,
    source: 'manufacturer'
  };

  session.providerEvidences = [
    ...(session.providerEvidences || []),
    buildBOMProviderEvidence({
      stageResult: primaryDistData || {},
      modelNumber: session.canonicalModel || modelNumber,
      provider: domains[0] || 'primary_fallback',
      stage: 'primary_fallback'
    })
  ];

  const merged = mergeResults(manufacturerResult, primaryDistData, plan);
  const trace = {
    ...session.retrievalTrace,
    primaryFallbackAttempted: true,
    fallbackAttempted: true,
    primaryDistributorRows: primaryDistData?.parts?.length || 0
  };

  return { merged, trace };
}

async function runSecondaryFallbackStage(session) {
  const { modelNumber, brand } = session.request;
  const plan = buildProviderPlan({ modelNumber, brand, exhaustiveMode: session.request.exhaustiveMode });
  const domains = plan.secondaryDistributorDomains || [];

  console.log(`[Staged Retrieval] Secondary Recovery for ${modelNumber}`);
  
  let secondaryDistData;
  try {
    secondaryDistData = await fetchGapFillBom({
      modelNumber,
      brand,
      plan,
      domains,
    });
  } catch (err) {
    console.error('Secondary stage fail', err);
    secondaryDistData = { parts: [], sources: [], sourceBreakdown: {} };
  }

  const previousResult = {
    parts: session.accumulatedRawParts,
    sources: session.accumulatedSources,
    source: 'multi-source'
  };

  session.providerEvidences = [
    ...(session.providerEvidences || []),
    buildBOMProviderEvidence({
      stageResult: secondaryDistData || {},
      modelNumber: session.canonicalModel || modelNumber,
      provider: domains[0] || 'secondary_fallback',
      stage: 'secondary_fallback'
    })
  ];

  const merged = mergeResults(previousResult, secondaryDistData, plan);
  const trace = {
    ...session.retrievalTrace,
    secondaryFallbackAttempted: true,
    fallbackAttempted: true,
    fallbackRows: secondaryDistData?.parts?.length || 0,
    fallbackSourcesUsed: Object.entries(secondaryDistData?.sourceBreakdown || {})
      .filter(([, count]) => count > 0)
      .map(([domain]) => domain)
  };

  return { merged, trace };
}

function finalizeSessionPayload(session, finalResult) {
  const { masterParts, completenessScore, sectionCount } = finalResult.reconciled;
  
  const status = classifyBomResult({
    summary: finalResult.summary,
    rawRowCount: session.accumulatedRawParts.length,
    masterRowCount: masterParts.length,
    sectionCount,
    paginationComplete: finalResult.coverage?.paginationComplete,
    flags: finalResult.coverage?.flags,
  });

  const optimized = buildOptimizedResponse(session.canonicalModel, masterParts, {
    summary: finalResult.summary,
    brand: session.request.brand,
    completenessScore,
    rawRowCount: session.accumulatedRawParts.length,
    sectionCount,
    truthSource: finalResult.truthSource,
    sourceStrategy: finalResult.sourceStrategy,
    fallbackSources: finalResult.fallbackSourcesUsed,
    conflictFlags: finalResult.coverage?.flags,
  });

  const baseBOM = {
    ...optimized,
    brand: session.request.brand,
    productType: session.request.productType,
    status,
    retrievalTrace: {
      ...session.retrievalTrace,
      rowsBySource: countRowsBySource(session.accumulatedRawParts),
    },
    truthSource: finalResult.truthSource,
    sourceStrategy: finalResult.sourceStrategy,
    sources: finalResult.sources,
    fallbackAvailable: finalResult.fallbackAvailable,
    fallbackSourcesUsed: finalResult.fallbackSourcesUsed,
    rowsBySource: countRowsBySource(session.accumulatedRawParts),
    providerEvidences: session.providerEvidences || [],
  };

  const filterResult = filterPartsBySerialApplicability(baseBOM.parts || [], { 
    serialNumber: session.request.serialNumber, 
    serialProfile: session.serialProfile 
  });

  return {
    searchSessionId: session.id,
    stage: session.stage,
    status,
    hasMore: session.hasMore,
    nextStage: session.nextStage,
    ...baseBOM,
    parts: filterResult.applicableParts,
    serialProfile: session.serialProfile,
    serialNumberUsed: session.request.serialNumber || null,
    applicabilityMode: filterResult.applicabilityMode,
    partsShown: filterResult.applicableParts.length,
    partsKnownSoFar: masterParts.length,
    partsSupersetCount: (baseBOM.parts || []).length,
    partsFilteredCount: filterResult.filteredOutParts.length,
    reviewPartCount: filterResult.reviewParts.length,
    cache: session.cacheStatus || 'live',
    identity: session.identity,
    route: session.route,
    variant: session.variant,
    review: session.review,
    message: session.hasMore ? `Preliminary ${session.stage} results. More parts available.` : "Search complete."
  };
}

export async function startApplianceSearchSession({
  modelNumber,
  serialNumber = '',
  partDescription = '',
  brand = null,
  productType = null,
  exhaustiveMode = false
}) {
  const resolution = await resolveCanonicalModel(modelNumber);
  const canonicalModel = resolution.canonicalModel;
  const resolvedBrand = resolution.brand || brand;

  // Worker 1 & 2: Identity
  const identity = extractIdentity({ brand: resolvedBrand, modelNumber, serialNumber });
  const validation = validateIdentity(identity);
  
  // Worker 3: Routing
  const route = await routeSource(identity);

  // Worker 4: Variant Resolution
  const variantResult = await resolveVariant({ identity, route });

  // 4a. If variant resolution is needed, we pause and let the user decide
  if (!variantResult.ok && variantResult.status === 'variant_resolution_needed') {
    const session = await createSearchSession({
      modelNumber,
      serialNumber,
      partDescription,
      brand: resolvedBrand,
      productType,
      exhaustiveMode,
      canonicalModel
    });
    
    await updateSearchSession(session.id, {
      status: 'variant_resolution_needed',
      identity,
      route,
      stage: 'variant_resolution',
      lastPayload: {
        status: 'variant_resolution_needed',
        identity,
        route,
        candidates: variantResult.candidates,
        reason: variantResult.reason,
        searchSessionId: session.id
      }
    });

    return {
      status: 'variant_resolution_needed',
      identity,
      route,
      candidates: variantResult.candidates,
      reason: variantResult.reason,
      searchSessionId: session.id
    };
  }

  const session = await createSearchSession({
    modelNumber,
    serialNumber,
    partDescription,
    brand: resolvedBrand,
    productType,
    exhaustiveMode,
    canonicalModel
  });

  session.identity = identity;
  session.route = route;
  session.variant = variantResult.value;
  session.cacheStatus = 'live';

  session.cacheStatus = 'live'; // Staged sessions are live by default

  if (serialNumber) {
    session.serialProfile = await decodeSerialNumber(serialNumber, { brand: resolvedBrand, model: canonicalModel });
  }

  // --- Stage 1 & 2: Burst Mode ---
  session.stage = 'manufacturer';
  let manufacturersData = await runManufacturerStage(session);
  let activeStageData = manufacturersData;
  
  session.accumulatedRawParts = manufacturersData.parts;
  session.accumulatedSources = manufacturersData.sources;
  session.retrievalTrace.manufacturerAttempted = true;
  session.retrievalTrace.manufacturerRows = manufacturersData.parts.length;

  let reconciled = await reconcileParts(canonicalModel, toReconcileRows(session.accumulatedRawParts), { persist: false });
  let completeness = calculateCompleteness(reconciled, session);

  const plan = buildProviderPlan({ modelNumber: canonicalModel, brand: resolvedBrand, exhaustiveMode });
  const hasPrimaryFallback = plan.distributorFallbacks && plan.distributorFallbacks.length > 0;

  // AUTO-BURST: If we're below 40 parts OR have zero results, and have a primary fallback (Sears/Encompass), run it immediately.
  if (['empty', 'below_floor'].includes(completeness.status) && hasPrimaryFallback) {
    console.log(`[Honest Retrieval] Below floor (${reconciled.masterParts.length}). Bursting to primary_fallback.`);
    session.stage = 'primary_fallback';
    const fallbackData = await runPrimaryFallbackStage(session);
    
    activeStageData = fallbackData.merged;
    session.accumulatedRawParts = fallbackData.merged.parts;
    session.accumulatedSources = fallbackData.merged.sources;
    session.retrievalTrace.primaryFallbackAttempted = true;
    session.retrievalTrace.primaryFallbackRows = fallbackData.merged.parts.length;

    reconciled = await reconcileParts(canonicalModel, toReconcileRows(session.accumulatedRawParts), { persist: false });
    completeness = calculateCompleteness(reconciled, session);
  }

  // Update session state based on final burst result
  const finalStatus = completeness.status;
  session.status = finalStatus;
  
  const hasMoreStages = plan.distributorFallbacks && plan.distributorFallbacks.length > session.retrievalTrace.primaryFallbackRows ? 1 : 0; // simplistic
  // Real check: are there stages left that we haven't tried?
  const sourcesLeft = plan.distributorFallbacks.length > 0 && !session.retrievalTrace.primaryFallbackAttempted;
  
  session.hasMore = sourcesLeft || (finalStatus === 'below_floor' || finalStatus === 'partial');
  session.nextStage = session.hasMore ? 'secondary_fallback' : null;

  // Worker 8: Review
  if (!session.hasMore && reconciled.masterParts.length > 0) {
    session.review = await reviewBOM({ identity, variant: session.variant, masterParts: reconciled.masterParts });
  }

  const payload = finalizeSessionPayload(session, { ...activeStageData, reconciled, fallbackAvailable: plan.distributorFallbacks });
  
  session.lastPayload = payload;
  await updateSearchSession(session.id, session);

  // Background Ingestion
  if (session.accumulatedRawParts.length > 0) {
    void ingestRawParts(canonicalModel, 'burst', session.accumulatedRawParts).catch(e => console.error('staged ingest fail', e));
  }

  // Every normalized model lookup gets a durable DB record, even if the BOM is partial.
  const normalizedModel = normalizeModelNumber(modelNumber);
  const _normalized1 = normalizeCacheStatus(payload);
  const cachePayload1 = { ...payload, status: _normalized1.durableStatus };
  await upsertModelToStore({ normalizedModel, rawModel: modelNumber, payload: cachePayload1 }).catch(e => console.error('staged cache fail', e));
  void recordRetrievalRun({ normalizedModel, rawModel: modelNumber, sessionId: session.id, payload, normalized: _normalized1 }).catch(e => console.error('audit fail', e));

  if (reconciled.masterParts.length > 0) {
    void persistMasterParts(reconciled.masterParts).catch(e => console.error('staged persist fail', e));
  }

  return payload;
}

export async function continueApplianceSearchSession({ searchSessionId, revision = null }) {
  const session = await getSearchSession(searchSessionId);
  if (!session) throw new Error("Search session expired or not found.");

  const canonicalModel = session.canonicalModel;

  // If we were waiting for variant resolution, resolve it now and proceed into manufacturer stage.
  if (session.stage === 'variant_resolution') {
    if (!revision) {
      return session.lastPayload;
    }

    const variantResult = await resolveVariant({ identity: session.identity, route: session.route, revision });
    if (!variantResult.ok) {
      throw new Error('Unable to resolve the requested variant.');
    }

    session.variant = variantResult.value;
    session.stage = 'manufacturer';
    session.nextStage = 'manufacturer';
    await updateSearchSession(session.id, { variant: session.variant, stage: 'manufacturer', nextStage: 'manufacturer' });
  }

  const plan = buildProviderPlan({ 
    modelNumber: canonicalModel, 
    brand: session.request.brand, 
    exhaustiveMode: session.request.exhaustiveMode 
  });

  const previousRawParts = Array.isArray(session.accumulatedRawParts) ? [...session.accumulatedRawParts] : [];

  let stageResult;
  if (session.nextStage === 'manufacturer') {
    session.stage = 'manufacturer';
    const manufacturerResult = await runManufacturerStage(session);
    stageResult = {
      merged: manufacturerResult,
      trace: {
        ...session.retrievalTrace,
        manufacturerAttempted: true,
        manufacturerRows: manufacturerResult.parts.length,
      },
    };
  } else if (session.nextStage === 'primary_fallback') {
    session.stage = 'primary_fallback';
    stageResult = await runPrimaryFallbackStage(session);
  } else if (session.nextStage === 'secondary_fallback') {
    session.stage = 'secondary_fallback';
    stageResult = await runSecondaryFallbackStage(session);
  } else {
    return session.lastPayload; // Already complete
  }

  session.accumulatedRawParts = stageResult.merged.parts;
  session.accumulatedSources = stageResult.merged.sources;
  session.retrievalTrace = stageResult.trace;

  // Determine if more stages needed
  const postStageStatus = classifyBomResult({
    summary: stageResult.merged.summary,
    rawRowCount: stageResult.merged.parts.length,
    masterRowCount: stageResult.merged.parts.length,
    sectionCount: stageResult.merged.coverage.sectionsDiscovered,
    paginationComplete: stageResult.merged.coverage.paginationComplete,
    flags: stageResult.merged.coverage.flags,
  });

  if (session.stage === 'primary_fallback') {
    const stillWeak = shouldRunGapFill({ 
      manufacturerData: stageResult.merged, 
      initialStatus: postStageStatus, 
      plan 
    });
    
    if (session.request.exhaustiveMode || stillWeak) {
      const secondaryDomains = plan.secondaryDistributorDomains || [];
      if (secondaryDomains.length > 0) {
        session.hasMore = true;
        session.nextStage = 'secondary_fallback';
      } else {
        session.hasMore = false;
        session.nextStage = null;
        session.status = 'complete';
      }
    } else {
      session.hasMore = false;
      session.nextStage = null;
      session.status = 'complete';
    }
  } else {
    // secondary_fallback is final
    session.hasMore = false;
    session.nextStage = null;
    session.status = 'complete';
  }

  const reconciled = await reconcileParts(canonicalModel, toReconcileRows(session.accumulatedRawParts), { persist: false });
  
  // Worker 8: Review (if complete)
  if (!session.hasMore && reconciled.masterParts.length > 0) {
    session.review = await reviewBOM({ identity: session.identity, variant: session.variant, masterParts: reconciled.masterParts });
  }

  const payload = finalizeSessionPayload(session, { ...stageResult.merged, reconciled, fallbackAvailable: plan.distributorFallbacks });
  
  session.lastPayload = payload;
  await updateSearchSession(session.id, session);

  // Background Ingestion of new raw rows (if any new parts were found in this stage)
  const newRawParts = stageResult.merged.parts.filter(p => !previousRawParts.some(ap => ap.rawPartNumber === p.rawPartNumber && ap.source === p.source));
  if (newRawParts.length > 0) {
    void ingestRawParts(canonicalModel, session.stage, newRawParts).catch(e => console.error('staged continue ingest fail', e));
  }

  const norm = normalizeModelNumber(session.request.modelNumber);
  const _normalized2 = normalizeCacheStatus(payload);
  const cachePayload2 = { ...payload, status: _normalized2.durableStatus };
  await upsertModelToStore({ normalizedModel: norm, rawModel: session.request.modelNumber, payload: cachePayload2 }).catch(e => console.error('staged cache fail', e));
  void recordRetrievalRun({ normalizedModel: norm, rawModel: session.request.modelNumber, sessionId: session.id, payload, normalized: _normalized2 }).catch(e => console.error('audit fail', e));

  if (!session.hasMore && reconciled.masterParts.length > 0) {
    void persistMasterParts(reconciled.masterParts).catch(e => console.error('staged persist fail', e));
  }

  return payload;
}

export async function getPartsForAppliance({ modelNumber, serialNumber = '', brand = null, productType = null, exhaustiveMode = false }) {
  const norm = normalizeModelNumber(modelNumber);
  const cacheKey = `appliance:${norm}:exhaustive:${exhaustiveMode ? '1' : '0'}`;
  const allowCacheReuse = !exhaustiveMode;

  let serialProfile = null;
  if (serialNumber) {
    serialProfile = await decodeSerialNumber(serialNumber, { brand, model: modelNumber });
  }

  let baseBOM = null;
  let cacheMeta = {
    source: 'live',
    hit: false,
  };

  if (allowCacheReuse) {
    const memHit = memoryCache.get(cacheKey);
    if (
      memHit &&
      isReusableModelCache(memHit) &&
      (!serialNumber || hasSerialMetadata(memHit.parts))
    ) {
      baseBOM = memHit;
      cacheMeta = {
        source: 'memory',
        hit: true,
      };
    }

    if (!baseBOM) {
      const dbHit = await findModelInStore(norm);
      if (
        dbHit &&
        isReusableModelCache(dbHit) &&
        (!serialNumber || hasSerialMetadata(dbHit.parts))
      ) {
        baseBOM = dbHit;
        memoryCache.set(cacheKey, dbHit);
        cacheMeta = {
          source: 'database',
          hit: true,
        };
      }
    }
  }

  if (!baseBOM) {
    const live = await startApplianceSearchSession({
      modelNumber,
      serialNumber,
      brand,
      productType,
      exhaustiveMode,
    });

    baseBOM = {
      ...live,
      cache: {
        ...cacheMeta,
        key: cacheKey,
        exhaustiveMode: Boolean(exhaustiveMode),
      },
    };

    if (
      allowCacheReuse &&
      isReusableModelCache(baseBOM) &&
      baseBOM.status !== 'variant_resolution_needed'
    ) {
      memoryCache.set(cacheKey, baseBOM);
    }
  }

  const filterResult = filterPartsBySerialApplicability(baseBOM.parts || [], { serialNumber, serialProfile });

  return {
    ...baseBOM,
    parts: filterResult.applicableParts,
    serialProfile,
    serialNumberUsed: serialNumber || null,
    applicabilityMode: filterResult.applicabilityMode,
    partsSupersetCount: (baseBOM.parts || []).length,
    partsFilteredCount: filterResult.filteredOutParts.length,
    reviewPartCount: filterResult.reviewParts.length,
    reviewParts: filterResult.reviewParts,
  };
}


export async function getPartsForModel(modelNumber, options = {}) {
  const normalizedOptions = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
  return getPartsForAppliance({ modelNumber, ...normalizedOptions });
}
