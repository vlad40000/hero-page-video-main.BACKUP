import 'server-only';
import { fetchPartsList } from '@/lib/tools/parts/gemini';
import { mapStructuredRowsToRaw } from '@/lib/tools/parts/providers/manufacturer/generic-family';
import { fetchSearsDistributorBom } from '@/lib/tools/parts/providers/distributor/sears';
import { fetchDlPartsDistributorBom } from '@/lib/tools/parts/providers/distributor/dlparts';
import { fetchEncompassDistributorBom } from '@/lib/tools/parts/providers/distributor/encompass-diagrams';
import {
  buildProviderAttempt,
  getProviderCapability,
  mergeProviderAttempts,
  providerAttemptFromResult,
} from '@/lib/tools/parts/provider-availability';

const DEFAULT_DISTRIBUTOR_DOMAINS = [
  'dlpartsco.com',
  'encompass.com',
  'searspartsdirect.com',
  'fix.com',
  'partselect.com',
  'reliableparts.com',
  'repairclinic.com',
];

function uniqueDomains(domains = []) {
  return [...new Set((domains || []).filter(Boolean))];
}

function buildSingleDomainPlan(plan = {}, domain, brand) {
  return {
    ...plan,
    brand,
    manufacturerDomains: [],
    distributorFallbacks: [domain],
    gapFillDomains: [domain],
    allowedDomains: [domain],
    truthOrder: [domain],
    truthSource: `${domain} distributor catalog`,
    strategy: `gap-fill:${domain}`,
  };
}

function emptyDomainResult(domain, flag = 'distributor-no-parts') {
  const capability = getProviderCapability(domain);
  const reason = flag === 'ai-search-fallback-disabled'
    ? 'AI/search fallback is disabled and no deterministic adapter returned parts.'
    : capability.reason;

  return {
    summary: '',
    source: domain,
    truthSource: `${domain} distributor catalog`,
    sourceStrategy: `gap-fill:${domain}`,
    sources: [],
    parts: [],
    coverage: {
      provider: domain,
      sectionsDiscovered: 0,
      sectionsFetched: 0,
      sectionFetchFailures: 0,
      paginationComplete: false,
      flags: [flag],
    },
    providerAttempts: [
      buildProviderAttempt({
        provider: domain,
        stage: 'distributor_fallback',
        availability: flag === 'ai-search-fallback-disabled' ? 'requires_manual_review' : capability.availability,
        reason,
      }),
    ],
  };
}

async function fetchSingleDomainGapFill({ modelNumber, brand, plan, domain }) {
  if (domain === 'searspartsdirect.com') {
    return await fetchSearsDistributorBom({ modelNumber, brand, plan });
  }

  if (domain === 'dlpartsco.com') {
    return await fetchDlPartsDistributorBom({ modelNumber, plan });
  }

  if (domain === 'encompass.com') {
    return await fetchEncompassDistributorBom({ modelNumber, brand, plan });
  }

  if (process.env.ENABLE_GEMINI_SEARCH_FALLBACK !== 'true') {
    return emptyDomainResult(domain, 'ai-search-fallback-disabled');
  }

  const domainPlan = buildSingleDomainPlan(plan, domain, brand);
  const result = await fetchPartsList(modelNumber, domainPlan);
  const parts = mapStructuredRowsToRaw(result.parts || [], domain);
  const sections = new Set(parts.map((row) => row.sectionName).filter(Boolean));
  const flags = parts.length > 0 ? ['ai-search-fallback-used'] : ['distributor-no-parts', 'ai-search-fallback-used'];

  const mapped = {
    summary: result.summary || `${domain} BOM for ${modelNumber}.`,
    source: domain,
    truthSource: `${domain} distributor catalog`,
    sourceStrategy: `gap-fill:${domain}:emergency-ai-search`,
    sources: result.sources || [],
    parts,
    coverage: {
      provider: domain,
      sectionsDiscovered: sections.size,
      sectionsFetched: sections.size,
      sectionFetchFailures: 0,
      paginationComplete: false,
      flags,
    },
  };

  return {
    ...mapped,
    providerAttempts: [
      providerAttemptFromResult(domain, mapped, 'distributor_fallback'),
    ],
  };
}

