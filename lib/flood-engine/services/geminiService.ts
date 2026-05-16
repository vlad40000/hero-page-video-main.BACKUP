"use server";

import { SchemaType } from "@google/generative-ai";
import { MarketplaceListing } from "@/lib/inventory-types";
import { CATEGORIES } from "../constants";
import { decodeAppliance } from "./serialDecoder";
import { ensureBrandNotRepeated } from "../../inventory-utils";
import type { ListingPlacement } from "@/lib/appliance-intelligence/types";
import { getGeminiClient, runGeminiForTool } from "@/lib/ai/gemini-policy";

/**
 * GEMINI 3 SERVICE
 * Strictly uses @google/generative-ai and gemini-3-flash-preview.
 */

const getAI = () => {
    return getGeminiClient();
};

// --- CONSTANTS ---
const TEXT_MODEL_ID = "gemini-3-flash-preview";
const VISION_MODEL_ID = "gemini-3-flash-preview";
const LITE_MODEL_ID = "gemini-3.1-flash-lite-preview";

function getModelForPlacement(placement: ListingPlacement): string {
    // Website copy requires SEO reasoning and structured markdown — Flash.
    // Channel copy (Facebook, eBay, Amazon) is shorter, more templated — Flash-Lite.
    return placement === 'website' ? TEXT_MODEL_ID : LITE_MODEL_ID;
}

function getPolicyForPlacement(placement: ListingPlacement): { tool: string; bucket: string } {
    if (placement === 'website') return { tool: 'sales', bucket: 'sales.heavy' };
    if (placement === 'ebay') return { tool: 'ebay', bucket: 'ebay.lite' };
    return { tool: 'market', bucket: 'market.lite' };
}

// Helper to robustly clean and extract JSON from model response
function cleanJsonString(str: string): string {
    if (!str) return "{}";
    // Remove markdown code block delimiters
    let text = str.replace(/```json/g, "").replace(/```/g, "");

    // Robustly find the first '{' and last '}'
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        text = text.substring(startIndex, endIndex + 1);
    }

    return text.trim();
}

function cleanJsonArrayString(str: string): string {
    if (!str) return "[]";
    let text = str.replace(/```json/g, "").replace(/```/g, "");
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        text = text.substring(startIndex, endIndex + 1);
    }

    return text.trim();
}

function parseJsonObject(str: string): any {
    return JSON.parse(cleanJsonString(str));
}

function parseJsonArray(str: string): any[] {
    const cleanedArray = cleanJsonArrayString(str);
    if (cleanedArray.startsWith('[')) {
        const parsed = JSON.parse(cleanedArray);
        return Array.isArray(parsed) ? parsed : [];
    }

    const parsed = parseJsonObject(str);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.items)) return parsed.items;
    return [];
}

export interface GeneratedMarketplaceCopy {
    id?: string;
    placement?: ListingPlacement;
    title: string;
    description: string;
    seoKeywords: string[];
    websiteParams?: {
        slug: string;
        metaTitle: string;
        metaDescription: string;
    };
    channelCopy?: string;
}

function keywordFallback(args: {
    brand?: string;
    model?: string;
    category?: string;
    condition?: string;
}): string[] {
    return [args.brand, args.model, args.category, args.condition, 'used appliance', 'Roadrunner Appliance']
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => value.trim());
}

function normalizeSeoKeywords(value: unknown, fallback: string[]): string[] {
    if (Array.isArray(value)) {
        const keywords = value
            .map((item) => String(item || '').trim())
            .filter(Boolean);
        if (keywords.length > 0) return keywords;
    }
    return fallback;
}

function normalizeWebsiteParams(value: any, fallback: {
    brand?: string;
    model?: string;
    title: string;
    description: string;
}) {
    const slugBase = [fallback.brand, fallback.model, fallback.title]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'used-appliance';

    return {
        slug: sanitizeAIString(value?.slug || slugBase),
        metaTitle: sanitizeAIString(value?.metaTitle || `${fallback.title} | Roadrunner Appliance`),
        metaDescription: sanitizeAIString(value?.metaDescription || fallback.description.slice(0, 160)),
    };
}

