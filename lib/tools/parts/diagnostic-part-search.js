import 'server-only';

import { generateStructuredJson } from '@/lib/tools/parts/gemini';
import { normalizePartNumber } from '@/lib/tools/parts/http';
import { normalizeModelNumber } from '@/lib/tools/parts/normalize';

const TARGETED_PART_BATCH_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          candidateIndex: { type: 'number' },
          partName: { type: 'string' },
          partNumber: { type: 'string' },
          source: { type: 'string' },
          sourceUrl: { type: 'string' },
          retailPrice: { type: 'number' },
          retailPriceText: { type: 'string' },
          retailAvailability: { type: 'string' },
          retailPricingUrl: { type: 'string' },
          retailPriceSource: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: [
          'candidateIndex',
          'partName',
          'partNumber',
          'source',
          'sourceUrl',
          'retailPrice',
          'retailPriceText',
          'retailAvailability',
          'retailPricingUrl',
          'retailPriceSource',
          'confidence',
        ],
      },
    },
  },
  required: ['candidates'],
};

const DIAGNOSTIC_PART_SEARCH_MODEL = process.env.DIAGNOSIS_PART_SEARCH_MODEL || 'gemini-3.1-flash-lite-preview';

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function clampConfidence(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(1, numberValue));
}

function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value * 100) / 100;
  const match = String(value || '').match(/([0-9][0-9,]*(?:\.\d{2})?)/);
  if (!match) return null;
  const numberValue = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue * 100) / 100 : null;
}

function normalizeAvailabilityLabel(value) {
  const text = cleanText(value);
  if (/^in\s*stock$/i.test(text) || /^pia$/i.test(text)) return 'Available for Order';
  return text || null;
}

