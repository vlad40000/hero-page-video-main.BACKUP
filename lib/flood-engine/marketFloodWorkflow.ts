import { MarketplaceListing, WebsiteParams } from '@/lib/inventory-types';
import {
    ApplianceProvenanceEntry,
    ApplianceWarning,
    ConfidenceSummary,
    ListingPlacement,
    MarketFloodValidationResult,
    PriceReference,
} from '@/lib/appliance-intelligence/types';
import { validateMarketFloodInput } from '@/lib/appliance-intelligence/market-flood';
import { calculateResaleValue } from './services/pricingEngine';
import {
    GeneratedMarketplaceCopy,
    generateApplianceDescription,
    generateBulkDescriptions,
} from './services/geminiService';

export const MAX_MARKET_FLOOD_BULK_ITEMS = 50;
export const MARKET_FLOOD_PLACEMENTS: ListingPlacement[] = ['website', 'facebook', 'ebay', 'amazon'];

export interface MarketFloodCopyResult {
    id?: string;
    placement: ListingPlacement;
    title: string;
    description: string;
    seoKeywords: string[];
    websiteParams?: WebsiteParams;
    channelCopy?: string;
    confidence: ConfidenceSummary;
    warnings: ApplianceWarning[];
    provenance: ApplianceProvenanceEntry[];
}

export type SkippedItem = { id: string; title?: string; reason: string };

export type MarketFloodWorkflowResult<T> =
    | {
        success: true;
        data: T;
        warnings: ApplianceWarning[];
        provenance: ApplianceProvenanceEntry[];
        confidence: ConfidenceSummary;
        skippedItems?: SkippedItem[];
    }
    | {
        success: false;
        error: string;
        warnings: ApplianceWarning[];
        provenance: ApplianceProvenanceEntry[];
        confidence?: ConfidenceSummary;
        skippedItems?: SkippedItem[];
    };

function toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : undefined;
}

function buildPriceReference(item: Partial<MarketplaceListing>): PriceReference | undefined {
    const originalPrice = toNumber(item.originalPrice);
    const ageMonths = toNumber(item.ageMonths);

    if (!originalPrice || ageMonths === undefined || !item.brand) {
        return undefined;
    }

    try {
        const result = calculateResaleValue({
            p0: originalPrice,
            ageMonths,
            brand: item.brand,
            category: item.category,
            condition: item.condition || 'good',
        });

        return {
            suggestedPrice: Math.round(result.finalPrice),
            source: result.audit?.engineVersion || 'flood-engine.pricingEngine',
        };
    } catch (error) {
        console.warn('[MarketFlood] Pricing reference unavailable', error);
        return undefined;
    }
}

function validateListing(
    item: Partial<MarketplaceListing>,
    mode: 'submit' | 'generation',
    imageUploadState?: 'idle' | 'ready' | 'uploading' | 'local-preview'
): MarketFloodValidationResult {
    return validateMarketFloodInput(
        {
            id: item.id,
            title: item.title,
            brand: item.brand,
            model: item.model,
            serial: item.serial,
            category: item.category,
            condition: item.condition,
            price: item.price,
            originalPrice: item.originalPrice,
            ageMonths: item.ageMonths,
            imageUrl: item.imageUrl,
            imageUploadState,
        },
        {
            mode,
            priceReference: buildPriceReference(item),
        }
    );
}

function validationErrorMessage(result: MarketFloodValidationResult): string {
    return result.hardInvalids.map((invalid) => invalid.message).join(' ');
}

function mergeGeneratedCopy(args: {
    item: Partial<MarketplaceListing>;
    generated: GeneratedMarketplaceCopy;
    placement: ListingPlacement;
    validation: MarketFloodValidationResult;
}): MarketFloodCopyResult {
    const fallbackTitle = args.item.title || [args.item.brand, args.item.model, args.item.category]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Appliance Listing';
    const fallbackDescription = args.item.description || '';

    return {
        id: args.item.id,
        placement: args.placement,
        title: args.generated.title || fallbackTitle,
        description: args.generated.description || fallbackDescription,
        seoKeywords: args.generated.seoKeywords || [],
        websiteParams: args.generated.websiteParams,
        channelCopy: args.generated.channelCopy,
        confidence: args.validation.confidence,
        warnings: [...args.validation.warnings],
        provenance: [...args.validation.provenance],
    };
}

export function validateMarketFloodListing(args: {
    item: Partial<MarketplaceListing>;
    mode?: 'submit' | 'generation';
    imageUploadState?: 'idle' | 'ready' | 'uploading' | 'local-preview';
}): MarketFloodValidationResult {
    return validateListing(args.item, args.mode || 'submit', args.imageUploadState);
}