function placementInstructions(placement: ListingPlacement): string {
    if (placement === 'facebook') {
        return `
        Placement: Facebook Marketplace.
        Write concise local sales copy with a direct title, plain-language description, pickup/delivery-friendly wording, and no heavy SEO metadata.
        Keep warranty and delivery details clear but brief.
        `;
    }

    if (placement === 'ebay') {
        return `
        Placement: eBay.
        Write marketplace copy with a searchable title, condition notes, model details, item-specific style facts, and compatibility language only when supported by the provided facts.
        Do not invent parts fitment.
        `;
    }

    if (placement === 'amazon') {
        return `
        Placement: Amazon-style catalog copy.
        Write strict product-style copy with factual bullets and restrained claims. Do not imply new condition unless the condition says new.
        `;
    }

    return `
    Placement: Website product detail page.
    Preserve this default structure:

    # About This Product
    [A professional, engaging narrative description of the unit, its benefits, and the Road Runner Appliance story.]

    # Highlights
    - [Bulleted list of 5-8 key features, technologies, or benefits specific to this model.]

    # Product Information
    Model # [Model]

    # Specifications
    [If dimensions are known or can be accurately estimated for this category/model, list them here: H [Height] in, W [Width] in, D [Depth] in]
    `;
}
const EXCLUDE_CONTEXT = [
    "per month", "/mo", "APR", "finance", "install",
    "delivery", "rebate", "save", "off", "discount",
    "promo", "coupon", "bundle", "starting at", "as low as"
];

const MSRP_CUES = [
    "MSRP", "Manufacturer Suggested Retail Price", "List Price", "Original Price"
];

// Helper to sanitize AI strings
function sanitizeAIString(str: string): string {
    if (!str) return "";
    return str.trim();
}

/**
 * Wayback Machine check for historical MSRP verification
 */
async function checkWaybackAvailability(url: string, targetYear: number): Promise<string | null> {
    if (!url || url.includes('localhost') || !targetYear) return null;
    try {
        const apiUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&from=${targetYear}0101&to=${targetYear}1231&output=json&limit=1&filter=statuscode:200`;
        const res = await fetch(apiUrl);
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 1) {
            const row = data[1];
            const timestamp = row[1];
            const original = row[2];
            return `https://web.archive.org/web/${timestamp}/${original}`;
        }
    } catch (e) {
        console.warn("Wayback check failed", e);
    }
    return null;
}

/**
 * 1. Nameplate Analyzer
 * Extract structured data from a photo of a model/serial sticker.
 * Requirements: Model and Serial are REQUIRED. Brand is optional.
 */
export async function analyzeProductImage(imageUrl: string): Promise<any> {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.replace(/^["']|["']$/g, '');
    const responseImg = await fetch(imageUrl, {
        headers: token ? {
            'Authorization': `Bearer ${token}`
        } : {}
    });
    if (!responseImg.ok) throw new Error("Could not fetch image for analysis");
    const arrayBuffer = await responseImg.arrayBuffer();
    const data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = responseImg.headers.get('content-type') || 'image/jpeg';

    const prompt = `
    Analyze this appliance model/serial number sticker.
    Identify the following:
    1. Model Number (REQUIRED)
    2. Serial Number (REQUIRED)
    3. Brand (Optional)
    4. Categorize it as one of: ${CATEGORIES.join(', ')}
    5. A fair marketplace Price (USD) for a used unit when you can estimate a positive price.
    6. A descriptive title and Markdown description.

    Return JSON format only.
    IMPORTANT: 
    - The "model" field MUST be the alphanumeric model number only (e.g. "WFW5620HW"). DO NOT put a generic description in the model field.
    - The "title" field should NOT redundantly repeat the brand name if it's already in the brand field.
    - Never return 0 for price. Omit price if you cannot support a positive estimate.
    `;

    try {
        const result = await runGeminiForTool(
            {
                tool: 'identity',
                bucket: 'identity.heavy',
                model: VISION_MODEL_ID,
                requestContext: { route: 'inventory.nameplate-image', requestId: imageUrl },
            },
            async ({ model }: { model: string }) => {
                const genAI = getAI();
                const generativeModel = genAI.getGenerativeModel({
                    model,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING },
                                brand: { type: SchemaType.STRING },
                                model: { type: SchemaType.STRING },
                                serial: { type: SchemaType.STRING },
                                category: { type: SchemaType.STRING },
                                price: { type: SchemaType.NUMBER },
                                description: { type: SchemaType.STRING },
                                websiteParams: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        slug: { type: SchemaType.STRING },
                                        metaTitle: { type: SchemaType.STRING },
                                        metaDescription: { type: SchemaType.STRING }
                                    },
                                }
                            },
                            required: ["model", "serial", "title", "category", "description"],
                        }
                    }
                });

                return generativeModel.generateContent([
                    { text: prompt },
                    { inlineData: { mimeType, data } }
                ]);
            }
        );

        const response = result.response;
        const parsed = JSON.parse(cleanJsonString(response.text()));
        const price = Number(parsed?.price);
        if (!Number.isFinite(price) || price <= 0) {
            delete parsed.price;
        }
        return parsed;
    } catch (error) {
        console.error("Gemini image analysis failed:", error);
        throw error;
    }
}

