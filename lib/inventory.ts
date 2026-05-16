import { parseCSV } from "./csv-parser";

export interface InventoryItem {
    id: string;
    slug: string;
    brand: string;
    model: string;
    category: "refrigerators" | "washers" | "dryers" | "stoves-ovens" | "dishwashers" | "packages";
    price: number;
    rental_price?: number;
    ageMonths?: number;
    condition: "Like New" | "Excellent" | "Good" | "Scratch & Dent";
    short_description: string;
    description: string;
    features: string[];
    images: string[]; // First image is main
    status: "available" | "listed" | "sold" | "pending";
    seo_title: string;
    seo_description: string;
    location: string;
}

// Placeholder: Replace this with your actual Google Sheet Published CSV Link
const GOOGLE_SHEET_CSV_URL: string = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTn9gMq2HhT_ik9qztyMNo_Nxh7Iwfed_5cARE3KRbceNgqNgJx_HKzfrT4iz8roDyd_CwB8flx6nwK/pub?output=csv";

// Fallback data in case the sheet isn't connected yet or fails
const FALLBACK_INVENTORY: InventoryItem[] = [
    {
        id: "1",
        slug: "whirlpool-french-door-refrigerator-stainless-steel-hemingway-sc",
        brand: "Whirlpool",
        model: "WRX735SDHZ",
        category: "refrigerators",
        price: 850,
        rental_price: 45,
        condition: "Excellent",
        short_description: "36-inch French Door Refrigerator in Fingerprint Resistant Stainless Steel.",
        description: "This professionally refurbished Whirlpool French Door refrigerator features an external water and ice dispenser, adjustable spill-proof shelves, and a spacious bottom freezer. Rigorously tested and cleaned.",
        features: [
            "Fingerprint Resistant Stainless Steel",
            "External Water & Ice Dispenser",
            "Humidity-Controlled Crispers",
            "Energy Star Certified"
        ],
        images: ["/images/products/refrigerator-french-door.jpg"],
        status: "available",
        seo_title: "Used Whirlpool French Door Refrigerator | Hemingway, SC",
        seo_description: "Buy or rent this refurbished Whirlpool French door fridge in Hemingway. Warranty included. Delivery available.",
        location: "Hemingway, SC"
    }
];

function normalizePublishablePrice(value: unknown): number | null {
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? price : null;
}

export function isFrontendVisibleInventoryStatus(status: InventoryItem["status"] | "listed" | string | null | undefined) {
    return status === "available" || status === "listed" || status === "pending" || status === "sold";
}

import { db } from "./db";
import { inventory as inventoryTable } from "./db/schema";
import { eq } from "drizzle-orm";

import { unstable_noStore as noStore } from "next/cache";
import { normalizeImages, enforceBase64Limit, MAX_DECODED_BYTES_SSR } from "./image-safety";

export async function getInventory(): Promise<InventoryItem[]> {
    noStore();
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
        return FALLBACK_INVENTORY;
    }

    try {
        // OPTIMIZATION: Only select columns needed for the listing. 
        // EXCLUDE 'description' and 'images' (which might be massive base64 strings) 
        // to prevent OOM (Out of Memory) crashes.
        const data = await db.select({
            id: inventoryTable.id,
            slug: inventoryTable.slug,
            brand: inventoryTable.brand,
            model: inventoryTable.model,
            category: inventoryTable.category,
            price: inventoryTable.price,
            rental_price: inventoryTable.rental_price,
            condition: inventoryTable.condition,
            short_description: inventoryTable.short_description,
            status: inventoryTable.status,
            seo_title: inventoryTable.seo_title,
            location: inventoryTable.location,
            images: inventoryTable.images,
        }).from(inventoryTable);

        if (data.length === 0) {
            return FALLBACK_INVENTORY;
        }

        const publishableData = data.filter((item) => normalizePublishablePrice(item.price) !== null);

        if (publishableData.length === 0) {
            return FALLBACK_INVENTORY;
        }

        return publishableData.map((item) => ({
            id: String(item.id),
            slug: item.slug,
            brand: item.brand || 'Unknown',
            model: item.model || 'Unknown',
            category: (item.category as any) || 'washers',
            price: normalizePublishablePrice(item.price) as number,
            rental_price: item.rental_price ?? undefined,
            condition: (item.condition as any) || 'Good',
            short_description: item.short_description || '',
            description: '', // Listings don't need full description
            features: [],   // Listings don't need features
            images: normalizeImages(item.images).map(img =>
                enforceBase64Limit(img, MAX_DECODED_BYTES_SSR, "/images/roadrunnerappliance-logo.png")
            ),
            status: (item.status as any) || 'available',
            seo_title: item.seo_title || `${item.brand} ${item.model}`,
            seo_description: '',
            location: item.location || 'Hemingway, SC'
        }));

    } catch (error) {
        console.error("Error fetching inventory from database:", error);
        return FALLBACK_INVENTORY;
    }
}

