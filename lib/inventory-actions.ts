'use server';

import { db } from './db';
import { inventory as inventoryTable } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { MarketplaceListing, ItemCondition, ItemStatus } from './inventory-types';
import { mapCategoryToDatabase, generateSlug, mapDatabaseToCategory, ensureBrandNotRepeated } from './inventory-utils';
import { normalizeImages, enforceBase64Limit, MAX_DECODED_BYTES_WRITE } from './image-safety';

// ─────────────────────────────────────────────────────────────────────────────
// MAPPING HELPERS & SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strips problematic data (like massive base64 images) that cause 500 errors.
 */
function sanitizeItem(item: MarketplaceListing): MarketplaceListing {
    const sanitized = { ...item };

    // 1. Force strict URL-only storage. No base64, no blob: URIs.
    if (sanitized.imageUrl) {
        if (!sanitized.imageUrl.startsWith('http')) {
            console.error(`[SANITY] REJECTED invalid image protocol: ${sanitized.imageUrl.substring(0, 50)}...`);
            sanitized.imageUrl = '';
        }
    }

    // 2. Truncate long strings to database/header safety
    if (sanitized.description && sanitized.description.length > 20000) {
        sanitized.description = sanitized.description.substring(0, 20000);
    }

    return sanitized;
}

/** UI enum → DB text */
function toDbStatus(status: ItemStatus | string | undefined): 'available' | 'listed' | 'pending' | 'sold' {
    switch (status) {
        case ItemStatus.SOLD:
        case 'sold': return 'sold';
        case ItemStatus.LISTED:
        case 'listed': return 'listed';   // schema now has 'listed' directly
        default: return 'available';
    }
}

/** DB text → UI enum */
function fromDbStatus(dbStatus: string | null | undefined): ItemStatus {
    switch (dbStatus) {
        case 'sold': return ItemStatus.SOLD;
        case 'listed': return ItemStatus.LISTED;
        case 'pending': return ItemStatus.LISTED;
        default: return ItemStatus.AVAILABLE;
    }
}

/** UI enum → DB text  (e.g. 'like-new' → 'Like New') */
function toDbCondition(condition: ItemCondition | string | undefined): string {
    switch (condition) {
        case ItemCondition.NEW:
        case 'new': return 'Like New';
        case ItemCondition.LIKE_NEW:
        case 'like-new': return 'Like New';
        case ItemCondition.EXCELLENT:
        case 'excellent': return 'Excellent';
        case ItemCondition.FAIR:
        case 'fair': return 'Scratch & Dent';
        default: return 'Good';   // ItemCondition.GOOD / 'good'
    }
}