/**
 * 2. Listing Photo Analyzer
 * Grade condition and verify match against claimed info.
 */
export async function analyzeListingPhoto(
    imageUrl: string,
    claimedBrand?: string,
    claimedModel?: string
): Promise<{
    condition: string;
    conditionReasoning: string;
    isMatch: boolean;
    matchReasoning: string;
}> {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.replace(/^["']|["']$/g, '');
    const responseImg = await fetch(imageUrl, {
        headers: token ? {
            'Authorization': `Bearer ${token}`
        } : {}
    });

    if (!responseImg.ok) {
        console.error(`[AI-FETCH] Failed to fetch image: ${responseImg.status} ${responseImg.statusText}`);
        throw new Error("Could not fetch image for analysis");
    }
    const arrayBuffer = await responseImg.arrayBuffer();
    const data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = responseImg.headers.get('content-type') || 'image/jpeg';

    const prompt = `
    Analyze this appliance listing photo.
    Claimed Brand / Model: ${claimedBrand || 'Unknown'} ${claimedModel || 'Unknown'}.

    1. Grade condition: "new", "like-new", "excellent", "good", "fair", "poor".
    2. Does it match the claimed brand / model ?

        Return JSON.
    `;

    try {
        const result = await runGeminiForTool(
            {
                tool: 'inventory',
                bucket: 'inventory.lite',
                model: LITE_MODEL_ID,
                requestContext: { route: 'inventory.listing-photo', requestId: imageUrl },
            },
            async ({ model }: { model: string }) => {
                const genAI = getAI();
                const generativeModel = genAI.getGenerativeModel({
                    model,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: SchemaType.OBJECT,
                            properties: {
                                condition: { type: SchemaType.STRING },
                                conditionReasoning: { type: SchemaType.STRING },
                                isMatch: { type: SchemaType.BOOLEAN },
                                matchReasoning: { type: SchemaType.STRING },
                            },
                            required: ["condition", "conditionReasoning", "isMatch", "matchReasoning"]
                        }
                    }
                });

                return generativeModel.generateContent([
                    { text: prompt },
                    { inlineData: { mimeType, data } }
                ]);
            }
        );

        return JSON.parse(cleanJsonString(result.response.text()));
    } catch (error) {
        console.error("Listing photo analysis failed", error);
        return {
            condition: "good",
            conditionReasoning: "AI analysis unavailable.",
            isMatch: true,
            matchReasoning: "Skipped verification."
        };
    }
}

/**
 * 3. Specs & Age Lookup
 * Uses Google Search to find MSRP and verify Age.
 */
