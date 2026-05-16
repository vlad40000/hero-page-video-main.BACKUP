import 'server-only';

import * as cheerio from 'cheerio';
import { fetchHtml, cleanText, normalizePartNumber, normalizeModelToken, uniqueBy } from '@/lib/tools/parts/http';
import {
  availabilityFromError,
  buildProviderAttempt,
  providerAttemptFromResult,
} from '@/lib/tools/parts/provider-availability';

const DOMAIN = 'dlpartsco.com';
const BASE_URL = 'https://www.dlpartsco.com';

function buildModelSearchUrl(modelNumber) {
  return `${BASE_URL}/search?q=${encodeURIComponent(modelNumber)}`;
}

function buildModelPageUrl(modelNumber) {
  return `${BASE_URL}/models/${encodeURIComponent(modelNumber.toUpperCase())}`;
}

/**
 * Extract the canonical model detail URL from a DL Parts search results page.
 * Looks for an anchor whose text or data-model attribute matches the model number.
 */
export function parseDlPartsSearchResults(html, modelNumber) {
  const $ = cheerio.load(String(html || ''));
  const norm = normalizeModelToken(modelNumber);

  const candidates = [];
  $('a[href*="/models/"], a[href*="/model/"]').each((_i, el) => {
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
      const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      candidates.push({ url, score, text });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url || null;
}

/**
 * Parse assembly sections and parts from a D&L Parts model page.
 * Expected HTML structure:
 *
 *   <div class="assembly-section" data-section="Drive Belt">
 *     <h3 class="section-title">Drive Belt</h3>
 *     <table class="parts-table">
 *       <tbody>
 *         <tr>
 *           <td class="part-number">WP661570</td>
 *           <td class="part-name">Drive Belt</td>
 *           <td class="diagram-ref">REF-1</td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 *
 * Also handles flat table layouts where rows have data-section attributes.
 */
export function parseDlPartsModelPage(html, modelNumber, sourceUrl) {
  const $ = cheerio.load(String(html || ''));
  const parts = [];
  const sectionsDiscovered = new Set();

  // Layout A: explicit assembly-section divs
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

      parts.push({
        rawPartNumber,
        rawPartName: rawPartName || rawPartNumber,
        sectionName,
        diagramRef,
        source: DOMAIN,
        sourceUrl: sourceUrl || buildModelPageUrl(modelNumber),
      });
    });
  });

  // Layout B: flat parts table with section column or data-section row attrs
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

      sectionsDiscovered.add(sectionName);
      parts.push({
        rawPartNumber,
        rawPartName: rawPartName || rawPartNumber,
        sectionName,
        diagramRef,
        source: DOMAIN,
        sourceUrl: sourceUrl || buildModelPageUrl(modelNumber),
      });
    });
  }

  // Layout C: definition-list style (dt = section, dd contains part rows)
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
      parts.push({
        rawPartNumber,
        rawPartName: rawPartName || rawPartNumber,
        sectionName: currentSection,
        diagramRef: null,
        source: DOMAIN,
        sourceUrl: sourceUrl || buildModelPageUrl(modelNumber),
      });
    });
  }

  const unique = uniqueBy(parts, (p) => `${p.rawPartNumber}|${p.sectionName}`);
  return {
    parts: unique,
    sectionsDiscovered: sectionsDiscovered.size || new Set(unique.map((p) => p.sectionName)).size,
  };
}

async function resolveDlPartsModelUrl(modelNumber) {
  // Try the direct model page first; fall back to search
  const directUrl = buildModelPageUrl(modelNumber);
  try {
    const html = await fetchHtml(directUrl);
    const parsed = parseDlPartsModelPage(html, modelNumber, directUrl);
    if (parsed.parts.length > 0) return { url: directUrl, html, parsed };
  } catch (err) {
    if (Number(err?.status) === 404) {
      // expected — fall through to search
    } else {
      throw err;
    }
  }

  const searchUrl = buildModelSearchUrl(modelNumber);
  const searchHtml = await fetchHtml(searchUrl);
  const detailUrl = parseDlPartsSearchResults(searchHtml, modelNumber);
  if (!detailUrl) return { url: null, html: null, parsed: null };

  const html = await fetchHtml(detailUrl);
  const parsed = parseDlPartsModelPage(html, modelNumber, detailUrl);
  return { url: detailUrl, html, parsed };
}

export async function fetchDlPartsDistributorBom({ modelNumber, plan = {} }) {
  console.log(`[Adapter D&L] Deterministic catalog pass for ${modelNumber}`);

  let resolved;
  try {
    resolved = await resolveDlPartsModelUrl(modelNumber);
  } catch (err) {
    const { availability, reason } = availabilityFromError(err);
    return {
      summary: `D&L Parts request failed for ${modelNumber}.`,
      source: DOMAIN,
      truthSource: 'D&L Parts distributor catalog',
      sourceStrategy: 'distributor-dlparts-catalog',
      parts: [],
      sources: [{ title: 'D&L Parts', uri: err?.url || buildModelSearchUrl(modelNumber) }],
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
          sourceUrl: err?.url || buildModelSearchUrl(modelNumber),
        }),
      ],
      planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
    };
  }

  if (!resolved.url || !resolved.parsed || resolved.parsed.parts.length === 0) {
    return {
      summary: `D&L Parts found no parts for ${modelNumber}.`,
      source: DOMAIN,
      truthSource: 'D&L Parts distributor catalog',
      sourceStrategy: 'distributor-dlparts-catalog',
      parts: [],
      sources: [{ title: 'D&L Parts', uri: resolved.url || buildModelSearchUrl(modelNumber) }],
      coverage: {
        provider: DOMAIN,
        sectionsDiscovered: 0,
        sectionsFetched: 0,
        sectionFetchFailures: 0,
        paginationComplete: false,
        flags: ['distributor-no-parts'],
        retrievalState: resolved.url ? 'no_parts_found' : 'model_not_found',
      },
      providerAttempts: [
        buildProviderAttempt({
          provider: DOMAIN,
          stage: 'distributor_fallback',
          availability: 'requires_manual_review',
          reason: resolved.url ? 'D&L Parts page returned no parseable parts.' : 'D&L Parts model URL not resolved.',
          sourceUrl: resolved.url || buildModelSearchUrl(modelNumber),
        }),
      ],
      planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
    };
  }

  const { parts, sectionsDiscovered } = resolved.parsed;
  const sectionNames = new Set(parts.map((p) => p.sectionName).filter(Boolean));

  return {
    summary: `D&L Parts deterministic BOM for ${modelNumber}: ${parts.length} parts across ${sectionNames.size} sections.`,
    source: DOMAIN,
    truthSource: 'D&L Parts distributor catalog',
    sourceStrategy: 'distributor-dlparts-catalog',
    parts,
    sources: [{ title: 'D&L Parts model detail', uri: resolved.url }],
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
        sources: [{ title: 'D&L Parts model detail', uri: resolved.url }],
        coverage: { flags: [], retrievalState: 'parts_found', sectionsDiscovered: sectionNames.size },
      }, 'distributor_fallback'),
    ],
    planMeta: { truthOrder: plan.truthOrder || [], fallbackSources: plan.distributorFallbacks || [DOMAIN] },
  };
}
