import 'server-only';

import * as cheerio from 'cheerio';
import { fetchHtml, cleanText, normalizePartNumber, normalizeModelToken, uniqueBy } from '@/lib/tools/parts/http';
import {
  availabilityFromError,
  buildProviderAttempt,
  providerAttemptFromResult,
} from '@/lib/tools/parts/provider-availability';
import { partsSql } from '@/lib/tools/parts/db';

const DOMAIN = 'dlpartsco.com';
const LOOKUP_BASE = 'https://www.dlpartscolookup.com';

function buildLookupSearchUrl(modelNumber) {
  return `${LOOKUP_BASE}/lookup?site=prod-standard&search=${encodeURIComponent(modelNumber)}`;
}

/**
 * Query provider_model_routes and model_source_urls for a known D&L Parts URL.
 * Returns null if no DB-seeded URL exists.
 */
async function resolveDlPartsUrlFromDb(modelNumber) {
  const normModel = String(modelNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  try {
    const routeRows = await partsSql`
      SELECT provider_model_url, provider_assembly_url
      FROM provider_model_routes
      WHERE UPPER(REGEXP_REPLACE(COALESCE(model, ''), '[^A-Z0-9]', '', 'g')) = ${normModel}
        AND (provider ILIKE '%dlparts%' OR provider ILIKE '%dlpartsco%')
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
    `;
    if (routeRows.length > 0) {
      const row = routeRows[0];
      const url = row.provider_model_url || row.provider_assembly_url;
      if (url) return url;
    }
  } catch (_err) {
    // DB unavailable — fall through
  }

  try {
    const sourceRows = await partsSql`
      SELECT msu.url
      FROM model_source_urls msu
      INNER JOIN appliance_models am ON am.id = msu.model_id
      WHERE UPPER(REGEXP_REPLACE(COALESCE(am.normalized_model, am.model_number, am.raw_model, ''), '[^A-Z0-9]', '', 'g')) = ${normModel}
        AND msu.source ILIKE '%dlparts%'
      ORDER BY msu.last_checked_at DESC NULLS LAST
      LIMIT 1
    `;
    if (sourceRows.length > 0 && sourceRows[0].url) return sourceRows[0].url;
  } catch (_err) {
    // DB unavailable — fall through
  }

  return null;
}

/**
 * Parse section links from the model search or section page sidebar.
 * The sidebar contains `a.diagramText` anchors with hrefs like:
 *   /lookup/{modelId}/{sectionId}?site=prod-standard
 */
export function parseDlPartsLookupSections(html) {
  const $ = cheerio.load(String(html || ''));
  const sections = [];
  const seen = new Set();

  $('a.diagramText[href*="/lookup/"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    if (!/\/lookup\/\d+\/\d+/.test(href)) return;

    const url = href.startsWith('http') ? href : `${LOOKUP_BASE}${href}`;
    if (seen.has(url)) return;
    seen.add(url);

    const sectionName = cleanText($(el).text()) || null;
    sections.push({ url, sectionName });
  });

  return sections;
}

/**
 * Parse parts from a single D&L lookup section page.
 *
 * Real HTML structure (dlpartscolookup.com):
 *   <h2 class="diagram">01 - Base (washer)</h2>
 *   <table class="table">
 *     <tbody>
 *       <tr>
 *         <td class="itemNumber"><a name="6140761"></a>1</td>
 *         <td class="partNumber"><a href="..." title="View Part">WP661570</a></td>
 *         <td class="description">Drive Belt <span>(Series: 10)</span></td>
 *         <td class="priceRight">$12.99</td>
 *       </tr>
 *     </tbody>
 *   </table>
 */
export function parseDlPartsSection(html, modelNumber, sourceUrl) {
  const $ = cheerio.load(String(html || ''));
  const parts = [];

  const sectionName = cleanText($('h2.diagram').first().text()) || 'General';

  $('table.table tbody tr').each((_i, rowEl) => {
    const $row = $(rowEl);
    if ($row.find('th').length > 0) return;

    const rawPartNumber = normalizePartNumber(
      $row.find('td.partNumber a').first().text() ||
      $row.find('td.partNumber').first().text()
    );
    if (!rawPartNumber) return;

    const fullDesc = cleanText($row.find('td.description').first().text());
    const rawPartName = fullDesc.replace(/\s*\((?:Series|Replaces|NLA|OEM):.*?\)/gi, '').trim() || rawPartNumber;

    const diagramRef = cleanText($row.find('td.itemNumber').first().text()) || null;

    const priceText = cleanText($row.find('td.priceRight').first().text()) || null;
    const retailPrice = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) || null : null;

    parts.push({
      rawPartNumber,
      rawPartName,
      sectionName,
      diagramRef,
      retailPrice: retailPrice || undefined,
      retailPriceText: retailPrice ? priceText : undefined,
      source: DOMAIN,
      sourceUrl: sourceUrl || buildLookupSearchUrl(modelNumber),
    });
  });

  return parts;
}