export async function lookupApplianceSpecs(brand: string, model: string, serial: string): Promise<any> {
    const decoded = decodeAppliance(brand, serial, model);
    let manufactureDateInfo = "";
    let calculatedAgeMonths = 0;
    let deterministicNote = "";

    if (decoded.selectedYear && decoded.monthOrWeek) {
        const now = new Date();
        const m = decoded.monthOrWeek.unit === 'month' ? decoded.monthOrWeek.value : Math.floor(decoded.monthOrWeek.value / 4.3);
        const date = new Date(decoded.selectedYear, m - 1);
        calculatedAgeMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        manufactureDateInfo = `Deterministic Manufacture Date: ${decoded.selectedYear}-${m.toString().padStart(2, '0')}`;
        deterministicNote = `Age (${calculatedAgeMonths} months) verified via serial pattern.`;
    }

    const prompt = `
    You are an expert appliance auditor. 
    Find the ORIGINAL MSRP and exact Manufacture Date for: ${brand} ${model} (Serial: ${serial}).
    
    Context:
    ${manufactureDateInfo || "Pattern-based decoding failed. Use your knowledge of brand-specific serial patterns to estimate the month/year."}
    
    Rules: 
    - Ignore financing terms (${EXCLUDE_CONTEXT.join(', ')}). 
    - Use cues: ${MSRP_CUES.join(', ')}.
    - If manufacture month/year are found (either via knowledge or deterministic context provided), calculate ageMonths relative to ${new Date().toISOString()}.
    
    Return ONLY JSON: 
    { 
        "msrp": number, 
        "ageMonths": number, 
        "mfrYear": number,
        "mfrMonth": number,
        "notes": string, 
        "mfrProductUrl": string 
    }
    `;

    try {
        const result = await runGeminiForTool(
            {
                tool: 'calculators',
                bucket: 'calculators.lite_grounded',
                model: LITE_MODEL_ID,
                grounded: true,
                requestContext: { route: 'inventory.spec-lookup', requestId: `${brand}:${model}:${serial}` },
            },
            async ({ model }: { model: string }) => {
                const genAI = getAI();
                const modelAi = genAI.getGenerativeModel({
                    model,
                    tools: [{ googleSearch: {} } as any]
                });

                return modelAi.generateContent(prompt);
            }
        );
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { msrp: 0, ageMonths: calculatedAgeMonths, notes: "No data found" };

        const sources = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
            .filter((s: any) => s) || [];

        if (data.mfrProductUrl && decoded.selectedYear) {
            const wayback = await checkWaybackAvailability(data.mfrProductUrl, decoded.selectedYear);
            if (wayback) sources.push({ title: "Wayback Machine Archive", uri: wayback });
        }

        // Final result merge: trust deterministic if available, otherwise AI knowledge
        const finalAgeMonths = calculatedAgeMonths > 0 ? calculatedAgeMonths : (data.ageMonths || 0);

        return {
            msrp: data.msrp || 0,
            ageMonths: finalAgeMonths,
            mfrYear: decoded.selectedYear || data.mfrYear,
            mfrMonth: (decoded.monthOrWeek && decoded.monthOrWeek.unit === 'month' ? decoded.monthOrWeek.value : null) || data.mfrMonth,
            notes: `${deterministicNote} ${data.notes || ''}`.trim(),
            sources,
            decoderResult: decoded
        };
    } catch (error) {
        console.error("Spec lookup failed:", error);
        return { msrp: 0, ageMonths: calculatedAgeMonths, notes: "Lookup failed", sources: [], decoderResult: decoded };
    }
}


/**
 * 4. Description Generator
 * Writes professional sales copy. Exclusively uses Gemini 3.
 */