function sourceFromUrl(url) {
  try {
    return new URL(String(url || '')).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function firstSourceUrl(sources = [], preferred = '') {
  const preferredHost = sourceFromUrl(preferred);
  if (preferredHost) {
    const exact = sources.find((source) => sourceFromUrl(source.uri) === preferredHost);
    if (exact?.uri) return exact.uri;
  }

  return sources.find((source) => source?.uri)?.uri || preferred || '';
}

export async function resolveDiagnosticPartCandidate({
  issue,
  partName,
  partNumber,
  brand,
  modelNumber,
  productType,
}) {
  const [candidate] = await resolveDiagnosticPartCandidates({
    brand,
    modelNumber,
    productType,
    candidates: [{ candidateIndex: 0, issue, partName, partNumber }],
  });

  return candidate || null;
}

export async function resolveDiagnosticPartCandidates({
  candidates = [],
  brand,
  modelNumber,
  productType,
  requestContext = null,
}) {
  const normalizedModel = normalizeModelNumber(modelNumber);
  const normalizedCandidates = (candidates || [])
    .map((candidate, fallbackIndex) => {
      const candidateIndex = Number.isFinite(Number(candidate.candidateIndex)) ? Number(candidate.candidateIndex) : fallbackIndex;
      const candidatePartName = cleanText(candidate.partName || candidate.part_name || candidate.issue);
      const candidatePartNumber = normalizePartNumber(candidate.partNumber || candidate.part_number || '');

      return {
        candidateIndex,
        issue: cleanText(candidate.issue) || 'unknown',
        partName: candidatePartName,
        partNumber: candidatePartNumber,
      };
    })
    .filter((candidate) => candidate.partName);

  if (!normalizedModel || normalizedCandidates.length === 0) return [];

  const candidateLines = normalizedCandidates
    .map((candidate) => (
      `- candidateIndex ${candidate.candidateIndex}: issue="${candidate.issue}", partName="${candidate.partName}", partNumber="${candidate.partNumber || 'not provided'}"`
    ))
    .join('\n');

  const prompt = `
You are verifying appliance repair diagnosis candidates against public parts catalogs.

Goal:
Find the OEM part number and current catalog price that fit the exact appliance model and likely failed subsystem for each candidate.

Inputs:
- Brand: ${cleanText(brand) || 'unknown'}
- Model: ${normalizedModel}
- Appliance/System: ${cleanText(productType) || 'unknown'}

Candidates:
${candidateLines}

Search pattern:
1. Search brand + model + candidate part name/part number.
2. Prefer exact model catalog pages from Sears PartsDirect, Encompass, Fix.com, PartSelect, AppliancePartsPros, RepairClinic, or manufacturer parts pages.
3. When you open or cite a catalog page that contains the part, read the part number, part name, current price, availability, and source URL from that same page.

Rules:
- Return a part number only if the source indicates it fits the exact model or the source is an exact model parts page.
- Return a price only if it is a current catalog price from the same supporting catalog page/source.
- Do not infer a part number from generic symptoms.
- If the page proves fitment but does not expose a price, omit that candidate from the candidates array. The repair estimate requires price-backed part entries.
- Do not use marketplace, forum, or AI summary prices.
- If fitment and price are not both supported for a candidate, omit that candidate from the candidates array.
- Never return 0 for retailPrice.

Return JSON only:
{
  "candidates": [
    {
      "candidateIndex": 0,
      "partName": "verified catalog part name",
      "partNumber": "OEM part number",
      "source": "source domain",
      "sourceUrl": "supporting URL",
      "retailPrice": 123.45,
      "retailPriceText": "$123.45",
      "retailAvailability": "Available for Order",
      "retailPricingUrl": "same supporting catalog URL",
      "retailPriceSource": "source domain",
      "confidence": 0.0
    }
  ]
}
`;

  try {
    const { data, sources } = await generateStructuredJson({
      model: DIAGNOSTIC_PART_SEARCH_MODEL,
      tool: 'diagnosis',
      bucket: 'diag.lite_grounded',
      requestContext,
      contents: prompt,
      tools: [{ googleSearch: {} }],
      schema: TARGETED_PART_BATCH_SCHEMA,
      temperature: 0,
      fallback: {
        candidates: [],
      },
    });

    const sourceRows = Array.isArray(sources) ? sources : [];
    const rows = Array.isArray(data?.candidates) ? data.candidates : [];
    const resolved = [];

    for (const row of rows) {
      const resolvedPartNumber = normalizePartNumber(row.partNumber || '');
      const confidence = clampConfidence(row.confidence);
      const retailPrice = parsePrice(row.retailPrice || row.retailPriceText);
      if (!resolvedPartNumber || !retailPrice || confidence < 0.55) continue;

      const candidateIndex = Number(row.candidateIndex);
      const original = normalizedCandidates.find((candidate) => candidate.candidateIndex === candidateIndex);
      if (!original) continue;

      const sourceUrl = firstSourceUrl(sourceRows, row.sourceUrl);
      const source = cleanText(row.source) || sourceFromUrl(sourceUrl) || 'targeted_part_search';
      const retailPricingUrl = firstSourceUrl(sourceRows, row.retailPricingUrl || sourceUrl);
      const retailPriceSource = cleanText(row.retailPriceSource) || sourceFromUrl(retailPricingUrl) || source;

      resolved.push({
        candidateIndex,
        partName: cleanText(row.partName) || original.partName,
        partNumber: resolvedPartNumber,
        source,
        sourceUrl,
        retailPrice,
        retailPriceText: cleanText(row.retailPriceText) || `$${retailPrice.toFixed(2)}`,
        retailAvailability: normalizeAvailabilityLabel(row.retailAvailability),
        retailPricingUrl,
        retailPriceSource,
        retailPriceVerified: true,
        retailPricedAt: new Date().toISOString(),
        confidence,
        provenance: sourceRows.map((source) => ({
          source: source.title || sourceFromUrl(source.uri) || source.uri,
          uri: source.uri,
          note: 'Targeted brand/model/part search.',
        })),
      });
    }

    return resolved;
  } catch (error) {
    console.error('resolveDiagnosticPartCandidates error', error);
    return [];
  }
}
