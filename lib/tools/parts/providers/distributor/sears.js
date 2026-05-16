import 'server-only';

import { fetchPartsList } from '@/lib/tools/parts/gemini';
import { fetchHtml, normalizeModelToken, uniqueBy } from '@/lib/tools/parts/http';
import {
  classifySearsPayload,
  extractSearsCatalogPayload,
  parseSearsModelSearchPayload,
  parseSearsModelDetailPayload,
  searsPartToRawRow,
} from '@/lib/tools/parts/providers/distributor/sears-catalog-adapter';
import { mapStructuredRowsToRaw } from '@/lib/tools/parts/providers/manufacturer/generic-family';

function buildSearchUrl(modelNumber) {
  return `https://www.searspartsdirect.com/search?q=${encodeURIComponent(modelNumber)}`;
}

const KNOWN_SEARS_MODEL_URLS = {
  MVWB300WQ2: 'https://www.searspartsdirect.com/model/363jgyd8re-003048/maytag-mvwb300wq2-washer-parts',
};

function buildDeterministicPageUrls(currentUrl, expectedPartCount, loadedPartCount) {
  const safeExpected = Number.isFinite(Number(expectedPartCount)) ? Math.max(0, Number(expectedPartCount)) : 0;
  const safeLoaded = Number.isFinite(Number(loadedPartCount)) ? Math.max(0, Number(loadedPartCount)) : 0;
  if (!safeExpected || safeLoaded >= safeExpected) return [];

  const pageSize = Math.max(1, safeLoaded || 10);
  const maxPages = Math.max(2, Math.min(40, Number(process.env.SEARS_MAX_MODEL_PAGE || 20)));
  const neededPages = Math.min(maxPages, Math.ceil(safeExpected / pageSize));
  const urls = [];

  for (let page = 2; page <= neededPages; page += 1) {
    try {
      const next = new URL(currentUrl);
      next.searchParams.set('page', String(page));
      urls.push(next.toString());
    } catch {
      break;
    }
  }
  return urls;
}

async function parseSearsUrl(url, modelNumber) {
  const html = await fetchHtml(url);
  const payload = extractSearsCatalogPayload(html);
  if (!payload) {
    return {
      kind: 'unknown',
      url,
      rows: [],
      sources: [{ title: 'Sears PartsDirect', uri: url }],
      expectedPartCount: null,
      loadedPartCount: 0,
      retrievalState: 'no_catalog_payload',
      candidates: [],
    };
  }

  const kind = classifySearsPayload(payload);
  if (kind === 'model_resolver') {
    const candidates = parseSearsModelSearchPayload(payload, modelNumber);
    return {
      kind,
      url,
      rows: [],
      sources: [{ title: 'Sears PartsDirect model resolver', uri: url }],
      expectedPartCount: null,
      loadedPartCount: 0,
      retrievalState: 'resolver_results_only',
      candidates,
    };
  }

  if (kind === 'model_detail') {
    const detail = parseSearsModelDetailPayload(payload);
    const rows = detail.parts.map((part) => searsPartToRawRow(part, url));
    return {
      kind,
      url,
      rows,
      sources: [{ title: 'Sears PartsDirect model detail', uri: url }],
      expectedPartCount: detail.expectedPartCount,
      loadedPartCount: detail.loadedPartCount,
      retrievalState: detail.state,
      candidates: [],
      model: detail.model,
      schematics: detail.schematics,
    };
  }

  return {
    kind,
    url,
    rows: [],
    sources: [{ title: 'Sears PartsDirect', uri: url }],
    expectedPartCount: null,
    loadedPartCount: 0,
    retrievalState: kind === 'cms_content' ? 'cms_content_ignored' : 'unknown_payload',
    candidates: [],
  };
}

async function resolveSearsModelDetailUrl({ modelNumber }) {
  const requestedNorm = normalizeModelToken(modelNumber);
  if (KNOWN_SEARS_MODEL_URLS[requestedNorm]) return KNOWN_SEARS_MODEL_URLS[requestedNorm];

  const resolver = await parseSearsUrl(buildSearchUrl(modelNumber), modelNumber);

  if (resolver.kind === 'model_detail') return resolver.url;

  const exact = (resolver.candidates || []).find((candidate) => {
    const candidateNorm = normalizeModelToken(candidate.modelNumber);
    return candidate.internalModelId && candidate.url && candidateNorm === requestedNorm;
  }) || (resolver.candidates || []).find((candidate) => candidate.internalModelId && candidate.url && candidate.confidence === 'partial');

  return exact?.url || null;
}

