export type EvidenceKind =
  | 'direct_fetch'
  | 'grounded_search'
  | 'catalog_fetch'
  | 'no_price_found'
  | 'error';

export type PartPricingEvidence = {
  partNumber: string;
  supplier: string;
  price: number | null;
  currency: string;
  availability: string | null;
  sourceUrl: string | null;
  matchConfidence: number; // 0–100
  checkedAt: string; // ISO 8601
  evidenceKind: EvidenceKind;
};

// Higher = preferred / checked first.
const SUPPLIER_PRIORITY: Record<string, number> = {
  'encompass.com': 100,
  'searspartsdirect.com': 80,
  'reliableparts.com': 60,
};

export function supplierPriorityScore(supplier: string): number {
  const key = String(supplier || '').toLowerCase().replace(/^www\./, '');
  return SUPPLIER_PRIORITY[key] ?? 40;
}

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function methodToEvidenceKind(method: string | undefined): EvidenceKind {
  if (method === 'direct_item_fetch') return 'direct_fetch';
  if (method === 'grounded_supplier_search') return 'grounded_search';
  if (method === 'grounded_source_fetch') return 'catalog_fetch';
  return 'error';
}

// Shape of raw entries inside the `pricingEvidence` array from encompass.js.
type RawEvidenceEntry = {
  supplier?: string;
  method?: string;
  url?: string | null;
  sources?: Array<{ uri?: string }>;
  partMentioned?: boolean;
  priceFound?: boolean;
  checkedAt?: string;
  error?: string | null;
};

// Shape of the snapshot returned by resolveEncompassPriceForPart.
type RawPricingSnapshot = {
  partNumber?: string;
  retailPrice?: number | null;
  retailAvailability?: string | null;
  retailPricingUrl?: string | null;
  retailPriceSource?: string;
  retailPriceVerified?: boolean;
  retailPricedAt?: string;
  pricingEvidence?: RawEvidenceEntry[];
};

function confidenceForEntry(entry: RawEvidenceEntry, snapshotSource: string): number {
  if (entry.error) return 0;
  if (!entry.priceFound) return entry.partMentioned ? 20 : 10;
  const base = supplierPriorityScore(entry.supplier || snapshotSource);
  return clampConfidence(60 + Math.round(base * 0.4));
}

export function buildNoPriceEvidence(partNumber: string, supplier: string): PartPricingEvidence {
  return {
    partNumber,
    supplier,
    price: null,
    currency: 'USD',
    availability: null,
    sourceUrl: null,
    matchConfidence: 0,
    checkedAt: new Date().toISOString(),
    evidenceKind: 'no_price_found',
  };
}

/**
 * Converts a raw snapshot from resolveEncompassPriceForPart into typed
 * PartPricingEvidence[]. Does NOT read or modify any BOMProviderEvidence.
 */
export function normalizePricingEvidence(
  snapshot: RawPricingSnapshot | null | undefined,
  partNumber: string,
): PartPricingEvidence[] {
  if (!snapshot) return [buildNoPriceEvidence(partNumber, 'supplier_catalog')];

  const rawEntries: RawEvidenceEntry[] = snapshot.pricingEvidence ?? [];
  if (rawEntries.length === 0) {
    return [buildNoPriceEvidence(partNumber, snapshot.retailPriceSource ?? 'supplier_catalog')];
  }

  const priceVerified = snapshot.retailPriceVerified === true && snapshot.retailPrice != null;
  const snapshotSource = snapshot.retailPriceSource ?? 'supplier_catalog';

  const evidence: PartPricingEvidence[] = rawEntries.map((entry): PartPricingEvidence => {
    // Attribute the snapshot price to the entry that reported it.
    const isHit =
      priceVerified &&
      entry.priceFound === true &&
      (entry.url === snapshot.retailPricingUrl || entry.supplier === snapshotSource);

    const price = isHit ? (snapshot.retailPrice ?? null) : null;
    const kind: EvidenceKind = entry.error
      ? 'error'
      : !entry.priceFound
        ? 'no_price_found'
        : methodToEvidenceKind(entry.method);

    return {
      partNumber: snapshot.partNumber ?? partNumber,
      supplier: entry.supplier ?? snapshotSource,
      price,
      currency: 'USD',
      availability: isHit ? (snapshot.retailAvailability ?? null) : null,
      sourceUrl: entry.url ?? null,
      matchConfidence: confidenceForEntry(entry, snapshotSource),
      checkedAt: entry.checkedAt ?? snapshot.retailPricedAt ?? new Date().toISOString(),
      evidenceKind: kind,
    };
  });

  // If the snapshot says a price was found but no entry was matched as the hit,
  // synthesize a canonical evidence record so the price is never silently lost.
  if (priceVerified && !evidence.some((e) => e.price != null)) {
    evidence.unshift({
      partNumber: snapshot.partNumber ?? partNumber,
      supplier: snapshotSource,
      price: snapshot.retailPrice!,
      currency: 'USD',
      availability: snapshot.retailAvailability ?? null,
      sourceUrl: snapshot.retailPricingUrl ?? null,
      matchConfidence: clampConfidence(60 + Math.round(supplierPriorityScore(snapshotSource) * 0.4)),
      checkedAt: snapshot.retailPricedAt ?? new Date().toISOString(),
      evidenceKind: 'direct_fetch',
    });
  }

  return sortPricingEvidence(evidence);
}

/**
 * Sorts evidence: records with a price first (by supplier priority desc),
 * then no-price/error records (by supplier priority desc).
 */
export function sortPricingEvidence(evidence: PartPricingEvidence[]): PartPricingEvidence[] {
  return [...evidence].sort((a, b) => {
    const aPrice = a.price != null ? 1 : 0;
    const bPrice = b.price != null ? 1 : 0;
    if (aPrice !== bPrice) return bPrice - aPrice;
    return supplierPriorityScore(b.supplier) - supplierPriorityScore(a.supplier);
  });
}

/**
 * Returns the best evidence item that carries a price (highest supplier priority).
 * Returns an explicit no_price_found record when nothing has a price.
 */
export function selectBestPricingEvidence(
  evidence: PartPricingEvidence[],
  partNumber: string,
): PartPricingEvidence {
  const sorted = sortPricingEvidence(evidence);
  return sorted.find((e) => e.price != null) ?? buildNoPriceEvidence(partNumber, 'supplier_catalog');
}