/** DB text → UI enum  (e.g. 'Good' → ItemCondition.GOOD) */
function fromDbCondition(dbCondition: string | null | undefined): ItemCondition {
    switch (dbCondition) {
        case 'Like New': return ItemCondition.LIKE_NEW;
        case 'Excellent': return ItemCondition.EXCELLENT;
        case 'Scratch & Dent': return ItemCondition.FAIR;
        default: return ItemCondition.GOOD;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// REVALIDATION HELPER  (Agent 2)
// ─────────────────────────────────────────────────────────────────────────────

function revalidateInventoryPaths(slug: string, previousSlug?: string) {
    // Category listing pages
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/washers');
    revalidatePath('/dryers');
    revalidatePath('/refrigerators');
    revalidatePath('/stoves-ranges');
    revalidatePath('/washer-dryer-sets');
    revalidatePath('/dishwashers');
    // The specific product page
    revalidatePath(`/products/${slug}`);
    // If slug changed, bust the old URL too
    if (previousSlug && previousSlug !== slug) {
        revalidatePath(`/products/${previousSlug}`);
    }
    console.log(`[SYNC] Revalidated paths for slug: ${slug}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER LOGGER  (Agent 4)
// ─────────────────────────────────────────────────────────────────────────────

export async function logToServer(message: string, data?: any) {
    console.log(`[CLIENT-LOG] ${message}`, data ? JSON.stringify(data) : '');
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE SYNC  (Agent 1 + 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Syncs a single inventory item to the database.
 *
 * RULES:
 *  1. If item.id is numeric → UPDATE by DB id (strongest guarantee, no duplicates).
 *  2. Else if websiteParams.slug is set → UPDATE by slug (stable per item).
 *  3. Else if model + serial → UPDATE by model+serial.
 *  4. None matched → INSERT (only for genuinely new items).
 *
 * CRITICAL: slug is NEVER regenerated for an existing item.
 *   - Only generate a slug when there is no stored slug at all.
 *   - generateSlug() is now fully deterministic (no Math.random).
 */
import { z } from 'zod';

const MarketplaceListingSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    externalId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    brand: z.string().optional(),
    model: z.string().optional(),
    serial: z.string().optional(),
    category: z.string().optional(),
    price: z.number().min(1, "Price must be at least $1"),
    originalPrice: z.number().optional(),
    ageMonths: z.number().optional(),
    condition: z.string().optional(),
    status: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().url("Valid Cloud URL required").nullable().or(z.literal('')),
    seoKeywords: z.array(z.string()).optional(),
    websiteParams: z.object({
        slug: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
    }).optional(),
});

export async function syncInventoryToDatabase(
    inputItem: MarketplaceListing
): Promise<{ success: boolean; error?: string; id?: number; slug?: string; operation?: string }> {
    try {
        // Apply strict sanitization first
        const sanitizedInput = sanitizeItem(inputItem);
        const item = MarketplaceListingSchema.parse(sanitizedInput) as MarketplaceListing;

        // ── 1. Resolve slug ──────────────────────────────────────────────────
        // For existing items the slug is always stored in websiteParams.
        // generateSlug is only called as a LAST RESORT for brand-new items.
        const slug = item.websiteParams?.slug || generateSlug(
            item.brand || 'appliance',
            item.model || item.title,
            item.serial,
        );

        console.log(`[SYNC] id=${item.id} slug=${slug} model=${item.model} serial=${item.serial}`);

        // ── 2. Parse description ──────────────────────────────────────────────
        let description = (item.description || '').toString();
        let title = item.title || '';
        let websiteParams = item.websiteParams;

        if (description.trim().startsWith('{') && description.includes('"description"')) {
            try {
                const parsed = JSON.parse(description);
                if (parsed.description) description = parsed.description;
                if (parsed.title) title = parsed.title;
                if (parsed.websiteParams) websiteParams = parsed.websiteParams;
            } catch { /* not JSON, use as-is */ }
        }

        const cleanText = description
            .split('\n')
            .filter(line => !line.trim().startsWith('#')) // Filter out H1, H2, etc.
            .filter(line => !line.trim().startsWith('-')) // Filter out bullets
            .filter(line => !line.trim().startsWith('*')) // Filter out alternate bullets
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        const shortDescription = cleanText.substring(0, 147) + (cleanText.length > 147 ? '...' : '');

        // ── 3. Build DB row ───────────────────────────────────────────────────
        const cleanModel = ensureBrandNotRepeated(item.brand, item.model || title || 'Unknown');

        // Fix: If item.title is provided and significantly different from metaTitle, prioritize it
        // Or if metaTitle is missing, we use a fallback anyway.
        const seoTitle = item.title || websiteParams?.metaTitle || `Used ${item.brand || 'Appliance'} ${cleanModel} | Roadrunner Appliance`;

        const dbItem = {
            slug,
            brand: item.brand || 'Unknown',
            model: cleanModel,
            category: mapCategoryToDatabase(item.category) as any,
            price: Math.round(item.price),
            rental_price: (item.originalPrice !== undefined && item.originalPrice !== null) ? Math.round(item.originalPrice) : null,
            ageMonths: (item.ageMonths !== undefined && item.ageMonths !== null) ? Math.round(item.ageMonths) : null,
            condition: toDbCondition(item.condition) as any,
            short_description: shortDescription,
            description,
            features: item.seoKeywords || [],
            images: item.imageUrl ? [item.imageUrl] : [],
            status: toDbStatus(item.status) as any,
            seo_title: seoTitle,
            seo_description: websiteParams?.metaDescription || description.substring(0, 160),
            location: 'Hemingway, SC',
            serialNumber: item.serial || null,
            // Preserve existing externalId if present, otherwise let DB generate one
            ...(item.externalId ? { externalId: item.externalId } : {}),
        };

        // ── 4. Resolve existing record (Agent 1 — update-by-key hierarchy) ──
        let existing: any[] = [];
        let lookupMethod = 'none';

        // Priority 0: externalId (stable UUID across devices — strongest key when available)
        if (item.externalId) {
            existing = await db.select().from(inventoryTable).where(eq(inventoryTable.externalId, item.externalId));
            if (existing.length > 0) {
                lookupMethod = 'externalId';
                console.log(`[SYNC] SUCCESS: Found record by externalId=${item.externalId}`);
            } else {
                console.log(`[SYNC] TRACE: No record for externalId=${item.externalId}`);
            }
        }

        // Priority 1: numeric DB id
        if (existing.length === 0 && item.id && /^\d+$/.test(String(item.id).trim())) {
            const numericId = parseInt(String(item.id), 10);
            existing = await db.select().from(inventoryTable).where(eq(inventoryTable.id, numericId));
            if (existing.length > 0) {
                lookupMethod = 'id';
                console.log(`[SYNC] SUCCESS: Found record by numeric id=${numericId}`);
            } else {
                console.log(`[SYNC] TRACE: No record for numeric id=${numericId}`);
            }
        }

        // Priority 2: slug
        if (existing.length === 0 && slug) {
            existing = await db.select().from(inventoryTable).where(eq(inventoryTable.slug, slug));
            if (existing.length > 0) {
                lookupMethod = 'slug';
                console.log(`[SYNC] SUCCESS: Found record by slug="${slug}"`);
            } else {
                console.log(`[SYNC] TRACE: No record for slug="${slug}"`);
            }
        }

        // Priority 3: model + serial
        if (existing.length === 0 && item.model && item.serial) {
            existing = await db.select().from(inventoryTable).where(
                and(eq(inventoryTable.model, item.model), eq(inventoryTable.serialNumber, item.serial))
            );
            if (existing.length > 0) {
                lookupMethod = 'model+serial';
                console.log(`[SYNC] SUCCESS: Found record by model+serial (${item.model} / ${item.serial})`);
            } else {
                console.log(`[SYNC] TRACE: No record for model+serial (${item.model} / ${item.serial})`);
            }
        }

        // ── 5. UPDATE or INSERT ───────────────────────────────────────────────
        let result: any[];
        let operation: string;

        if (existing.length > 0) {
            const existingRecord = existing[0];
            const previousSlug = existingRecord.slug;
            operation = `UPDATE by ${lookupMethod} (db id=${existingRecord.id})`;
            console.log(`[SYNC] ${operation}`);

            result = await db
                .update(inventoryTable)
                .set({ ...dbItem, updatedAt: new Date() })
                .where(eq(inventoryTable.id, existingRecord.id))
                .returning();

            if (!result || result.length === 0) {
                console.error(`[SYNC] ERROR: Update by ${lookupMethod} returned no rows for id=${existingRecord.id}`);
                throw new Error("Update failed: result was empty");
            }

            revalidateInventoryPaths(slug, previousSlug);
        } else {
            operation = 'INSERT';
            console.log(`[SYNC] ${operation} — no existing record found`);

            result = await db
                .insert(inventoryTable)
                .values(dbItem)
                .returning();

            revalidateInventoryPaths(slug);
        }

        console.log(`[SYNC] Done — operation="${operation}" resultId=${result[0]?.id}`);
        return { success: true, id: result[0]?.id, slug, operation };

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[SYNC] Error:', msg);
        return { success: false, error: msg };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK SYNC
// ─────────────────────────────────────────────────────────────────────────────

export async function bulkSyncInventoryToDatabase(items: MarketplaceListing[]): Promise<{
    success: boolean; syncedCount: number; errors: string[]
}> {
    const errors: string[] = [];
    let syncedCount = 0;
    for (const item of items) {
        const result = await syncInventoryToDatabase(item);
        if (result.success) syncedCount++;
        else errors.push(`Failed to sync ${item.title}: ${result.error}`);
    }
    return { success: errors.length === 0, syncedCount, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteInventoryFromDatabase(rawSlug: string): Promise<{ success: boolean; error?: string }> {
    try {
        const slug = z.string().min(1, "Slug is required").parse(rawSlug);
        await db.delete(inventoryTable).where(eq(inventoryTable.slug, slug));
        revalidateInventoryPaths(slug);
        return { success: true };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[DELETE] Error:', msg);
        return { success: false, error: msg };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD FETCH  (Agent 3 — correct condition + status round-trip)
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryForEmployee(): Promise<MarketplaceListing[]> {
    try {
        if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') return [];
        const data = await db.select().from(inventoryTable);

        return data.map((item) => ({
            id: String(item.id),
            externalId: item.externalId || undefined,  // round-trip stable UUID to client
            title: item.seo_title || `${item.brand} ${ensureBrandNotRepeated(item.brand, item.model)}`,
            brand: item.brand,
            model: item.model,
            serial: item.serialNumber || undefined,
            category: mapDatabaseToCategory(item.category),
            price: item.price,
            originalPrice: item.rental_price ?? undefined,
            ageMonths: item.ageMonths ?? undefined,
            condition: fromDbCondition(item.condition),
            status: fromDbStatus(item.status),
            description: item.description || '',
            imageUrl: (() => {
                const normalized = normalizeImages(item.images);
                const firstImg = normalized[0] || '';
                return enforceBase64Limit(firstImg, MAX_DECODED_BYTES_WRITE, "/images/roadrunnerappliance-logo.png");
            })(),
            seoKeywords: (item.features as string[]) || [],
            createdAt: item.createdAt?.getTime() || Date.now(),
            websiteParams: {
                slug: item.slug,
                metaTitle: item.seo_title || '',
                metaDescription: item.seo_description || '',
            },
        }));
    } catch (error) {
        console.error('[FETCH] Error fetching inventory for employee:', error);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL RESET (protected — requires typed confirmation upstream)
// ─────────────────────────────────────────────────────────────────────────────

export async function resetAndSyncFullInventory(items: MarketplaceListing[]): Promise<{
    success: boolean; syncedCount: number; error?: string;
}> {
    try {
        console.log(`[RESET] Starting FULL RESET for ${items.length} items...`);
        await db.delete(inventoryTable);
        let syncedCount = 0;
        for (const item of items) {
            const result = await syncInventoryToDatabase(item);
            if (result.success) syncedCount++;
        }
        return { success: true, syncedCount };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, syncedCount: 0, error: msg };
    }
}
