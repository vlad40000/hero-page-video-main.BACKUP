import 'server-only';

import * as cheerio from 'cheerio';
import { fetchHtml, cleanText, normalizePartNumber, uniqueBy } from '@/lib/tools/parts/http';
import {
  availabilityFromError,
  buildProviderAttempt,
  providerAttemptFromResult,
} from '@/lib/tools/parts/provider-availability';
import { partsSql } from '@/lib/tools/parts/db';

const DOMAIN = 'encompass.com';
const BASE_URL = 'https://encompass.com';

function buildSearchUrl(modelNumber) {
  return `${BASE_URL}/search?s=${encodeURIComponent(modelNumber)}`;
}

/**
 * Query encompass_model_urls for the known Exploded-View-Assembly URL for this model.
 * Falls back to encompass_brand_configs search URL if available.
 * Returns null if neither is found.
 */
async function resolveEncompassUrlFromDb(modelNumber, brand) {
  const normModel = String(modelNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  try {
    const rows = await partsSql`
      SELECT url FROM encompass_model_urls
      WHERE UPPER(REGEXP_REPLACE(model_number, '[^A-Z0-9]', '', 'g')) = ${normModel}
      LIMIT 1
    `;
    if (rows.length > 0 && rows[0].url) return rows[0].url;
  } catch (_err) {
    // DB unavailable — proceed to brand config fallback
  }

  if (brand) {
    try {
      const brandRows = await partsSql`
        SELECT exploded_view_search_url FROM encompass_brand_configs
        WHERE brand ILIKE ${String(brand)}
        LIMIT 1
      `;
      if (brandRows.length > 0 && brandRows[0].exploded_view_search_url) {
        const searchUrl = brandRows[0].exploded_view_search_url.replace('{model}', encodeURIComponent(modelNumber));
        return searchUrl;
      }
    } catch (_err) {
      // DB unavailable — fall through to null
    }
  }

  return null;
}

/**
 * Parse assembly sections and parts from an Encompass model parts page.
 *
 * Encompass HTML layout (server-rendered variant):
 *
 *   <div class="parts-sections">
 *     <div class="parts-section" data-section-id="DRUM" data-section-name="Drum">
 *       <h2 class="section-header">Drum</h2>
 *       <table class="parts-section-table">
 *         <tbody>
 *           <tr class="part-row">
 *             <td class="part-number">WP53-0918</td>
 *             <td class="part-description">Drum Bearing Ring</td>
 *             <td class="diagram-ref">A</td>
 *             <td class="list-price">$18.75</td>
 *           </tr>
 *         </tbody>
 *       </table>
 *     </div>
 *   </div>
 *
 * Also handles flat-table and labeled-list layouts.
 */
export function parseEncompassModelPage(html, modelNumber, sourceUrl) {
  const $ = cheerio.load(String(html || ''));
  const parts = [];
  const sectionsDiscovered = new Set();

  // Layout A: explicit parts-section divs (server-rendered Encompass catalog)
  $(
    'div.parts-section, section.parts-section, [class*="PartsSection"]'
  ).each((_i, sectionEl) => {
    const $section = $(sectionEl);
    const sectionName =
      cleanText($section.attr('data-section-name') || '') ||
      cleanText($section.find('.section-header, .section-title, h2, h3').first().text()) ||
      'General';

    sectionsDiscovered.add(sectionName);

    $section.find('tr.part-row, tbody tr, tr[data-part-id]').each((_j, rowEl) => {
      const $row = $(rowEl);
      if ($row.find('th').length > 0) return;

      const rawPartNumber = normalizePartNumber(
        $row.attr('data-part-id') ||
        $row.attr('data-part-number') ||
        $row.find('.part-number, [class*="PartNumber"], [class*="part-number"], td:first-child').first().text()
      );
      if (!rawPartNumber) return;

      const rawPartName = cleanText(
        $row.find('.part-description, [class*="Description"], [class*="PartDesc"], td:nth-child(2)').first().text()
      );
      const diagramRef = cleanText(
        $row.find('.diagram-ref, [class*="DiagramRef"], [class*="diagram-ref"]').first().text() ||
        $row.attr('data-ref') || ''
      ) || null;

      parts.push({
        rawPartNumber,
        rawPartName: rawPartName || rawPartNumber,
        sectionName,
        diagramRef,
        source: DOMAIN,
        sourceUrl: sourceUrl || `${BASE_URL}/search?s=${encodeURIComponent(modelNumber)}`,
      });
    });
  });

  // Layout B: flat parts-list or catalog table
  if (parts.length === 0) {
    $(
      'table.parts-list tr, table[class*="PartsTable"] tr, table[class*="parts-table"] tr, #parts-catalog tr'
    ).each((_i, rowEl) => {
      const $row = $(rowEl);
      if ($row.find('th').length > 0) return;

      const rawPartNumber = normalizePartNumber(
        $row.find('[class*="PartNumber"], .part-number, td:first-child').first().text() ||
        $row.attr('data-part-id') || ''
      );
      if (!rawPartNumber) return;

      const sectionName = cleanText(
        $row.find('[class*="SectionName"], .section-name, td.section').first().text() ||
        $row.attr('data-section') || ''
      ) || 'General';

      const rawPartName = cleanText(
        $row.find('[class*="Description"], .description, td:nth-child(2)').first().text()
      );
      const diagramRef = cleanText(
        $row.find('[class*="DiagramRef"], .ref, td.ref').first().text() || $row.attr('data-ref') || ''
      ) || null;

      sectionsDiscovered.add(sectionName);
      parts.push({
        rawPartNumber,
        rawPartName: rawPartName || rawPartNumber,
        sectionName,
        diagramRef,
        source: DOMAIN,
        sourceUrl: sourceUrl || `${BASE_URL}/search?s=${encodeURIComponent(modelNumber)}`,
      });
    });
  }

  // Layout C: schematic-exploded-view with labeled section groups
  if (parts.length === 0) {
    let currentSection = 'General';
    $(
      '.schematic-section, [data-diagram-section], .diagram-parts-group'
    ).each((_i, el) => {
      const $el = $(el);
      const header = $el.find('.section-label, .diagram-label, h3, h4').first().text();
      if (header) currentSection = cleanText(header) || currentSection;
      sectionsDiscovered.add(currentSection);

      $el.find('tr, li.part-item').each((_j, rowEl) => {
        const $row = $(rowEl);
        const rawPartNumber = normalizePartNumber(
          $row.find('.pn, .part-no').first().text() || $row.attr('data-pn') || ''
        );
        if (!rawPartNumber) return;
        const rawPartName = cleanText($row.find('.desc, .part-name').first().text());
        parts.push({
          rawPartNumber,
          rawPartName: rawPartName || rawPartNumber,
          sectionName: currentSection,
          diagramRef: null,
          source: DOMAIN,
          sourceUrl: sourceUrl || `${BASE_URL}/search?s=${encodeURIComponent(modelNumber)}`,
        });
      });
    });
  }

  const unique = uniqueBy(parts, (p) => `${p.rawPartNumber}|${p.sectionName}`);
  return {
    parts: unique,
    sectionsDiscovered: sectionsDiscovered.size || new Set(unique.map((p) => p.sectionName)).size,
  };
}

/**
 * Resolve model URL from an Encompass search results page.
 * Encompasses search results often contain model anchor tags.
 */
export function parseEncompassSearchResults(html, modelNumber) {
  const $ = cheerio.load(String(html || ''));
  const normModel = String(modelNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  const candidates = [];
  $('a[href*="/service/Parts/"], a[href*="/Exploded-View-Assembly/"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    const text = cleanText($(el).text());
    const hrefNorm = href.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const textNorm = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const score =
      (hrefNorm.includes(normModel) ? 3 : 0) +
      (textNorm.includes(normModel) ? 2 : 0);

    if (score > 0) {
      const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      candidates.push({ url, score });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url || null;
}

export async function fetchEncompassDistributorBom({ modelNumber, brand, plan = {} }) {
  console.log(`[Adapter Encompass] Deterministic catalog pass for ${modelNumber}`);

  const dbUrl = await resolveEncompassUrlFromDb(modelNumber, brand);
  const fallbackSearchUrl = buildSearchUrl(modelNumber);
  const resolveSourceUrl = dbUrl || fallbackSearchUrl;

  let html;
  let resolvedUrl = resolveSourceUrl;

  if (dbUrl) {
    try {
      html = await fetchHtml(dbUrl);
      resolvedUrl = dbUrl;
    } catch (err) {
      const { availability, reason } = availabilityFromError(err);
      return _blockedResult(modelNumber, plan, err?.url || dbUrl, { availability, reason });
    }
  } else {
    try {
      const searchHtml = await fetchHtml(fallbackSearchUrl);
      const searchUrl = parseEncompassSearchResults(searchHtml, modelNumber);
      if (searchUrl) {
        html = await fetchHtml(searchUrl);
        resolvedUrl = searchUrl;
      }
    } catch (searchErr) {
      const searchAvailability = availabilityFromError(searchErr);
      return _blockedResult(modelNumber, plan, searchErr?.url || fallbackSearchUrl, searchAvailability);
    }
  }

  if (!html) {
    return {
      summary: `Encompass model URL not resolved for ${modelNumber}.`,
      source: DOMAIN,
      truthSource: 'Encompass distributor catalog',
      sourceStrategy: 'distributor-encompass-diagrams',
      parts: [],
      sources: [{ title: 'Encompass Parts', uri: resolveSourceUrl }],
      coverage: {
        provider: DOMAIN,
        sectionsDiscovered: 0,
        sectionsFetched: 0,
        sectionFetchFailures: 0,
        paginationComplete: false,
        flags: ['distributor-no-parts'],
        retrievalState: 'model_not_found',
      },
      providerAttempts: [
        buildProviderAttempt({
          provider: DOMAIN,
          stage: 'distributor_fallback',
          availability: 'requires_manual_review',
          reason: 'Encompass model URL not resolved via direct or search.',
          sourceUrl: resolveSourceUrl,
        }),
      ],
      planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
    };
  }

  const { parts, sectionsDiscovered } = parseEncompassModelPage(html, modelNumber, resolvedUrl);

  if (parts.length === 0) {
    return {
      summary: `Encompass returned no parseable parts for ${modelNumber}.`,
      source: DOMAIN,
      truthSource: 'Encompass distributor catalog',
      sourceStrategy: 'distributor-encompass-diagrams',
      parts: [],
      sources: [{ title: 'Encompass Parts', uri: resolvedUrl }],
      coverage: {
        provider: DOMAIN,
        sectionsDiscovered: 0,
        sectionsFetched: 0,
        sectionFetchFailures: 0,
        paginationComplete: false,
        flags: ['distributor-no-parts'],
        retrievalState: 'no_parts_found',
      },
      providerAttempts: [
        buildProviderAttempt({
          provider: DOMAIN,
          stage: 'distributor_fallback',
          availability: 'requires_manual_review',
          reason: 'Encompass page returned no parseable parts.',
          sourceUrl: resolvedUrl,
        }),
      ],
      planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
    };
  }

  const sectionNames = new Set(parts.map((p) => p.sectionName).filter(Boolean));

  return {
    summary: `Encompass deterministic BOM for ${modelNumber}: ${parts.length} parts across ${sectionNames.size} sections.`,
    source: DOMAIN,
    truthSource: 'Encompass distributor catalog',
    sourceStrategy: 'distributor-encompass-diagrams',
    parts,
    sources: [{ title: 'Encompass model parts', uri: resolvedUrl }],
    coverage: {
      provider: DOMAIN,
      sectionsDiscovered: sectionsDiscovered || sectionNames.size,
      sectionsFetched: sectionNames.size,
      sectionFetchFailures: 0,
      paginationComplete: true,
      flags: [],
      retrievalState: 'parts_found',
    },
    providerAttempts: [
      providerAttemptFromResult(DOMAIN, {
        parts,
        sources: [{ title: 'Encompass model parts', uri: resolvedUrl }],
        coverage: { flags: [], retrievalState: 'parts_found', sectionsDiscovered: sectionNames.size },
      }, 'distributor_fallback'),
    ],
    planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
  };
}

function _blockedResult(modelNumber, plan, sourceUrl, { availability, reason }) {
  return {
    summary: `Encompass request failed for ${modelNumber}.`,
    source: DOMAIN,
    truthSource: 'Encompass distributor catalog',
    sourceStrategy: 'distributor-encompass-diagrams',
    parts: [],
    sources: [{ title: 'Encompass Parts', uri: sourceUrl }],
    coverage: {
      provider: DOMAIN,
      sectionsDiscovered: 0,
      sectionsFetched: 0,
      sectionFetchFailures: 1,
      paginationComplete: false,
      flags: [availability === 'blocked_403' ? 'provider-blocked-403' : 'provider-fetch-failed'],
      retrievalState: availability,
    },
    providerAttempts: [
      buildProviderAttempt({
        provider: DOMAIN,
        stage: 'distributor_fallback',
        availability,
        reason,
        sourceUrl,
      }),
    ],
    planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
  };
}
