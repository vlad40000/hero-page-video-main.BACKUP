'use server';

import {
    analyzeProductImage,
    analyzeListingPhoto,
    lookupApplianceSpecs,
} from './services/geminiService';
import { MarketplaceListing } from '@/lib/inventory-types';
import type { ListingPlacement } from '@/lib/appliance-intelligence/types';
import {
    generateBulkMarketFloodCopy,
    generateMarketFloodDescription,
    MAX_MARKET_FLOOD_BULK_ITEMS,
    MARKET_FLOOD_PLACEMENTS,
    validateMarketFloodListing,
} from './marketFloodWorkflow';

import { z } from 'zod';

const AnalyzeProductImageSchema = z.string().url("Valid Cloud URL required");
const AnalyzeListingPhotoSchema = z.object({
    imageUrl: z.string().url("Valid Cloud URL required"),
    claimedBrand: z.string().optional(),
    claimedModel: z.string().optional()
});
const LookupSpecsSchema = z.object({
    brand: z.string().min(1, "Brand required"),
    model: z.string().min(1, "Model required"),
    serial: z.string().min(1, "Serial required")
});
const GenerateDescriptionSchema = z.object({
    brand: z.string(),
    model: z.string(),
    category: z.string(),
    condition: z.string(),
    specs: z.any().optional()
});
const GeneratePartDescriptionSchema = z.object({
    partNumber: z.string().min(1, "Part number required"),
    partName: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    section: z.string().optional(),
    observedModels: z.array(z.string()).optional(),
    price: z.number().optional(),
    imageUrl: z.string().nullable().optional(),
    description: z.string().optional(),
});
const PlacementSchema = z.enum(MARKET_FLOOD_PLACEMENTS as [ListingPlacement, ...ListingPlacement[]]).default('website');

export async function analyzeProductImageAction(imageUrl: string) {
    try {
        const validUrl = AnalyzeProductImageSchema.parse(imageUrl);
        console.log(`[AI-ACTION] Analyzing product image from URL... (url: ${imageUrl})`);
        const result = await analyzeProductImage(validUrl);
        return result;
    } catch (error) {
        console.error(`[AI-ACTION] Product analysis failure:`, error);
        return {
            title: "Appliance",
            brand: "Unknown",
            model: "Unknown",
            serial: "",
            category: "Refrigerators",
            description: "Analysis failed. Please enter details manually.",
            seoKeywords: [],
        };
    }
}

export async function analyzeListingPhotoAction(
    imageUrl: string,
    claimedBrand?: string,
    claimedModel?: string
) {
    try {
        console.log(`[AI-ACTION] Analyzing listing photo from URL... (url: ${imageUrl})`);

        // Ensure we only process http/https URLs
        if (!imageUrl.startsWith('http')) {
            throw new Error("Invalid image URL for analysis. Must be a cloud URL.");
        }

        const result = await analyzeListingPhoto(imageUrl, claimedBrand, claimedModel);
        console.log(`[AI-ACTION] Analysis success: ${result.condition}`);
        return result;
    } catch (error) {
        console.error(`[AI-ACTION] Analysis failure:`, error);
        return {
            condition: "good",
            conditionReasoning: "AI analysis failed internally. Please set condition manually.",
            isMatch: true,
            matchReasoning: "Could not verify match via AI."
        };
    }
}

export async function lookupApplianceSpecsAction(brand: string, model: string, serial: string) {
    const valid = LookupSpecsSchema.parse({ brand, model, serial });
    return await lookupApplianceSpecs(valid.brand, valid.model, valid.serial);
}