/**
 * Parse assembly sections and parts from a D&L Parts model page.
 * Handles both the real dlpartscolookup.com structure and legacy layouts.
 */
function extractLegacyRowPrice($row) {
  const priceText = cleanText(
    $row.find('td.priceRight, .price, .list-price, .sale-price, [class*="Price"]').first().text()
  );
  if (!priceText) return { retailPrice: undefined, retailPriceText: undefined };
  const numeric = parseFloat(priceText.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return { retailPrice: undefined, retailPriceText: undefined };
  return { retailPrice: numeric, retailPriceText: priceText };
}

export function parseDlPartsModelPage(html, modelNumber, sourceUrl) {
  const $ = cheerio.load(String(html || ''));
  const parts = [];
  const sectionsDiscovered = new Set();

  // Layout A: dlpartscolookup.com real structure — h2.diagram + table.table
  const hasDiagramSections = $('h2.diagram').length > 0 && $('table.table').length > 0;
  if (hasDiagramSections) {
    let currentSection = 'General';

    $('h2.diagram, table.table').each((_i, el) => {
      const tag = el.tagName?.toLowerCase();

      if (tag === 'h2') {
        currentSection = cleanText($(el).text()) || 'General';
        sectionsDiscovered.add(currentSection);
        return;
      }

      $(el).find('tbody tr').each((_j, rowEl) => {
        const $row = $(rowEl);
        if ($row.find('th').length > 0) return;

        const rawPartNumber = normalizePartNumber(
          $row.find('td.partNumber a').first().text() ||
          $row.find('td.partNumber').first().text()
        );
        if (!rawPartNumber) return;

        const fullDesc = cleanText($row.find('td.description').first().text());
        const rawPartName = fullDesc.replace(/\s*\((?:Series|Replaces|NLA|OEM):.*?\)/gi, '').trim() || rawPartNumber;
        const diagramRef = cleanText($row.find('td.itemNumber').first().text()) || null;

        const priceText = cleanText($row.find('td.priceRight').first().text()) || null;
        const retailPrice = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) || null : null;

        sectionsDiscovered.add(currentSection);
        parts.push({
          rawPartNumber,
          rawPartName,
          sectionName: currentSection,
          diagramRef,
          retailPrice: retailPrice || undefined,
          retailPriceText: retailPrice ? priceText : undefined,
          source: DOMAIN,
          sourceUrl: sourceUrl || buildLookupSearchUrl(modelNumber),
        });
      });
    });
  }

  // Layout B: explicit assembly-section divs (legacy)
  if (parts.length === 0) {
    $('.assembly-section, [data-assembly], .part-section, .parts-section').each((_i, sectionEl) => {
      const $section = $(sectionEl);
      const sectionName = cleanText(
        $section.attr('data-section') ||
        $section.find('.section-title, .assembly-title, h2, h3').first().text()
      ) || 'General';

      sectionsDiscovered.add(sectionName);

      $section.find('tr[data-part], tr.part-row, tbody tr').each((_j, rowEl) => {
        const $row = $(rowEl);
        const cells = $row.find('td');
        if (cells.length < 2) return;

        const rawPartNumber = normalizePartNumber(
          $row.attr('data-part-number') ||
          $row.find('.part-number, [data-part-number], td:first-child').first().text()
        );
        if (!rawPartNumber) return;

        const rawPartName = cleanText(
          $row.attr('data-part-name') ||
          $row.find('.part-name, .description, td:nth-child(2)').first().text()
        );
        const diagramRef = cleanText(
          $row.find('.diagram-ref, .ref-number, td.ref').first().text() ||
          $row.attr('data-ref') || ''
        ) || null;

        const { retailPrice, retailPriceText } = extractLegacyRowPrice($row);

        parts.push({
          rawPartNumber,
          rawPartName: rawPartName || rawPartNumber,
          sectionName,
          diagramRef,
          retailPrice,
          retailPriceText,
          source: DOMAIN,
          sourceUrl: sourceUrl || buildLookupSearchUrl(modelNumber),
        });
      });
    });
  }

  // Layout C: flat parts table with section column or data-section row attrs
  if (parts.length === 0) {
    $('table.parts-list tr, table.parts-table tr, #parts-list tr, .parts-list tr').each((_i, rowEl) => {
      const $row = $(rowEl);
      if ($row.find('th').length > 0) return;

      const rawPartNumber = normalizePartNumber(
        $row.attr('data-part') ||
        $row.find('[data-part-number], .part-number, td:first-child').first().text()
      );
      if (!rawPartNumber) return;

      const sectionName = cleanText(
        $row.attr('data-section') ||
        $row.find('.section, .assembly, td.section-col').first().text()
      ) || 'General';

      const rawPartName = cleanText(
        $row.find('.description, .part-name, td:nth-child(2)').first().text()
      );
      const diagramRef = cleanText(
        $row.find('.ref, .diagram-ref, td.ref').first().text() ||
        $row.attr('data-ref') || ''
      ) || null;

      const { retailPrice, retailPriceText } = extractLegacyRowPrice($row);

      sectionsDiscovered.add(sectionName);
      parts.push({
        rawPartNumber,
        rawPartName: rawPartName || rawPartNumber,
        sectionName,
        diagramRef,
        retailPrice,
        retailPriceText,
        source: DOMAIN,
        sourceUrl: sourceUrl || buildLookupSearchUrl(modelNumber),
      });
    });
  }

  // Layout D: definition-list style
  if (parts.length === 0) {
    let currentSection = 'General';
    $('dl.parts-dl dt, dl.parts-dl dd').each((_i, el) => {
      const tag = el.tagName?.toLowerCase();
      if (tag === 'dt') {
        currentSection = cleanText($(el).text()) || 'General';
        sectionsDiscovered.add(currentSection);
        return;
      }
      const $dd = $(el);
      const rawPartNumber = normalizePartNumber($dd.find('.pn, .part-number').first().text() || $dd.attr('data-pn') || '');
      if (!rawPartNumber) return;
      const rawPartName = cleanText($dd.find('.desc, .name').first().text());
      const { retailPrice, retailPriceText } = extractLegacyRowPrice($dd);
      parts.push({
        rawPartNumber,
        rawPartName: rawPartName || rawPartNumber,
        sectionName: currentSection,
        diagramRef: null,
        retailPrice,
        retailPriceText,
        source: DOMAIN,
        sourceUrl: sourceUrl || buildLookupSearchUrl(modelNumber),
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
 * Extract the canonical model detail URL from a D&L Parts search results page.
 * Handles both legacy /models/ links and dlpartscolookup.com lookup links.
 */
export function parseDlPartsSearchResults(html, modelNumber) {
  const $ = cheerio.load(String(html || ''));
  const norm = normalizeModelToken(modelNumber);

  const candidates = [];

  $('a[href*="/models/"], a[href*="/model/"], a[href*="/lookup"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    const text = cleanText($(el).text());
    const dataModel = $(el).attr('data-model') || $(el).closest('[data-model]').attr('data-model') || '';

    const hrefNorm = normalizeModelToken(href);
    const textNorm = normalizeModelToken(text);
    const dataNorm = normalizeModelToken(dataModel);

    const score =
      (hrefNorm.includes(norm) ? 2 : 0) +
      (textNorm === norm ? 3 : textNorm.includes(norm) ? 1 : 0) +
      (dataNorm === norm ? 2 : 0);

    if (score > 0) {
      const base = href.includes('dlpartscolookup.com') || href.startsWith('/lookup')
        ? LOOKUP_BASE
        : `https://www.${DOMAIN}`;
      const url = href.startsWith('http') ? href : `${base}${href}`;
      candidates.push({ url, score });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url || null;
}

async function batchFetch(tasks, batchSize = 5) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }
  return results;
}

export async function fetchDlPartsDistributorBom({ modelNumber, plan = {} }) {
  console.log(`[Adapter D&L] Deterministic catalog pass for ${modelNumber}`);

  const dbUrl = await resolveDlPartsUrlFromDb(modelNumber);
  const modelSearchUrl = dbUrl || buildLookupSearchUrl(modelNumber);

  let modelHtml;
  try {
    modelHtml = await fetchHtml(modelSearchUrl);
  } catch (err) {
    const { availability, reason } = availabilityFromError(err);
    return _blockedResult(modelNumber, plan, err?.url || modelSearchUrl, { availability, reason });
  }

  // Parse section links from sidebar
  const sections = parseDlPartsLookupSections(modelHtml);

  let parts = [];
  let sectionFetchFailures = 0;

  if (sections.length > 0) {
    // Fetch all section pages in parallel batches
    const sectionPartGroups = await batchFetch(
      sections.map(({ url, sectionName }) => async () => {
        try {
          const html = await fetchHtml(url);
          const sectionParts = parseDlPartsSection(html, modelNumber, url);
          // Override sectionName from sidebar if section page h2 is empty
          if (sectionName && sectionParts.every((p) => p.sectionName === 'General')) {
            return sectionParts.map((p) => ({ ...p, sectionName }));
          }
          return sectionParts;
        } catch (err) {
          console.warn(`[Adapter D&L] Section fetch failed: ${url} — ${err?.message}`);
          sectionFetchFailures++;
          return [];
        }
      }),
      5
    );
    parts = sectionPartGroups.flat();
  }

  // Fall back to parsing the model page directly if section fetch yielded nothing
  if (parts.length === 0) {
    const { parts: parsed } = parseDlPartsModelPage(modelHtml, modelNumber, modelSearchUrl);
    parts = parsed;
  }

  if (parts.length === 0) {
    return {
      summary: `D&L Parts found no parts for ${modelNumber}.`,
      source: DOMAIN,
      truthSource: 'D&L Parts distributor catalog',
      sourceStrategy: 'distributor-dlparts-catalog',
      parts: [],
      sources: [{ title: 'D&L Parts', uri: modelSearchUrl }],
      coverage: {
        provider: DOMAIN,
        sectionsDiscovered: 0,
        sectionsFetched: 0,
        sectionFetchFailures,
        paginationComplete: false,
        flags: ['distributor-no-parts'],
        retrievalState: 'no_parts_found',
      },
      providerAttempts: [
        buildProviderAttempt({
          provider: DOMAIN,
          stage: 'distributor_fallback',
          availability: 'requires_manual_review',
          reason: 'D&L Parts page returned no parseable parts.',
          sourceUrl: modelSearchUrl,
        }),
      ],
      planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
    };
  }

  const unique = uniqueBy(parts, (p) => `${p.rawPartNumber}|${p.sectionName}`);
  const sectionNames = new Set(unique.map((p) => p.sectionName).filter(Boolean));

  return {
    summary: `D&L Parts deterministic BOM for ${modelNumber}: ${unique.length} parts across ${sectionNames.size} sections.`,
    source: DOMAIN,
    truthSource: 'D&L Parts distributor catalog',
    sourceStrategy: 'distributor-dlparts-catalog',
    parts: unique,
    sources: [{ title: 'D&L Parts model detail', uri: modelSearchUrl }],
    coverage: {
      provider: DOMAIN,
      sectionsDiscovered: sections.length || sectionNames.size,
      sectionsFetched: sectionNames.size,
      sectionFetchFailures,
      paginationComplete: sectionFetchFailures === 0,
      flags: sectionFetchFailures > 0 ? ['partial-section-fetch'] : [],
      retrievalState: 'parts_found',
    },
    providerAttempts: [
      providerAttemptFromResult(DOMAIN, {
        parts: unique,
        sources: [{ title: 'D&L Parts model detail', uri: modelSearchUrl }],
        coverage: { flags: [], retrievalState: 'parts_found', sectionsDiscovered: sectionNames.size },
      }, 'distributor_fallback'),
    ],
    planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
  };
}

function _blockedResult(modelNumber, plan, sourceUrl, { availability, reason }) {
  return {
    summary: `D&L Parts request failed for ${modelNumber}.`,
    source: DOMAIN,
    truthSource: 'D&L Parts distributor catalog',
    sourceStrategy: 'distributor-dlparts-catalog',
    parts: [],
    sources: [{ title: 'D&L Parts', uri: sourceUrl }],
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