async function fetchDeterministicSearsBom({ modelNumber }) {
  const modelUrl = await resolveSearsModelDetailUrl({ modelNumber });
  if (!modelUrl) {
    return {
      summary: `Sears PartsDirect model resolver found no exact model detail for ${modelNumber}.`,
      source: 'searspartsdirect.com',
      rows: [],
      sources: [{ title: 'Sears PartsDirect search', uri: buildSearchUrl(modelNumber) }],
      expectedPartCount: null,
      loadedPartCount: 0,
      retrievalState: 'resolver_results_only',
      flags: ['sears-model-not-resolved'],
    };
  }

  const first = await parseSearsUrl(modelUrl, modelNumber);
  const pageUrls = buildDeterministicPageUrls(modelUrl, first.expectedPartCount, first.loadedPartCount);
  const extraResults = [];

  for (const url of pageUrls) {
    try {
      const result = await parseSearsUrl(url, modelNumber);
      if (result.kind === 'model_detail') extraResults.push(result);
    } catch {
      // Keep first page evidence and mark partial rather than falling into hallucinated rows.
    }
  }

  const rows = uniqueBy(
    [first, ...extraResults].flatMap((result) => result.rows || []),
    (row) => `${row.rawPartNumber}|${row.sectionName}|${row.diagramRef || ''}`
  );
  const uniquePartCount = new Set(rows.map((row) => row.rawPartNumber).filter(Boolean)).size;
  const expectedPartCount = first.expectedPartCount || null;
  const retrievalState = expectedPartCount && uniquePartCount >= expectedPartCount
    ? 'parts_complete_for_sears'
    : expectedPartCount
      ? 'parts_partial'
      : first.retrievalState;

  return {
    summary: `Sears PartsDirect deterministic BOM for ${modelNumber}.`,
    source: 'searspartsdirect.com',
    rows,
    sources: [{ title: 'Sears PartsDirect model detail', uri: modelUrl }],
    expectedPartCount,
    loadedPartCount: uniquePartCount,
    retrievalState,
    flags: retrievalState === 'parts_partial' ? ['sears-parts-partial'] : [],
  };
}

/**
 * Dedicated Sears PartsDirect Distributor Adapter.
 * Deterministic CATALOG_API_RESPONSE parsing is primary. Gemini/Search is emergency-only.
 */
export async function fetchSearsDistributorBom({ modelNumber, brand, plan = {} }) {
  console.log(`[Adapter Sears] Deterministic catalog pass for ${modelNumber}`);

  const deterministic = await fetchDeterministicSearsBom({ modelNumber, brand });
  if (deterministic.rows.length > 0 || process.env.ENABLE_GEMINI_SEARCH_FALLBACK !== 'true') {
    const sections = new Set(deterministic.rows.map((row) => row.sectionName).filter(Boolean));
    return {
      truthSource: 'Sears PartsDirect CATALOG_API_RESPONSE',
      sourceStrategy: 'distributor-sears-catalog-json',
      modelUrl: deterministic.sources[0]?.uri || null,
      summary: deterministic.summary,
      source: 'searspartsdirect.com',
      parts: deterministic.rows,
      sources: deterministic.sources,
      coverage: {
        provider: 'sears-distributor',
        sectionsDiscovered: sections.size,
        sectionsFetched: sections.size,
        sectionFetchFailures: 0,
        paginationComplete: deterministic.retrievalState === 'parts_complete_for_sears',
        flags: deterministic.flags,
        expectedPartCount: deterministic.expectedPartCount,
        loadedPartCount: deterministic.loadedPartCount,
        retrievalState: deterministic.retrievalState,
      },
      planMeta: {
        truthOrder: plan.truthOrder || [],
        fallbackSources: plan.distributorFallbacks || ['searspartsdirect.com'],
      },
    };
  }

  const providerPlan = {
    modelNumber,
    brand,
    manufacturerDomains: [],
    distributorFallbacks: ['searspartsdirect.com'],
    allowedDomains: ['searspartsdirect.com'],
    truthOrder: ['searspartsdirect.com'],
    truthSource: 'Sears PartsDirect distributor catalog',
    strategy: 'distributor-sears-emergency-ai-fallback',
  };

  console.log(`[Adapter Sears] Emergency Gemini fallback enabled for ${modelNumber}`);
  const result = await fetchPartsList(modelNumber, providerPlan);
  const parts = mapStructuredRowsToRaw(result.parts || [], 'searspartsdirect.com');
  const sections = new Set(parts.map((row) => row.sectionName).filter(Boolean));
  const flags = [];
  if (parts.length === 0) flags.push('distributor-no-parts');
  flags.push('ai-search-fallback-used');

  return {
    truthSource: 'Sears PartsDirect distributor catalog',
    sourceStrategy: 'distributor-sears-emergency-ai-fallback',
    modelUrl: result.sources?.[0]?.uri || null,
    summary: result.summary || `Sears PartsDirect BOM for ${modelNumber}.`,
    source: 'searspartsdirect.com',
    parts,
    sources: result.sources || [],
    coverage: {
      provider: 'sears-distributor',
      sectionsDiscovered: sections.size,
      sectionsFetched: sections.size,
      sectionFetchFailures: 0,
      paginationComplete: false,
      flags,
    },
    planMeta: {
      truthOrder: plan.truthOrder || [],
      fallbackSources: plan.distributorFallbacks || ['searspartsdirect.com'],
    },
  };
}