export async function validateMarketFloodListingAction(item: Partial<MarketplaceListing>) {
    try {
        return validateMarketFloodListing({ item, mode: 'submit' });
    } catch (error) {
        console.error('[AI-ACTION] Market Flood validation failure:', error);
        return {
            normalized: { brand: '', model: '', serial: '', category: '', partNumbers: [] },
            warnings: [],
            hardInvalids: [{
                code: 'validation_failed',
                severity: 'error' as const,
                message: 'Market Flood validation failed.',
            }],
            confidence: { score: 0, level: 'low' as const },
            provenance: [],
            canSubmit: false,
            canGenerate: false,
        };
    }
}

export async function generateBulkDescriptionsAction(
    items: MarketplaceListing[],
    placement: ListingPlacement = 'website'
) {
    try {
        if (!Array.isArray(items)) {
            return {
                success: false as const,
                error: 'Bulk generation input must be an array of inventory items.',
                warnings: [],
                provenance: [],
            };
        }

        if (items.length > MAX_MARKET_FLOOD_BULK_ITEMS) {
            return {
                success: false as const,
                error: `Bulk generation is capped at ${MAX_MARKET_FLOOD_BULK_ITEMS} items.`,
                warnings: [],
                provenance: [],
            };
        }

        const validPlacement = PlacementSchema.parse(placement);
        return await generateBulkMarketFloodCopy({ items, placement: validPlacement });
    } catch (error) {
        console.error('[AI-ACTION] Bulk generation failure:', error);
        return {
            success: false as const,
            error: 'Bulk listing generation failed. Please try again.',
            warnings: [],
            provenance: [],
        };
    }
}

export async function generateDescriptionAction(
    brand: string,
    model: string,
    category: string,
    condition: string,
    specs?: any,
    placement: ListingPlacement = 'website'
) {
    try {
        const valid = GenerateDescriptionSchema.parse({ brand, model, category, condition, specs });
        const validPlacement = PlacementSchema.parse(placement);
        return await generateMarketFloodDescription({
            item: {
                id: 'single-item-generation',
                title: valid.specs?.title,
                brand: valid.brand,
                model: valid.model,
                category: valid.category,
                condition: valid.condition as MarketplaceListing['condition'],
                price: valid.specs?.price,
                originalPrice: valid.specs?.originalPrice,
                ageMonths: valid.specs?.ageMonths,
                imageUrl: valid.specs?.imageUrl,
                description: valid.specs?.description,
            },
            placement: validPlacement,
        });
    } catch (error) {
        console.error('[AI-ACTION] Description generation failure:', error);
        return {
            success: false as const,
            error: 'Description generation failed. Please try again.',
            warnings: [],
            provenance: [],
        };
    }
}

export async function generatePartDescriptionAction(
    input: z.infer<typeof GeneratePartDescriptionSchema>,
    placement: ListingPlacement = 'website'
) {
    try {
        const valid = GeneratePartDescriptionSchema.parse(input);
        const validPlacement = PlacementSchema.parse(placement);
        const partName = valid.partName || 'Appliance part';
        const category = valid.category || valid.section || 'appliance parts';
        const modelContext = valid.observedModels?.length
            ? `Fits or has been observed in model searches including ${valid.observedModels.slice(0, 8).join(', ')}.`
            : 'Confirm model fitment before purchase or installation.';

        return await generateMarketFloodDescription({
            item: {
                id: valid.partNumber,
                title: `${valid.partNumber} ${partName}`.trim(),
                brand: valid.brand || 'Road Runner Appliance',
                model: valid.partNumber,
                category,
                condition: 'good' as MarketplaceListing['condition'],
                price: valid.price,
                imageUrl: valid.imageUrl || undefined,
                description: [
                    valid.description,
                    `Part name: ${partName}.`,
                    valid.section ? `Catalog section: ${valid.section}.` : '',
                    modelContext,
                ].filter(Boolean).join(' '),
            },
            placement: validPlacement,
        });
    } catch (error) {
        console.error('[AI-ACTION] Part description generation failure:', error);
        return {
            success: false as const,
            error: 'Part description generation failed. Please try again.',
            warnings: [],
            provenance: [],
        };
    }
}