export async function generateApplianceDescription(
    brand: string,
    model: string,
    category: string,
    condition: string,
    specs?: any,
    placement: ListingPlacement = 'website'
): Promise<GeneratedMarketplaceCopy> {
    const prompt = `
    Generate a high-conversion marketplace listing for:
    ${brand} ${model} (${category}), Condition: ${condition}. 
    Specs: ${JSON.stringify(specs || {})}.
    
    Road Runner Appliance Story: "Serving Hemingway, SC and surrounding regions: Florence, Williamsburg, Horry, Georgetown."
    
    ${placementInstructions(placement)}
    
    CRITICAL RULES:
    1. DO NOT include "Original Value", "MSRP", or "Originally Retailed For" information.
    2. DO NOT include "Age", "Years Old", or "Months Old" information.
    3. The "title" field should NOT repeat the brand name (e.g., if Brand is "Whirlpool", title should be "Washer and Dryer Set", NOT "Whirlpool Washer and Dryer Set").
    4. The "seoKeywords" field is REQUIRED and must be a string array.
    
    Return JSON: { "title": string, "description": string, "seoKeywords": string[], "websiteParams": { "slug": string, "metaTitle": string, "metaDescription": string }, "channelCopy": string }
    `;

    try {
        const policy = getPolicyForPlacement(placement);
        const result = await runGeminiForTool(
            {
                ...policy,
                model: getModelForPlacement(placement),
                requestContext: { route: 'inventory.description', requestId: `${placement}:${brand}:${model}:${category}` },
            },
            async ({ model }: { model: string }) => {
                const genAI = getAI();
                const modelAi = genAI.getGenerativeModel({
                    model,
                    generationConfig: { responseMimeType: "application/json" }
                });

                return modelAi.generateContent(prompt);
            }
        );
        const data = parseJsonObject(result.response.text());
        const fallbackTitle = `${brand} ${ensureBrandNotRepeated(brand, model)}`.trim() || 'Appliance Listing';
        const title = sanitizeAIString(data.title || fallbackTitle);
        const description = sanitizeAIString(data.description || "");
        const fallbackKeywords = keywordFallback({ brand, model, category, condition });

        return {
            placement,
            title,
            description,
            seoKeywords: normalizeSeoKeywords(data.seoKeywords, fallbackKeywords),
            websiteParams: normalizeWebsiteParams(data.websiteParams, {
                brand,
                model,
                title,
                description,
            }),
            channelCopy: sanitizeAIString(data.channelCopy || description),
        };
    } catch (error) {
        console.error("Description generation failed:", error);
        throw new Error("Description generation failed");
    }
}

/**
 * 5. Bulk Description Generator
 */
export async function generateBulkDescriptions(
    items: MarketplaceListing[],
    placement: ListingPlacement = 'website'
): Promise<GeneratedMarketplaceCopy[]> {
    const prompt = `
    Generate listing content for these ${items.length} items. 
    
    ${placementInstructions(placement)}
    
    CRITICAL RULES:
    1. DO NOT include "Original Value", "MSRP", or any pricing history.
    2. DO NOT include "Age" or manufacture dates in the description.
    3. Preserve every input item id exactly in the returned object.
    4. The "seoKeywords" field is REQUIRED for every returned object and must be a string array.
    
    Return JSON array of objects with id, title, description, seoKeywords, websiteParams, channelCopy.
    `;

    try {
        const policy = getPolicyForPlacement(placement);
        const result = await runGeminiForTool(
            {
                ...policy,
                model: getModelForPlacement(placement),
                requestContext: { route: 'inventory.bulk-description', requestId: `${placement}:${items.length}:${items.map((item) => item.id).join(',').slice(0, 80)}` },
            },
            async ({ model }: { model: string }) => {
                const genAI = getAI();
                const modelAi = genAI.getGenerativeModel({
                    model,
                    generationConfig: { responseMimeType: "application/json" }
                });

                return modelAi.generateContent(prompt + "\n" + JSON.stringify(items));
            }
        );
        const data = parseJsonArray(result.response.text());
        const rows = new Map<string, any>(
            data
                .filter((row) => row && typeof row === 'object' && row.id)
                .map((row) => [String(row.id), row])
        );

        return items.map((item) => {
            const row = rows.get(String(item.id)) || {};
            const title = sanitizeAIString(row.title || item.title);
            const description = sanitizeAIString(row.description || item.description || "");
            const fallbackKeywords = keywordFallback({
                brand: item.brand,
                model: item.model,
                category: item.category,
                condition: item.condition,
            });

            return {
                id: item.id,
                placement,
                title,
                description,
                seoKeywords: normalizeSeoKeywords(row.seoKeywords, item.seoKeywords?.length ? item.seoKeywords : fallbackKeywords),
                websiteParams: normalizeWebsiteParams(row.websiteParams || item.websiteParams, {
                    brand: item.brand,
                    model: item.model,
                    title,
                    description,
                }),
                channelCopy: sanitizeAIString(row.channelCopy || description),
            };
        });
    } catch (error) {
        console.error("Bulk generation failed:", error);
        throw new Error("Bulk listing generation failed");
    }
}
