import 'server-only';

import { getPartsForAppliance } from '@/lib/tools/parts/parts-service';
import { normalizeModelNumber } from '@/lib/tools/parts/normalize';
import { normalizePartNumber } from '@/lib/tools/parts/http';
import { resolveEncompassPricesForParts } from '@/lib/tools/parts/pricing/encompass';
import { applyEncompassPriceSnapshot } from '@/lib/tools/parts/part-number-store';
import { queueCatalogPopulationFromParts } from '@/lib/tools/parts/catalog-population';

function partNumberOf(part) {
  return normalizePartNumber(part?.canonicalPartNumber || part?.partNumber || part?.rawPartNumber || '');
}

function partNameOf(part) {
  return String(part?.canonicalPartName || part?.name || part?.rawPartName || 'Appliance Part').trim();
}

function sourceOf(part) {
  return String(part?.preferredSource || part?.source || '').trim() || null;
}

function numberOrNull(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue * 100) / 100 : null;
}

function normalizeAvailabilityLabel(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (/^in\s*stock$/i.test(text) || /^pia$/i.test(text)) return 'Available for Order';
  return text;
}

function pricePayloadFromProviderRow(row = {}) {
  const rawPayload = row.rawPayload || row.raw_payload;
  if (!rawPayload || typeof rawPayload !== 'object') return {};
  const nested = rawPayload.rawPayload || rawPayload.raw_payload;
  return nested && typeof nested === 'object' ? nested : rawPayload;
}

function priceFromProviderRows(providerRows = []) {
  for (const row of providerRows) {
    const rawPayload = row.rawPayload || row.raw_payload || {};
    const payload = pricePayloadFromProviderRow(row);
    const price = numberOrNull(row.retailPrice || row.retail_price || row.price || payload.price || payload.sellPrice);
    if (!price) continue;

    return {
      retailPrice: price,
      retailPriceText: `$${price.toFixed(2)}`,
      retailAvailability: normalizeAvailabilityLabel(row.retailAvailability || row.availabilityStatus || payload.availabilityStatus),
      retailPricingUrl: row.evidenceUrl || row.sectionUrl || row.evidence_url || row.section_url || rawPayload.evidenceUrl || rawPayload.sectionUrl || null,
      retailPriceSource: row.source || 'supplier_catalog',
      retailPriceVerified: true,
    };
  }
  return null;
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

export function normalizeContextPart(part = {}) {
  const providerRows = Array.isArray(part.providerRows) ? part.providerRows : Array.isArray(part.provider_rows) ? part.provider_rows : [];
  const firstProviderRow = providerRows[0] || {};
  const priceSnapshot = priceFromProviderRows(providerRows);
  return {
    partNumber: partNumberOf(part),
    partName: partNameOf(part),
    category: part.normalizedCategory || part.category || null,
    section: part.normalizedSection || part.section || firstProviderRow.section_name || firstProviderRow.sectionName || null,
    preferredSource: sourceOf(part) || firstProviderRow.source || null,
    diagramRef: part.diagramRef || firstProviderRow.diagram_ref || firstProviderRow.diagramRef || null,
    substitutePartNumbers: part.substitutes || part.substituteChain || part.substitute_chain || [],
    serialApplicability: part.serialApplicability || part.serial_applicability || [],
    providerRows,
    ...(priceSnapshot || {}),
  };
}

function buildWarnings(raw, normalizedParts) {
  const warnings = [];
  const status = normalizeContextStatus(raw?.status);
  if (!raw || normalizedParts.length === 0) {
    warnings.push({ code: 'no_verified_parts_context', message: 'No model-specific parts context was found.' });
  }
  if (status && status !== 'bom_complete') {
    warnings.push({ code: 'parts_context_not_complete', message: `Parts context status is ${status}.` });
  }
  if (raw?.coverage?.flags?.length) {
    for (const flag of raw.coverage.flags) warnings.push({ code: String(flag), message: String(flag) });
  }
  if (raw?.retrievalTrace?.rowsBySource && !raw.retrievalTrace.rowsBySource['searspartsdirect.com'] && !raw.retrievalTrace.rowsBySource['encompass.com']) {
    warnings.push({ code: 'limited_authoritative_sources', message: 'No Sears or Encompass rows were present in the retrieved context.' });
  }
  return warnings;
}

export async function resolveAppliancePartsContext({ modelNumber, serialNumber = '', brand = null, productType = null, exhaustiveMode = false, includePricing = false, maxPricedParts = 24 }) {
  const normalizedModel = normalizeModelNumber(modelNumber);
  const raw = await getPartsForAppliance({ modelNumber, serialNumber, brand, productType, exhaustiveMode });
  const normalizedParts = (raw.parts || []).map(normalizeContextPart).filter((part) => part.partNumber);
  queueCatalogPopulationFromParts({
    modelNumber,
    canonicalModel: raw.canonicalModel || normalizedModel,
    parts: normalizedParts,
    source: 'troubleshoot-parts-context',
  });
  const partNumbers = normalizedParts.map((part) => part.partNumber);
  const pricing = includePricing
    ? await resolveEncompassPricesForParts(partNumbers, { maxLookups: maxPricedParts, modelNumber: raw.canonicalModel || normalizedModel })
    : new Map();

  if (pricing.size > 0) {
    await Promise.all([...pricing.entries()].map(([partNumber, snapshot]) => applyEncompassPriceSnapshot(partNumber, snapshot)));
  }

  const pricedParts = normalizedParts.map((part) => {
    const snapshot = pricing.get(part.partNumber);
    return snapshot
      ? {
          ...part,
          retailPrice: snapshot.retailPrice,
          retailPriceText: snapshot.retailPriceText,
          retailAvailability: snapshot.retailAvailability,
          retailPricingUrl: snapshot.retailPricingUrl,
          retailPriceSource: snapshot.retailPriceSource,
          retailPriceVerified: snapshot.retailPriceVerified,
        }
      : part;
  });

  return {
    modelNumber,
    normalizedModel,
    canonicalModel: raw.canonicalModel || raw.canonical_model || normalizedModel,
    brand: raw.brand || brand || null,
    productType: raw.productType || raw.product_type || productType || null,
    serialNumberUsed: raw.serialNumberUsed || serialNumber || null,
    status: normalizeContextStatus(raw.status),
    parts: pricedParts,
    partCount: pricedParts.length,
    sources: raw.sources || [],
    retrievalTrace: raw.retrievalTrace || null,
    completeness: raw.completeness || null,
    warnings: buildWarnings(raw, pricedParts),
    provenance: [
      ...(raw.sources || []).map((source) => ({ source: source.title || source.uri, uri: source.uri || '', note: 'Part Finder shared parts context.' })),
      { source: 'supplier_catalog', uri: 'internal supplier price waterfall', note: 'Internal pricing source for verified part lookups.' },
    ],
  };
}