export async function getInventoryBySlug(slug: string): Promise<InventoryItem | undefined> {
    noStore();
    if (!slug) return undefined;

    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
        return FALLBACK_INVENTORY.find((item) => item.slug === slug);
    }

    try {
        console.log(`[INVENTORY-DIAG] Fetching product by slug: "${slug}"`);
        const results = await db.select().from(inventoryTable).where(eq(inventoryTable.slug, slug)).limit(1);

        if (results.length === 0) {
            console.log(`[INVENTORY-DIAG] No product found in DB for slug: "${slug}"`);
            return FALLBACK_INVENTORY.find((item) => item.slug === slug);
        }

        const item = results[0];
        console.log(`[INVENTORY-DIAG] Found item: id=${item.id}, slug=${item.slug}`);

        const price = normalizePublishablePrice(item.price);
        if (price === null) {
            console.warn(`[INVENTORY-DIAG] Product suppressed because price is missing or non-positive: slug="${slug}"`);
            return undefined;
        }

        const normalizedImages = normalizeImages(item.images);
        console.log(`[INVENTORY-DIAG] Normalized images count: ${normalizedImages.length}`);

        const safeImages = normalizedImages.map(img =>
            enforceBase64Limit(img, MAX_DECODED_BYTES_SSR, "/images/roadrunnerappliance-logo.png")
        );

        const finalItem = {
            id: String(item.id),
            slug: item.slug,
            brand: item.brand || 'Unknown',
            model: item.model || 'Unknown',
            category: (item.category as any) || 'washers',
            price,
            rental_price: item.rental_price ?? undefined,
            ageMonths: item.ageMonths ?? undefined,
            condition: (item.condition as any) || 'Good',
            short_description: item.short_description || '',
            description: item.description || '',
            features: (item.features as string[]) || [],
            images: safeImages,
            status: (item.status as any) || 'available',
            seo_title: item.seo_title || `${item.brand} ${item.model}`,
            seo_description: item.seo_description || '',
            location: item.location || 'Hemingway, SC'
        };
        console.log(`[INVENTORY-DIAG] Returning final item object for slug: "${slug}"`);
        return finalItem;
    } catch (error) {
        console.error(`[INVENTORY-DIAG] CRITICAL ERROR fetching product by slug (${slug}):`, error);
        return FALLBACK_INVENTORY.find((item) => item.slug === slug);
    }
}

export async function getInventoryByCategory(category: InventoryItem['category']): Promise<InventoryItem[]> {
    noStore();
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
        return FALLBACK_INVENTORY.filter((item) => item.category === category && isFrontendVisibleInventoryStatus(item.status));
    }

    try {
        // OPTIMIZATION: Selective column fetch for category lists
        const data = await db.select({
            id: inventoryTable.id,
            slug: inventoryTable.slug,
            brand: inventoryTable.brand,
            model: inventoryTable.model,
            category: inventoryTable.category,
            price: inventoryTable.price,
            rental_price: inventoryTable.rental_price,
            condition: inventoryTable.condition,
            short_description: inventoryTable.short_description,
            status: inventoryTable.status,
            seo_title: inventoryTable.seo_title,
            location: inventoryTable.location,
            images: inventoryTable.images,
        }).from(inventoryTable).where(eq(inventoryTable.category, category));

        if (data.length === 0) {
            return FALLBACK_INVENTORY.filter((item) => item.category === category && isFrontendVisibleInventoryStatus(item.status));
        }

        const publishableData = data.filter((item) => normalizePublishablePrice(item.price) !== null);

        if (publishableData.length === 0) {
            return FALLBACK_INVENTORY.filter((item) => item.category === category && isFrontendVisibleInventoryStatus(item.status));
        }

        return publishableData.map((item) => ({
            id: String(item.id),
            slug: item.slug,
            brand: item.brand || 'Unknown',
            model: item.model || 'Unknown',
            category: (item.category as any) || 'washers',
            price: normalizePublishablePrice(item.price) as number,
            rental_price: item.rental_price ?? undefined,
            condition: (item.condition as any) || 'Good',
            short_description: item.short_description || '',
            description: '',
            features: [],
            images: normalizeImages(item.images).map(img =>
                enforceBase64Limit(img, MAX_DECODED_BYTES_SSR, "/images/roadrunnerappliance-logo.png")
            ),
            status: (item.status as any) || 'available',
            seo_title: item.seo_title || `${item.brand} ${item.model}`,
            seo_description: '',
            location: item.location || 'Hemingway, SC'
        })).filter((item) => isFrontendVisibleInventoryStatus(item.status));
    } catch (error) {
        console.error(`Error fetching products by category (${category}):`, error);
        return FALLBACK_INVENTORY.filter((item) => item.category === category && isFrontendVisibleInventoryStatus(item.status));
    }
}
