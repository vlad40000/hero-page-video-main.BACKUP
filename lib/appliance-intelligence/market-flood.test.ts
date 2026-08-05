import { describe, expect, it } from 'vitest';
import { normalizeBrand, normalizeCategory, normalizeModel, normalizeSerial } from './normalization';
import { validateMarketFloodInput } from './market-flood';

describe('Market Flood appliance intelligence', () => {
    it('normalizes appliance identity fields', () => {
        expect(normalizeBrand('general electric')).toBe('GE');
        expect(normalizeModel(' gtw 485 asj4ws ')).toBe('GTW485ASJ4WS');
        expect(normalizeSerial(' la 123456 ')).toBe('LA123456');
        expect(normalizeCategory('top load washing machine')).toBe('Washers');
    });

    it('keeps warnings advisory when submit structure is valid', () => {
        const result = validateMarketFloodInput({
            title: 'Top-Load Washer with Stainless Steel Basket',
            brand: 'GE',
            model: 'GTW485ASJ4WS',
            category: 'Washers',
            price: 400,
            imageUrl: '',
        });

        expect(result.canSubmit).toBe(true);
        expect(result.warnings.map((warning) => warning.code)).toContain('missing_serial');
        expect(result.warnings.map((warning) => warning.code)).toContain('weak_image_url');
    });

    it('blocks hard invalid submit states', () => {
        const result = validateMarketFloodInput({
            title: '',
            brand: 'GE',
            model: 'GTW485ASJ4WS',
            category: 'Washers',
            price: -1,
            imageUrl: 'blob:http://localhost/image',
        });

        expect(result.canSubmit).toBe(false);
        expect(result.hardInvalids.map((invalid) => invalid.code)).toEqual(
            expect.arrayContaining(['missing_title', 'invalid_price', 'transient_image_url'])
        );
    });

    it('blocks zero as a listing price', () => {
        const result = validateMarketFloodInput({
            title: 'Top-Load Washer with Stainless Steel Basket',
            brand: 'GE',
            model: 'GTW485ASJ4WS',
            category: 'Washers',
            price: 0,
            imageUrl: 'https://example.com/washer.jpg',
        });

        expect(result.canSubmit).toBe(false);
        expect(result.hardInvalids.map((invalid) => invalid.code)).toContain('invalid_price');
    });

    it('blocks sub-dollar listing prices that would store as zero', () => {
        const result = validateMarketFloodInput({
            title: 'Top-Load Washer with Stainless Steel Basket',
            brand: 'GE',
            model: 'GTW485ASJ4WS',
            category: 'Washers',
            price: 0.49,
            imageUrl: 'https://example.com/washer.jpg',
        });

        expect(result.canSubmit).toBe(false);
        expect(result.hardInvalids.map((invalid) => invalid.code)).toContain('invalid_price');
    });

    it('requires brand and model for generation', () => {
        const result = validateMarketFloodInput({
            title: 'Washer',
            category: 'Washers',
            price: 400,
        }, { mode: 'generation' });

        expect(result.canGenerate).toBe(false);
        expect(result.hardInvalids.map((invalid) => invalid.code)).toContain('missing_generation_identity');
    });
});
