import { describe, expect, it } from 'vitest';
import {
  buildNoPriceEvidence,
  clampConfidence,
  normalizePricingEvidence,
  selectBestPricingEvidence,
  sortPricingEvidence,
  supplierPriorityScore,
  type PartPricingEvidence,
} from './pricing-evidence';

describe('PartPricingEvidence contract', () => {
  describe('supplierPriorityScore', () => {
    it('ranks Encompass highest', () => {
      expect(supplierPriorityScore('encompass.com')).toBeGreaterThan(supplierPriorityScore('searspartsdirect.com'));
      expect(supplierPriorityScore('encompass.com')).toBeGreaterThan(supplierPriorityScore('reliableparts.com'));
    });

    it('ranks Sears above ReliableParts', () => {
      expect(supplierPriorityScore('searspartsdirect.com')).toBeGreaterThan(supplierPriorityScore('reliableparts.com'));
    });

    it('ranks unknown suppliers lower than any named supplier', () => {
      expect(supplierPriorityScore('reliableparts.com')).toBeGreaterThan(supplierPriorityScore('unknown-parts.com'));
    });

    it('strips www. prefix before lookup', () => {
      expect(supplierPriorityScore('www.encompass.com')).toBe(supplierPriorityScore('encompass.com'));
    });
  });

  describe('clampConfidence', () => {
    it('clamps below 0 to 0', () => expect(clampConfidence(-10)).toBe(0));
    it('clamps above 100 to 100', () => expect(clampConfidence(150)).toBe(100));
    it('passes through values in range', () => expect(clampConfidence(75)).toBe(75));
    it('rounds fractional values', () => expect(clampConfidence(74.6)).toBe(75));
  });

  describe('buildNoPriceEvidence', () => {
    it('produces explicit no_price_found evidence', () => {
      const ev = buildNoPriceEvidence('WP3360311', 'supplier_catalog');
      expect(ev.evidenceKind).toBe('no_price_found');
      expect(ev.price).toBeNull();
      expect(ev.partNumber).toBe('WP3360311');
      expect(ev.matchConfidence).toBe(0);
      expect(ev.currency).toBe('USD');
    });

    it('preserves the supplier field', () => {
      const ev = buildNoPriceEvidence('WP3360311', 'encompass.com');
      expect(ev.supplier).toBe('encompass.com');
    });
  });

  describe('normalizePricingEvidence', () => {
    it('returns no_price_found when snapshot is null', () => {
      const result = normalizePricingEvidence(null, 'WP3360311');
      expect(result).toHaveLength(1);
      expect(result[0].evidenceKind).toBe('no_price_found');
      expect(result[0].price).toBeNull();
    });

    it('returns no_price_found when pricingEvidence array is empty', () => {
      const result = normalizePricingEvidence(
        { partNumber: 'WP3360311', retailPriceVerified: false, pricingEvidence: [] },
        'WP3360311',
      );
      expect(result).toHaveLength(1);
      expect(result[0].evidenceKind).toBe('no_price_found');
    });

    it('maps Encompass direct_fetch as highest-confidence evidence', () => {
      const snapshot = {
        partNumber: 'WP3360311',
        retailPrice: 42.99,
        retailAvailability: 'Available for Order',
        retailPricingUrl: 'https://encompass.com/item/WP3360311',
        retailPriceSource: 'encompass.com',
        retailPriceVerified: true,
        retailPricedAt: '2026-05-16T00:00:00.000Z',
        pricingEvidence: [
          {
            supplier: 'encompass.com',
            method: 'direct_item_fetch',
            url: 'https://encompass.com/item/WP3360311',
            partMentioned: true,
            priceFound: true,
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
        ],
      };

      const result = normalizePricingEvidence(snapshot, 'WP3360311');
      expect(result[0].supplier).toBe('encompass.com');
      expect(result[0].price).toBe(42.99);
      expect(result[0].evidenceKind).toBe('direct_fetch');
      expect(result[0].availability).toBe('Available for Order');
      expect(result[0].sourceUrl).toBe('https://encompass.com/item/WP3360311');
      expect(result[0].matchConfidence).toBeGreaterThan(0);
      expect(result[0].matchConfidence).toBeLessThanOrEqual(100);
    });

    it('Sears grounded_search evidence sorts below Encompass direct_fetch', () => {
      const snapshot = {
        partNumber: 'WP3360311',
        retailPrice: 42.99,
        retailPricingUrl: 'https://encompass.com/item/WP3360311',
        retailPriceSource: 'encompass.com',
        retailPriceVerified: true,
        retailPricedAt: '2026-05-16T00:00:00.000Z',
        pricingEvidence: [
          {
            supplier: 'searspartsdirect.com',
            method: 'grounded_supplier_search',
            partMentioned: true,
            priceFound: true,
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
          {
            supplier: 'encompass.com',
            method: 'direct_item_fetch',
            url: 'https://encompass.com/item/WP3360311',
            partMentioned: true,
            priceFound: true,
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
        ],
      };

      const result = normalizePricingEvidence(snapshot, 'WP3360311');
      expect(result[0].supplier).toBe('encompass.com');
    });

    it('pricing evidence does not contain BOMProviderEvidence fields', () => {
      const snapshot = {
        partNumber: 'WP3360311',
        retailPrice: null,
        retailPriceVerified: false,
        retailPricedAt: '2026-05-16T00:00:00.000Z',
        pricingEvidence: [
          {
            supplier: 'encompass.com',
            method: 'direct_item_fetch',
            url: 'https://encompass.com/item/WP3360311',
            partMentioned: false,
            priceFound: false,
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
        ],
      };

      const result = normalizePricingEvidence(snapshot, 'WP3360311');
      for (const ev of result) {
        // BOMProviderEvidence-specific fields must not leak into pricing evidence
        expect('provider' in ev).toBe(false);
        expect('modelNumber' in ev).toBe(false);
        expect('assemblySections' in ev).toBe(false);
        expect('parts' in ev).toBe(false);
        expect('sourceTruthKind' in ev).toBe(false);
        expect('retrievalState' in ev).toBe(false);
        // Required PartPricingEvidence fields must be present
        expect(ev).toHaveProperty('partNumber');
        expect(ev).toHaveProperty('supplier');
        expect(ev).toHaveProperty('price');
        expect(ev).toHaveProperty('currency');
        expect(ev).toHaveProperty('evidenceKind');
        expect(ev).toHaveProperty('checkedAt');
        expect(ev).toHaveProperty('matchConfidence');
        expect(ev).toHaveProperty('availability');
        expect(ev).toHaveProperty('sourceUrl');
      }
    });

    it('matchConfidence is always bounded 0–100 across all entries', () => {
      const snapshot = {
        partNumber: 'WP3360311',
        retailPrice: 42.99,
        retailPriceVerified: true,
        retailPriceSource: 'encompass.com',
        retailPricingUrl: 'https://encompass.com/item/WP3360311',
        retailPricedAt: '2026-05-16T00:00:00.000Z',
        pricingEvidence: [
          {
            supplier: 'encompass.com',
            method: 'direct_item_fetch',
            url: 'https://encompass.com/item/WP3360311',
            partMentioned: true,
            priceFound: true,
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
          {
            supplier: 'searspartsdirect.com',
            method: 'grounded_supplier_search',
            partMentioned: false,
            priceFound: false,
            checkedAt: '2026-05-16T00:00:00.000Z',
            error: 'Network timeout',
          },
          {
            supplier: 'reliableparts.com',
            method: 'grounded_source_fetch',
            partMentioned: true,
            priceFound: false,
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
        ],
      };

      const result = normalizePricingEvidence(snapshot, 'WP3360311');
      for (const ev of result) {
        expect(ev.matchConfidence).toBeGreaterThanOrEqual(0);
        expect(ev.matchConfidence).toBeLessThanOrEqual(100);
      }
    });

    it('error entries get zero confidence', () => {
      const snapshot = {
        partNumber: 'WP3360311',
        retailPrice: null,
        retailPriceVerified: false,
        retailPricedAt: '2026-05-16T00:00:00.000Z',
        pricingEvidence: [
          {
            supplier: 'encompass.com',
            method: 'direct_item_fetch',
            url: 'https://encompass.com/item/WP3360311',
            priceFound: false,
            error: 'Connection refused',
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
        ],
      };

      const result = normalizePricingEvidence(snapshot, 'WP3360311');
      const errorEntry = result.find((e) => e.evidenceKind === 'error');
      expect(errorEntry).toBeDefined();
      expect(errorEntry!.matchConfidence).toBe(0);
    });

    it('preserves checkedAt from raw evidence entries', () => {
      const checkedAt = '2026-01-01T12:00:00.000Z';
      const snapshot = {
        partNumber: 'WP3360311',
        retailPrice: null,
        retailPriceVerified: false,
        pricingEvidence: [
          {
            supplier: 'encompass.com',
            method: 'direct_item_fetch',
            url: 'https://encompass.com/item/WP3360311',
            partMentioned: false,
            priceFound: false,
            checkedAt,
          },
        ],
      };

      const result = normalizePricingEvidence(snapshot, 'WP3360311');
      expect(result[0].checkedAt).toBe(checkedAt);
    });

    it('preserves sourceUrl from raw evidence entries', () => {
      const url = 'https://searspartsdirect.com/part/WP3360311';
      const snapshot = {
        partNumber: 'WP3360311',
        retailPrice: null,
        retailPriceVerified: false,
        pricingEvidence: [
          {
            supplier: 'searspartsdirect.com',
            method: 'grounded_source_fetch',
            url,
            partMentioned: true,
            priceFound: false,
            checkedAt: '2026-05-16T00:00:00.000Z',
          },
        ],
      };

      const result = normalizePricingEvidence(snapshot, 'WP3360311');
      expect(result[0].sourceUrl).toBe(url);
    });
  });

  describe('sortPricingEvidence', () => {
    it('places price-bearing Encompass evidence first', () => {
      const items: PartPricingEvidence[] = [
        {
          partNumber: 'X',
          supplier: 'reliableparts.com',
          price: 39.99,
          currency: 'USD',
          availability: null,
          sourceUrl: null,
          matchConfidence: 60,
          checkedAt: '2026-05-16T00:00:00.000Z',
          evidenceKind: 'catalog_fetch',
        },
        {
          partNumber: 'X',
          supplier: 'encompass.com',
          price: null,
          currency: 'USD',
          availability: null,
          sourceUrl: null,
          matchConfidence: 0,
          checkedAt: '2026-05-16T00:00:00.000Z',
          evidenceKind: 'no_price_found',
        },
        {
          partNumber: 'X',
          supplier: 'encompass.com',
          price: 42.99,
          currency: 'USD',
          availability: null,
          sourceUrl: null,
          matchConfidence: 100,
          checkedAt: '2026-05-16T00:00:00.000Z',
          evidenceKind: 'direct_fetch',
        },
      ];

      const sorted = sortPricingEvidence(items);
      expect(sorted[0].supplier).toBe('encompass.com');
      expect(sorted[0].price).toBe(42.99);
    });

    it('sorts Sears below Encompass and above ReliableParts when all have prices', () => {
      const items: PartPricingEvidence[] = [
        { partNumber: 'X', supplier: 'reliableparts.com', price: 39.99, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 60, checkedAt: '', evidenceKind: 'catalog_fetch' },
        { partNumber: 'X', supplier: 'searspartsdirect.com', price: 44.99, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 80, checkedAt: '', evidenceKind: 'grounded_search' },
        { partNumber: 'X', supplier: 'encompass.com', price: 42.99, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 100, checkedAt: '', evidenceKind: 'direct_fetch' },
      ];

      const sorted = sortPricingEvidence(items);
      expect(sorted.map((e) => e.supplier)).toEqual([
        'encompass.com',
        'searspartsdirect.com',
        'reliableparts.com',
      ]);
    });
  });

  describe('selectBestPricingEvidence', () => {
    it('returns Encompass price when it is available', () => {
      const evidence: PartPricingEvidence[] = [
        { partNumber: 'WP3360311', supplier: 'reliableparts.com', price: 39.99, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 60, checkedAt: '', evidenceKind: 'catalog_fetch' },
        { partNumber: 'WP3360311', supplier: 'encompass.com', price: 42.99, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 100, checkedAt: '', evidenceKind: 'direct_fetch' },
      ];

      const best = selectBestPricingEvidence(evidence, 'WP3360311');
      expect(best.supplier).toBe('encompass.com');
      expect(best.price).toBe(42.99);
    });

    it('falls back to Sears when Encompass has no price', () => {
      const evidence: PartPricingEvidence[] = [
        { partNumber: 'WP3360311', supplier: 'encompass.com', price: null, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 0, checkedAt: '', evidenceKind: 'no_price_found' },
        { partNumber: 'WP3360311', supplier: 'searspartsdirect.com', price: 44.99, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 80, checkedAt: '', evidenceKind: 'grounded_search' },
      ];

      const best = selectBestPricingEvidence(evidence, 'WP3360311');
      expect(best.supplier).toBe('searspartsdirect.com');
      expect(best.price).toBe(44.99);
    });

    it('returns explicit no_price_found when nothing has a price', () => {
      const evidence: PartPricingEvidence[] = [
        { partNumber: 'WP3360311', supplier: 'encompass.com', price: null, currency: 'USD', availability: null, sourceUrl: null, matchConfidence: 0, checkedAt: '', evidenceKind: 'no_price_found' },
      ];

      const best = selectBestPricingEvidence(evidence, 'WP3360311');
      expect(best.evidenceKind).toBe('no_price_found');
      expect(best.price).toBeNull();
    });
  });
});
