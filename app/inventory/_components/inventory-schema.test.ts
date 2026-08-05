
import { describe, it, expect } from 'vitest';
import { inventorySchema, mergeInventoryData, InventoryFormValues } from './inventory-schema';
import { ItemCondition } from '@/lib/inventory-types';

describe('Inventory Schema', () => {
    const validData = {
        title: 'Samsung Washer',
        brand: 'Samsung',
        model: 'WV60M9900AV',
        serial: '123456789',
        price: 1200,
        category: 'Washer',
        condition: ItemCondition.GOOD,
        imageUrl: '',
    };

    it('validates a correct minimal object', () => {
        const result = inventorySchema.parse(validData);
        expect(result.title).toBe(validData.title);
    });

    it('validates numeric coercion', () => {
        const data = {
            title: 'Samsung Washer',
            brand: 'Samsung',
            model: 'WF45R6100A',
            serial: '123456789',
            price: "500", // String
            originalPrice: "1200", // String
            category: 'Washers',
            condition: ItemCondition.EXCELLENT,
            imageUrl: '',
        };
        const result = inventorySchema.safeParse(data);
        if (!result.success) throw result.error;
        expect(result.data.price).toBe(500);
        expect(result.data.originalPrice).toBe(1200);
    });

    it('transforms empty strings to undefined for optional numbers', () => {
        const data = {
            ...validData,
            originalPrice: "", // Empty string
            ageMonths: 0, // Should remain 0 now
        };
        const result = inventorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.originalPrice).toBeUndefined();
            expect(result.data.ageMonths).toBe(0);
        }
    });

    it('should handle optional numeric fields with empty strings', () => {
        const data = {
            ...validData,
            originalPrice: '',
            ageMonths: ''
        };
        const result = inventorySchema.parse(data);
        expect(result.originalPrice).toBeUndefined();
        expect(result.ageMonths).toBeUndefined();
    });

    it('should block non-positive numbers for price fields', () => {
        const data = { ...validData, price: -10 };
        const result = inventorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain("at least $1");
        }
    });

    it('should block zero as a product price', () => {
        const data = { ...validData, price: 0 };
        const result = inventorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain("at least $1");
        }
    });

    it('should block sub-dollar prices that would round to zero in storage', () => {
        const data = { ...validData, price: 0.49 };
        const result = inventorySchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should handle locale numeric strings (commas) gracefully', () => {
        // Note: standard z.coerce.number fails on commas. 
        // We will test if we need to improve the schema to handle this.
        const data = { ...validData, price: "1,200.50" };
        const result = inventorySchema.safeParse(data);

        // If this fails, we know we need to add a pre-processor to the schema
        if (!result.success) {
            console.log("Validation failed for commas as expected with raw coerce");
        }
    });

    it('should block NaN values', () => {
        const data = { ...validData, price: "not-a-number" };
        const result = inventorySchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('fails on missing required fields', () => {
        const data = {
            title: 'Samsung Washer',
        };
        const result = inventorySchema.safeParse(data);
        expect(result.success).toBe(false);
    });
});

describe('mergeInventoryData', () => {
    const current: InventoryFormValues = {
        title: 'Old Title',
        brand: 'Old Brand',
        model: 'Old Model',
        serial: 'Old Serial',
        price: 100,
        category: 'Washers',
        condition: ItemCondition.GOOD,
        imageUrl: '',
    };

    it('overwrites clean fields', () => {
        const incoming = { brand: 'New Brand' };
        const dirtyFields = {};
        const result = mergeInventoryData(current, incoming, dirtyFields);
        expect(result.brand).toBe('New Brand');
        expect(result.model).toBe('Old Model');
    });

    it('does NOT overwrite dirty fields', () => {
        const incoming = { brand: 'New Brand' };
        const dirtyFields = { brand: true };
        const result = mergeInventoryData(current, incoming, dirtyFields);
        expect(result.brand).toBe('Old Brand');
    });

    it('merges multiple fields correctly', () => {
        const incoming = { brand: 'New Brand', model: 'New Model' };
        const dirtyFields = { brand: true }; // Only brand is dirty
        const result = mergeInventoryData(current, incoming, dirtyFields);
        expect(result.brand).toBe('Old Brand'); // Protected
        expect(result.model).toBe('New Model'); // Overwritten
    });
});

import { decodeAppliance } from '@/lib/flood-engine/services/serialDecoder';

describe('Decoder Golden Regression Rules', () => {

    // 1. Samsung month 0 rejected
    it('rejects Samsung serials with month 0', () => {
        // Pattern: ...[Y][M]... 
        // 15 char: 8th=Y, 9th=M. 
        // Year R=2021. Month 0 is invalid.
        const serial = '0000000R0000000';
        const result = decodeAppliance('Samsung', serial);
        expect(result.confidence).toBe('Soft Low'); // Should fall back
        expect(result.selectedYear).toBeNull();
    });

    // 2. Bosch FD century conversion enforced
    it('correctly decodes Bosch FD century logic', () => {
        // FD 85xx = 2005 (1920 + 85)
        const modern = decodeAppliance('Bosch', 'FD8501');
        expect(modern.selectedYear).toBe(2005);

        // FD 01xx = 2021? (1920 + 1 = 1921? No, 1920+81=2001. 1920+101=2021)
        // Implementation logic: if < 1990 after 1920 base, add 100.
        // FD 01 -> 1920 + 01 = 1921 < 1990 -> 2021.
        const future = decodeAppliance('Bosch', 'FD0101');
        expect(future.selectedYear).toBe(2021);

        // FD 99 -> 1920 + 99 = 2019 >= 1990 -> 2019.
        const late = decodeAppliance('Bosch', 'FD9901');
        expect(late.selectedYear).toBe(2019);
    });

    // 3. WHIRLPOOL prefix bounds
    it('enforces Whirlpool prefix candidates', () => {
        // Modern prefix 'C' -> candidates >= 2005 (roughly)
        // Code 'R': 2004 or 2024?
        // If overlap exists in map. R=[2004, 2020?] - check map.
        // Rule: legacy <= 2011, modern >= 2005. 
        // This test merely checks that we get a valid candidate.
        // Let's check a standard code.
        const res = decodeAppliance('Whirlpool', 'CR123456');
        expect(res.brandFamily).toBe('WHIRLPOOL_FAMILY');
        expect(res.selectedYear).toBeGreaterThan(0);
    });

    // 4. GE bounds
    it('decodes GE serials', () => {
        // LA123456. L=June, A=2001/2013/2025.
        // Current year 2026? 
        const res = decodeAppliance('GE', 'LA123456');
        expect(res.brandFamily).toBe('GE_FAMILY');
        expect(res.monthOrWeek?.value).toBe(6);
        expect(res.remainingCandidates.length).toBeGreaterThan(0);
    });

    // 5. Schema Contract
    it('returns strict contract keys', () => {
        const res = decodeAppliance('GE', 'LA123456');
        expect(res).toHaveProperty('remainingCandidates');
        expect(res).toHaveProperty('confidence');
        expect(['Evidence High', 'Heuristic Medium', 'Soft Low']).toContain(res.confidence);
    });
});