export async function generateMarketFloodDescription(args: {
    item: Partial<MarketplaceListing>;
    placement?: ListingPlacement;
}): Promise<MarketFloodWorkflowResult<MarketFloodCopyResult>> {
    const placement = args.placement || 'website';
    const validation = validateListing(args.item, 'generation');

    if (!validation.canGenerate) {
        return {
            success: false,
            error: validationErrorMessage(validation) || 'Market Flood input is not ready for generation.',
            warnings: [...validation.warnings, ...validation.hardInvalids],
            provenance: validation.provenance,
            confidence: validation.confidence,
        };
    }

    try {
        const generated = await generateApplianceDescription(
            validation.normalized.brand || args.item.brand || '',
            validation.normalized.model || args.item.model || '',
            validation.normalized.category || args.item.category || '',
            args.item.condition || 'good',
            {
                originalPrice: args.item.originalPrice,
                ageMonths: args.item.ageMonths,
                price: args.item.price,
                title: args.item.title,
            },
            placement
        );

        const data = mergeGeneratedCopy({
            item: args.item,
            generated,
            placement,
            validation,
        });

        return {
            success: true,
            data,
            warnings: validation.warnings,
            provenance: validation.provenance,
            confidence: validation.confidence,
        };
    } catch (error) {
        console.error('[MarketFlood] Description generation failed', error);
        return {
            success: false,
            error: 'Description generation failed. Please try again.',
            warnings: validation.warnings,
            provenance: validation.provenance,
            confidence: validation.confidence,
        };
    }
}

export async function generateBulkMarketFloodCopy(args: {
    items: MarketplaceListing[];
    placement?: ListingPlacement;
}): Promise<MarketFloodWorkflowResult<{ items: MarketFloodCopyResult[] }>> {
    const placement = args.placement || 'website';

    if (!Array.isArray(args.items) || args.items.length === 0) {
        return {
            success: false,
            error: 'Select at least one inventory item before generating copy.',
            warnings: [],
            provenance: [],
        };
    }

    if (args.items.length > MAX_MARKET_FLOOD_BULK_ITEMS) {
        return {
            success: false,
            error: `Bulk generation is capped at ${MAX_MARKET_FLOOD_BULK_ITEMS} items.`,
            warnings: [],
            provenance: [],
        };
    }

    const validations = new Map<string, MarketFloodValidationResult>();
    const invalidItems: string[] = [];
    const allWarnings: ApplianceWarning[] = [];
    const allProvenance: ApplianceProvenanceEntry[] = [];

    for (const item of args.items) {
        const validation = validateListing(item, 'generation');
        validations.set(item.id, validation);
        allWarnings.push(...validation.warnings);
        allProvenance.push(...validation.provenance);

        if (!validation.canGenerate) {
            invalidItems.push(`${item.title || item.id}: ${validationErrorMessage(validation)}`);
        }
    }

    const validItems = args.items.filter((item) => validations.get(item.id)?.canGenerate);
    const skippedItems: SkippedItem[] = args.items
        .filter((item) => !validations.get(item.id)?.canGenerate)
        .map((item) => ({ id: item.id, title: item.title, reason: validationErrorMessage(validations.get(item.id)!) }));

    if (validItems.length === 0) {
        return {
            success: false,
            error: `No items could be generated. ${skippedItems.length} item(s) have data issues: ${skippedItems.map((s) => s.reason).join(' ')}`,
            warnings: allWarnings,
            provenance: allProvenance,
            confidence: { score: 0, level: 'low' },
            skippedItems,
        };
    }

    try {
        const generated = await generateBulkDescriptions(validItems, placement);
        const generatedById = new Map(generated.map((copy) => [copy.id, copy]));
        const copies = validItems.map((item) => {
            const validation = validations.get(item.id) || validateListing(item, 'generation');
            return mergeGeneratedCopy({
                item,
                generated: generatedById.get(item.id) || {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    seoKeywords: item.seoKeywords || [],
                    websiteParams: item.websiteParams,
                    placement,
                },
                placement,
                validation,
            });
        });

        const averageScore = copies.length
            ? Math.round(copies.reduce((sum, copy) => sum + copy.confidence.score, 0) / copies.length)
            : 0;
        const confidence: ConfidenceSummary = {
            score: averageScore,
            level: averageScore >= 85 ? 'high' : averageScore >= 65 ? 'medium' : 'low',
        };

        const skippedWarnings: ApplianceWarning[] = skippedItems.map((s) => ({
            code: 'item_skipped',
            severity: 'warning',
            message: `Skipped: ${s.title || s.id} - ${s.reason}`,
        }));

        return {
            success: true,
            data: { items: copies },
            warnings: [...allWarnings, ...skippedWarnings],
            provenance: allProvenance,
            confidence,
            skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
        };
    } catch (error) {
        console.error('[MarketFlood] Bulk generation failed', error);
        return {
            success: false,
            error: 'Bulk listing generation failed. Please try again.',
            warnings: allWarnings,
            provenance: allProvenance,
        };
    }
}