/**
 * @param {Object} params
 * @param {string} params.modelNumber
 * @param {string} [params.brand]
 * @param {Object} [params.plan]
 * @param {string[] | null} [params.domains]
 */
export async function fetchGapFillBom({ modelNumber, brand, plan = {}, domains = null }) {
  const targetDomains = uniqueDomains(domains || plan.gapFillDomains || DEFAULT_DISTRIBUTOR_DOMAINS);

  if (targetDomains.length === 0) {
    return {
      summary: '',
      truthSource: 'No distributor fallback executed',
      sourceStrategy: 'no-gap-fill',
      source: 'none',
      parts: [],
      sources: [],
      sourceBreakdown: {},
      coverage: {
        provider: 'none',
        sectionsDiscovered: 0,
        sectionsFetched: 0,
        sectionFetchFailures: 0,
        paginationComplete: false,
        flags: [],
      },
    };
  }

  const distributorFallbacks = targetDomains.filter(Boolean);

  const results = await Promise.all(
    distributorFallbacks.map(async (domain) => {
      try {
        return await fetchSingleDomainGapFill({ modelNumber, brand, plan, domain });
      } catch (error) {
        console.error(`[Gap Fill Error] ${domain}`, error);
        return {
          summary: '',
          source: domain,
          truthSource: `${domain} distributor catalog`,
          sourceStrategy: `gap-fill:${domain}`,
          sources: [],
          parts: [],
          coverage: {
            provider: domain,
            sectionsDiscovered: 0,
            sectionsFetched: 0,
            sectionFetchFailures: 1,
            paginationComplete: false,
            flags: ['distributor-fetch-failed'],
          },
          providerAttempts: [
            buildProviderAttempt({
              provider: domain,
              stage: 'distributor_fallback',
              availability: 'requires_manual_review',
              reason: error?.message || 'Distributor fetch failed.',
            }),
          ],
        };
      }
    })
  );

  const allParts = results.flatMap((result) => result.parts || []);
  const allSources = [];
  const seenSourceUris = new Set();
  for (const result of results) {
    for (const source of result.sources || []) {
      const key = source?.uri || source?.title;
      if (!key || seenSourceUris.has(key)) continue;
      seenSourceUris.add(key);
      allSources.push(source);
    }
  }

  const sourceBreakdown = Object.fromEntries(
    results.map((result) => [result.source, (result.parts || []).length])
  );
  const providerAttempts = mergeProviderAttempts(
    ...results.map((result) => result.providerAttempts || [
      providerAttemptFromResult(result.source, result, 'distributor_fallback'),
    ])
  );

  return {
    summary: results.find((result) => result.summary)?.summary || '',
    truthSource: 'Multi-source distributor gap-fill',
    sourceStrategy: 'multi-domain-gap-fill',
    source: 'multi-distributor',
    parts: allParts,
    sources: allSources,
    sourceBreakdown,
    providerResults: results,
    providerAttempts,
    coverage: {
      provider: 'multi-distributor',
      sectionsDiscovered: results.reduce((sum, result) => sum + (result.coverage?.sectionsDiscovered || 0), 0),
      sectionsFetched: results.reduce((sum, result) => sum + (result.coverage?.sectionsFetched || 0), 0),
      sectionFetchFailures: results.reduce((sum, result) => sum + (result.coverage?.sectionFetchFailures || 0), 0),
      paginationComplete: results.some((result) => result.coverage?.paginationComplete),
      flags: [...new Set(results.flatMap((result) => result.coverage?.flags || []))],
      providerAttempts,
    },
  };
}
