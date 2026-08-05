import 'server-only';

import { fetchHtml, htmlToText, normalizePartNumber } from '@/lib/tools/parts/http';
import { runWithConcurrency } from '@/lib/tools/parts/concurrency-util';
import { generateText } from '@/lib/tools/parts/gemini';

function parseMoney(raw) {
  const value = Number(String(raw || '').replace(/,/g, '').trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseAvailability(text) {
  const matchers = [
    /In Stock/i,
    /Backorder/i,
    /Special Order/i,
    /Usually ships[^.]{0,80}/i,
    /Ships in[^.]{0,80}/i,
    /Unavailable/i,
    /No Longer Available/i,
    /Discontinued/i,
  ];

  for (const matcher of matchers) {
    const match = String(text || '').match(matcher);
    if (match?.[0]) return match[0].replace(/\s+/g, ' ').trim();
  }
  return null;
}

function normalizeAvailabilityLabel(value) {
  const text = cleanText(value);
  if (/^in\s*stock$/i.test(text)) return 'Available for Order';
  return text || null;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeModelForSearch(value) {
  return cleanText(value).toUpperCase().replace(/\s+/g, '');
}

const PRICING_SUPPLIERS = [
  { domain: 'encompass.com', label: 'Encompass' },
  { domain: 'searspartsdirect.com', label: 'Sears PartsDirect' },
  { domain: 'reliableparts.com', label: 'Reliable Parts' },
];

const PRICING_SEARCH_MODEL = process.env.PRICING_GROUNDED_SEARCH_MODEL || 'gemini-3.1-flash-lite-preview';

function hostnameOf(url) {
  try {
    return new URL(String(url || '')).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function looksLikeSupplierUrl(url, domain) {
  const host = hostnameOf(url);
  return host === domain || host.endsWith(`.${domain}`);
}

function dedupeHits(hits = []) {
  const seen = new Set();
  const out = [];
  for (const hit of hits) {
    const url = String(hit?.url || '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ ...hit, url });
  }
  return out;
}

function firstSupplierUrl(sources = [], supplier) {
  const match = (sources || []).find((source) => looksLikeSupplierUrl(source?.uri, supplier.domain));
  return match?.uri || '';
}

function textExcerpt(value, maxLength = 1200) {
  const text = cleanText(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function evidenceSources(sources = [], supplier) {
  return (sources || [])
    .filter((source) => !supplier || looksLikeSupplierUrl(source?.uri, supplier.domain))
    .slice(0, 6)
    .map((source) => ({
      title: cleanText(source.title),
      uri: cleanText(source.uri),
    }))
    .filter((source) => source.uri);
}

function withEvidence(snapshot, evidence) {
  return {
    ...snapshot,
    pricingEvidence: evidence,
  };
}

function buildSupplierSearchQuery({ supplier, modelNumber, partNumber }) {
  const normalizedPart = normalizePartNumber(partNumber);
  const normalizedModel = normalizeModelForSearch(modelNumber);
  if (supplier.domain === 'encompass.com' || !normalizedModel) {
    return `site:${supplier.domain} "${normalizedPart}" "${supplier.label}"`;
  }

  return `site:${supplier.domain} "${normalizedModel}" "${normalizedPart}"`;
}

async function resolveSupplierGroundedPrice({ supplier, modelNumber = '', partNumber, tool = 'partFinder', bucket = 'parts.lite_grounded', requestContext = null }) {
  const normalizedPart = normalizePartNumber(partNumber);
  if (!normalizedPart) return null;
  const evidence = [];
  const query = buildSupplierSearchQuery({ supplier, modelNumber, partNumber: normalizedPart });

  try {
    const result = await generateText({
      model: PRICING_SEARCH_MODEL,
      contents: query,
      config: {
        temperature: 0,
        tools: [{ googleSearch: {} }],
        tool,
        bucket,
        requestContext,
      },
    });

    const groundedTextSnapshot = extractSnapshotFromPageText({
      pageText: result.text,
      partNumber: normalizedPart,
      pricingUrl: firstSupplierUrl(result.sources, supplier) || `https://${supplier.domain}`,
      priceSource: supplier.domain,
    });

    evidence.push({
      supplier: supplier.domain,
      method: 'grounded_supplier_search',
      query,
      model: PRICING_SEARCH_MODEL,
      sources: evidenceSources(result.sources, supplier),
      partMentioned: String(result.text || '').toUpperCase().includes(normalizedPart.toUpperCase()),
      priceFound: Boolean(groundedTextSnapshot),
      textExcerpt: textExcerpt(result.text),
      checkedAt: new Date().toISOString(),
    });

    if (groundedTextSnapshot) return withEvidence(groundedTextSnapshot, evidence);

    const hits = dedupeHits((result.sources || [])
      .filter((source) => looksLikeSupplierUrl(source.uri, supplier.domain))
      .map((source) => ({
        url: source.uri,
        title: source.title || '',
        query: 'supplier_catalog_price_waterfall',
        source: supplier.domain,
      })))
      .slice(0, 4);

    for (const hit of hits) {
      try {
        const html = await fetchHtml(hit.url);
        const pageText = htmlToText(html);
        const snapshot = extractSnapshotFromPageText({
          pageText,
          partNumber: normalizedPart,
          pricingUrl: hit.url,
          priceSource: hit.source || hostnameOf(hit.url) || 'supplier_catalog',
        });

        evidence.push({
          supplier: supplier.domain,
          method: 'grounded_source_fetch',
          url: hit.url,
          partMentioned: pageText.toUpperCase().includes(normalizedPart.toUpperCase()),
          priceFound: Boolean(snapshot),
          textExcerpt: textExcerpt(pageText, 700),
          checkedAt: new Date().toISOString(),
        });

        if (snapshot) return withEvidence(snapshot, evidence);
      } catch (error) {
        evidence.push({
          supplier: supplier.domain,
          method: 'grounded_source_fetch',
          url: hit.url,
          priceFound: false,
          error: cleanText(error?.message || error),
          checkedAt: new Date().toISOString(),
        });
        // Try the next grounded source from this same supplier only.
      }
    }
  } catch (error) {
    evidence.push({
      supplier: supplier.domain,
      method: 'grounded_supplier_search',
      query,
      model: PRICING_SEARCH_MODEL,
      priceFound: false,
      error: cleanText(error?.message || error),
      checkedAt: new Date().toISOString(),
    });
    console.error('resolveSupplierGroundedPrice error', error);
  }

  return {
    partNumber: normalizedPart,
    retailPrice: null,
    retailPriceText: null,
    retailAvailability: null,
    retailPricingUrl: firstSupplierUrl(evidence.flatMap((entry) => entry.sources || []), supplier) || null,
    retailPriceSource: supplier.domain,
    retailPriceVerified: false,
    retailPricedAt: new Date().toISOString(),
    pricingEvidence: evidence,
  };
}

function extractPriceFromTextWindow(windowText) {
  const patterns = [
    /(?:sale price|our price|price|part price)\s*[:\-]?\s*\$?\s*([0-9][0-9,]*(?:\.\d{2})?)/i,
    /\$\s*([0-9][0-9,]*(?:\.\d{2})?)/,
    /(?:^|\s)([0-9][0-9,]*(?:\.\d{2}))(?=\s+(?:In Stock|Backorder|Ships in|Usually ships|Special Order|No Longer Available|Unavailable|Add to Cart))/i,
  ];

  for (const pattern of patterns) {
    const match = String(windowText || '').match(pattern);
    const value = parseMoney(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function extractSnapshotFromPageText({ pageText, partNumber, pricingUrl, priceSource = 'encompass.com' }) {
  const normalizedPart = normalizePartNumber(partNumber);
  const haystack = String(pageText || '').toUpperCase();
  const token = normalizedPart.toUpperCase();

  let index = haystack.indexOf(token);
  let attempts = 0;

  while (index !== -1 && attempts < 8) {
    const start = Math.max(0, index - 600);
    const end = Math.min(pageText.length, index + 1000);
    const windowText = pageText.slice(start, end);
    const price = extractPriceFromTextWindow(windowText);
    if (price) {
      return {
        partNumber: normalizedPart,
        retailPrice: price,
        retailPriceText: `$${price.toFixed(2)}`,
        retailAvailability: normalizeAvailabilityLabel(parseAvailability(windowText)),
        retailPricingUrl: pricingUrl,
        retailPriceSource: priceSource,
        retailPriceVerified: true,
        retailPricedAt: new Date().toISOString(),
      };
    }

    index = haystack.indexOf(token, index + token.length);
    attempts += 1;
  }

  return null;
}

export async function resolveEncompassPriceForPart({ partNumber, modelNumber = '', tool = 'partFinder', bucket = 'parts.lite_grounded', requestContext = null }) {
  const normalizedPart = normalizePartNumber(partNumber);
  if (!normalizedPart) return null;
  const evidence = [];

  const directUrl = `https://encompass.com/item/${encodeURIComponent(normalizedPart)}`;
  try {
    const html = await fetchHtml(directUrl);
    const pageText = htmlToText(html);
    const snapshot = extractSnapshotFromPageText({ pageText, partNumber: normalizedPart, pricingUrl: directUrl, priceSource: 'encompass.com' });
    evidence.push({
      supplier: 'encompass.com',
      method: 'direct_item_fetch',
      url: directUrl,
      partMentioned: pageText.toUpperCase().includes(normalizedPart.toUpperCase()),
      priceFound: Boolean(snapshot),
      textExcerpt: textExcerpt(pageText, 700),
      checkedAt: new Date().toISOString(),
    });
    if (snapshot) return withEvidence(snapshot, evidence);
  } catch (error) {
    evidence.push({
      supplier: 'encompass.com',
      method: 'direct_item_fetch',
      url: directUrl,
      priceFound: false,
      error: cleanText(error?.message || error),
      checkedAt: new Date().toISOString(),
    });
    // Continue into the grounded-search fallback below.
  }

  for (const supplier of PRICING_SUPPLIERS) {
    const snapshot = await resolveSupplierGroundedPrice({ supplier, modelNumber, partNumber: normalizedPart, tool, bucket, requestContext });
    const combinedEvidence = [...evidence, ...(snapshot?.pricingEvidence || [])];
    if (snapshot?.retailPriceVerified) return withEvidence(snapshot, combinedEvidence);
    evidence.push(...(snapshot?.pricingEvidence || []));
  }

  return {
    partNumber: normalizedPart,
    retailPrice: null,
    retailPriceText: null,
    retailAvailability: null,
    retailPricingUrl: null,
    retailPriceSource: 'supplier_catalog',
    retailPriceVerified: false,
    retailPricedAt: new Date().toISOString(),
    pricingEvidence: evidence,
  };
}

export async function resolveEncompassPricesForParts(partNumbers = [], options = {}) {
  const uniquePartNumbers = [...new Set((partNumbers || []).map(normalizePartNumber).filter(Boolean))];
  const limit = Math.max(1, Math.min(8, Number(options.concurrency || process.env.ENCOMPASS_PRICING_CONCURRENCY || 4)));
  const maxLookups = Math.max(0, Number(options.maxLookups ?? process.env.ENCOMPASS_PRICING_MAX_LOOKUPS ?? 24));
  const targets = uniquePartNumbers.slice(0, maxLookups);

  const results = await runWithConcurrency(targets, limit, async (partNumber) => {
    try {
      return {
        partNumber,
        snapshot: await resolveEncompassPriceForPart({
          partNumber,
          modelNumber: options.modelNumber || '',
          tool: options.tool || 'partFinder',
          bucket: options.bucket || 'parts.lite_grounded',
          requestContext: options.requestContext || null,
        }),
      };
    } catch {
      return { partNumber, snapshot: null };
    }
  });

  const map = new Map();
  for (const result of results) {
    if (result.snapshot) map.set(result.partNumber, result.snapshot);
  }
  return map;
}
