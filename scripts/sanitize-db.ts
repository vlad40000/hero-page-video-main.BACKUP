import { db } from "../lib/db";
import { inventory as inventoryTable } from "../lib/db/schema";
import { eq, not, and, isNotNull } from "drizzle-orm";
import { normalizeImages, enforceBase64Limit, MAX_DECODED_BYTES_SANITIZE } from "../lib/image-safety";

/**
 * DATABASE SANITIZATION UTILITY
 * 
 * Run with: npx tsx scripts/sanitize-db.ts
 * 
 * This script scans the 'inventory' table for rows with massive base64 image data.
 * It replaces these problematic strings with placeholders to prevent 500 errors.
 */

async function sanitizeDatabase() {
    console.log("Starting database sanitization...");

    try {
        const allItems = await db.select().from(inventoryTable);
        console.log(`Found ${allItems.length} total items.`);

        let cleanedCount = 0;

        for (const item of allItems) {
            let needsUpdate = false;
            const images = normalizeImages(item.images);

            const sanitizedImages = images.map(img => {
                const safeImg = enforceBase64Limit(img, MAX_DECODED_BYTES_SANITIZE, "/images/roadrunnerappliance-logo.png");
                if (safeImg !== img) {
                    console.log(`[WARN] Poisoned image detected in unit: ${item.brand} ${item.model} (ID: ${item.id})`);
                    console.log(`       Truncating oversized base64...`);
                    needsUpdate = true;
                }
                return safeImg;
            });

            if (needsUpdate) {
                await db.update(inventoryTable)
                    .set({
                        images: sanitizedImages,
                        updatedAt: new Date()
                    })
                    .where(eq(inventoryTable.id, item.id));

                cleanedCount++;
                console.log(`[FIXED] Unit (ID: ${item.id}) sanitized.`);
            }
        }

        console.log("-----------------------------------------");
        console.log(`Sanitization complete!`);
        console.log(`Items scanned: ${allItems.length}`);
        console.log(`Items cleaned: ${cleanedCount}`);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("CRITICAL ERROR during sanitization:", error);
        process.exit(1);
    }
}

sanitizeDatabase();
