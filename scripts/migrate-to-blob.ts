import { db } from "../lib/db";
import { inventory as inventoryTable } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";

/**
 * ASSET MIGRATION UTILITY (DB to Vercel Blob)
 * 
 * Run with: npx tsx scripts/migrate-to-blob.ts
 * 
 * This script identifies products with base64 encoded images stored directly in the DB, 
 * uploads those images to Vercel Blob, and replaces the base64 string in the DB with 
 * the resulting public URL.
 * 
 * Requires:
 * - DATABASE_URL
 * - BLOB_READ_WRITE_TOKEN
 */
async function migrateImagesToBlob() {
    console.log("Starting Asset Migration from DB to Vercel Blob...");

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error("CRITICAL: BLOB_READ_WRITE_TOKEN is not set in the environment.");
        process.exit(1);
    }

    try {
        const allItems = await db.select().from(inventoryTable);
        console.log(`Found ${allItems.length} total items in DB.`);

        let migratedCount = 0;

        for (const item of allItems) {
            let needsUpdate = false;
            // Strict normalization (as mandated by recent audit fixes)
            const images = Array.isArray(item.images) ? item.images.filter((x): x is string => typeof x === 'string') : [];
            const newImages: string[] = [];

            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (img.startsWith('data:image/')) {
                    console.log(`[INFO] Found base64 image on unit: ${item.brand || 'Unknown'} ${item.model || 'Unknown'} (ID: ${item.id})`);

                    try {
                        const matches = img.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                        if (!matches || matches.length !== 3) {
                            console.warn(`[WARN] Invalid base64 format for ID: ${item.id}, skipping.`);
                            newImages.push(img);
                            continue;
                        }

                        const mimeType = matches[1];
                        const base64Data = matches[2];
                        const buffer = Buffer.from(base64Data, 'base64');

                        const ext = mimeType.split('/')[1] || 'jpeg';
                        const filename = `inventory/migrated/${item.slug || `legacy-item-${item.id}`}-img${i}-${Date.now()}.${ext}`;

                        console.log(`       Uploading ${(buffer.byteLength / 1024).toFixed(2)} KB to Blob as ${filename}...`);

                        const blob = await put(filename, buffer, {
                            access: 'public',
                            contentType: mimeType,
                        });

                        console.log(`       Success: ${blob.url}`);
                        newImages.push(blob.url);
                        needsUpdate = true;
                    } catch (uploadError) {
                        console.error(`[ERROR] Failed to upload image for ID ${item.id}:`, uploadError);
                        newImages.push(img); // keep original in case of partial failure
                    }
                } else {
                    // Already a URL or absolute path, pass it through unchanged
                    newImages.push(img);
                }
            }

            if (needsUpdate) {
                console.log(`[FIXED] Updating DB item ID: ${item.id} with remote URLs...`);
                await db.update(inventoryTable)
                    .set({
                        images: newImages,
                        updatedAt: new Date()
                    })
                    .where(eq(inventoryTable.id, item.id));

                migratedCount++;
                console.log(`[DONE] Unit (ID: ${item.id}) successfully migrated.`);
            }
        }

        console.log("-----------------------------------------");
        console.log(`Asset Migration complete!`);
        console.log(`Items processed: ${allItems.length}`);
        console.log(`Items migrated and rewritten: ${migratedCount}`);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("CRITICAL ERROR during asset migration:", error);
        process.exit(1);
    }
}

migrateImagesToBlob();
