import {
    ApplianceProvenanceEntry,
    ApplianceWarning,
    ConfidenceSummary,
    MarketFloodValidationInput,
    MarketFloodValidationOptions,
    MarketFloodValidationResult,
} from './types';
import {
    isKnownMarketFloodCategory,
    normalizeBrand,
    normalizeCategory,
    normalizeModel,
    normalizeSerial,
    parsePartNumbers,
} from './normalization';

function asNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : Number.NaN;
}

function hasText(value: unknown): boolean {
    return String(value ?? '').trim().length > 0;
}

function isLocalOrTransientImageUrl(value: string): boolean {
    return /^(blob:|data:|file:)/i.test(value.trim());
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function isCloudLikeUrl(value: string): boolean {
    if (!isHttpUrl(value)) return false;
    const host = new URL(value).hostname.toLowerCase();
    return host !== 'localhost' && !host.endsWith('.local') && host.includes('.');
}

function confidenceFromScore(score: number): ConfidenceSummary {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    return {
        score: clamped,
        level: clamped >= 85 ? 'high' : clamped >= 65 ? 'medium' : 'low',
    };
}

function addNormalizationProvenance(args: {
    provenance: ApplianceProvenanceEntry[];
    field: string;
    raw: unknown;
    normalized: string;
}) {
    const raw = String(args.raw ?? '').trim();
    if (!raw && !args.normalized) return;
    args.provenance.push({
        source: 'appliance-intelligence.normalization',
        field: args.field,
        value: args.normalized,
        note: raw === args.normalized ? 'Value accepted as provided.' : `Normalized from "${raw}".`,
    });
}

export function scoreMarketFloodReadiness(args: {
    warnings: ApplianceWarning[];
    hardInvalids: ApplianceWarning[];
    hasSerial: boolean;
    hasCloudImage: boolean;
    hasPriceReference: boolean;
}): ConfidenceSummary {
    let score = 100;

    score -= args.hardInvalids.length * 35;
    score -= args.warnings.filter((warning) => warning.code === 'unknown_category').length * 12;
    score -= args.warnings.filter((warning) => warning.code === 'weak_price_confidence').length * 10;
    score -= args.warnings.filter((warning) => warning.code === 'missing_serial').length * 8;
    score -= args.warnings.filter((warning) => warning.code === 'weak_image_url').length * 6;

    if (!args.hasSerial) score -= 4;
    if (!args.hasCloudImage) score -= 4;
    if (!args.hasPriceReference) score -= 4;

    return confidenceFromScore(score);
}

export function validateMarketFloodInput(
    input: MarketFloodValidationInput,
    options: MarketFloodValidationOptions = {}
): MarketFloodValidationResult {
    const mode = options.mode || 'submit';
    const warnings: ApplianceWarning[] = [];
    const hardInvalids: ApplianceWarning[] = [];
    const provenance: ApplianceProvenanceEntry[] = [];

    const brand = normalizeBrand(input.brand);
    const model = normalizeModel(input.model);
    const serial = normalizeSerial(input.serial);
    const category = normalizeCategory(input.category);
    const partNumbers = parsePartNumbers(input.title, input.model);
    const price = asNumber(input.price);
    const originalPrice = asNumber(input.originalPrice);
    const ageMonths = asNumber(input.ageMonths);
    const imageUrl = String(input.imageUrl ?? '').trim();

    addNormalizationProvenance({ provenance, field: 'brand', raw: input.brand, normalized: brand });
    addNormalizationProvenance({ provenance, field: 'model', raw: input.model, normalized: model });
    addNormalizationProvenance({ provenance, field: 'serial', raw: input.serial, normalized: serial });
    addNormalizationProvenance({ provenance, field: 'category', raw: input.category, normalized: category });

    if (mode === 'submit' && !hasText(input.title)) {
        hardInvalids.push({
            code: 'missing_title',
            severity: 'error',
            field: 'title',
            message: 'A listing title is required before saving inventory.',
        });
    }

    if (mode === 'generation' && (!brand || !model)) {
        hardInvalids.push({
            code: 'missing_generation_identity',
            severity: 'error',
            field: !brand ? 'brand' : 'model',
            message: 'Brand and model are required before generating Market Flood copy.',
        });
    }

    if (mode === 'submit' && (price === undefined || !Number.isFinite(price) || price < 1)) {
        hardInvalids.push({
            code: 'invalid_price',
            severity: 'error',
            field: 'price',
            message: 'Listing price must be at least $1.',
        });
    } else if (price !== undefined && (!Number.isFinite(price) || price < 1)) {
        hardInvalids.push({
            code: 'invalid_price',
            severity: 'error',
            field: 'price',
            message: 'Listing price must be at least $1.',
        });
    }

    if (input.imageUploadState === 'uploading' || input.imageUploadState === 'local-preview') {
        hardInvalids.push({
            code: 'invalid_image_upload_state',
            severity: 'error',
            field: 'imageUrl',
            message: 'Wait for the listing image upload to finish before saving.',
        });
    }

    if (imageUrl && isLocalOrTransientImageUrl(imageUrl)) {
        hardInvalids.push({
            code: 'transient_image_url',
            severity: 'error',
            field: 'imageUrl',
            message: 'Listing image must be a persisted cloud URL, not a local preview.',
        });
    }

    if (!category || !isKnownMarketFloodCategory(category)) {
        warnings.push({
            code: 'unknown_category',
            severity: 'warning',
            field: 'category',
            message: 'Category is not one of the known Market Flood appliance categories.',
        });
    }

    if (!serial) {
        warnings.push({
            code: 'missing_serial',
            severity: 'warning',
            field: 'serial',
            message: 'Serial is missing, so age and fitment confidence are weaker.',
        });
    }

    if (!imageUrl || !isCloudLikeUrl(imageUrl)) {
        warnings.push({
            code: 'weak_image_url',
            severity: 'warning',
            field: 'imageUrl',
            message: 'Image URL is missing or is not shaped like a persisted cloud URL.',
        });
    }

    const suggestedPrice = options.priceReference?.suggestedPrice;
    if (!suggestedPrice || !Number.isFinite(suggestedPrice) || !originalPrice || ageMonths === undefined) {
        warnings.push({
            code: 'weak_price_confidence',
            severity: 'warning',
            field: 'price',
            message: 'Price confidence is weak without enough MSRP and age context.',
        });
    } else if (Number.isFinite(price ?? Number.NaN) && price !== undefined) {
        const deviation = Math.abs(price - suggestedPrice) / Math.max(1, suggestedPrice);
        if (deviation > 0.5) {
            warnings.push({
                code: 'price_outside_reference',
                severity: 'warning',
                field: 'price',
                message: 'Listing price is far from the current Market Flood pricing reference.',
            });
        }
    }

    if (options.priceReference?.source) {
        provenance.push({
            source: options.priceReference.source,
            field: 'price',
            value: suggestedPrice ?? null,
            note: 'Pricing reference supplied to Market Flood validation.',
        });
    }

    if (partNumbers.length > 0) {
        provenance.push({
            source: 'appliance-intelligence.part-number-parser',
            field: 'partNumbers',
            value: partNumbers.join(', '),
            note: 'Potential part numbers detected in listing identity fields.',
        });
    }

    const confidence = scoreMarketFloodReadiness({
        warnings,
        hardInvalids,
        hasSerial: Boolean(serial),
        hasCloudImage: Boolean(imageUrl && isCloudLikeUrl(imageUrl)),
        hasPriceReference: Boolean(options.priceReference?.suggestedPrice),
    });

    return {
        normalized: { brand, model, serial, category, partNumbers },
        warnings,
        hardInvalids,
        confidence,
        provenance,
        canSubmit: hardInvalids.length === 0,
        canGenerate: hardInvalids.length === 0,
    };
}
