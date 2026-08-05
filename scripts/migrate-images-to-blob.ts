import { db } from "../lib/db";
import { inventory as inventoryTable } from "../lib/db/schema";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { eq, gt } from "drizzle-orm";
import { normalizeImages } from "../lib/image-safety";

/**
 * MIGRATION SCRIPT: Base64 to Vercel Blob
 * 
 * Extracts large base64 images from the database, uploads them to Blob storage
 * idempotently using sha256 hashes, and updates the DB rows with public URLs.
 * 
 * Environment variables:
 * MIGRATE_BATCH_SIZE=10     (default 10)
 * MIGRATE_START_AFTER_ID=15 (optional)
 * MIGRATE_DRY_RUN=1         (optional)
 * 
 * Run with: npx tsx scripts/migrate-images-to-blob.ts
 */

const MIGRATE_BATCH_SIZE = parseInt(process.env.MIGRATE_BATCH_SIZE || "10", 10);
const MIGRATE_START_AFTER_ID = process.env.MIGRATE_START_AFTER_ID;
const DRY_RUN = process.env.MIGRATE_DRY_RUN === "1";

// Ensure Vercel Blob token is available
if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ ERROR: BLOB_READ_WRITE_TOKEN is not set in environment.");
    process.exit(1);
}

// Convert base64 data URI to Buffer
function parseBase64(dataUri: string): { buffer: Buffer, extension: string, contentType: string } | null {
    const matches = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return null;
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
    else if (contentType.includes("webp")) extension = "webp";
    else if (contentType.includes("gif")) extension = "gif";

    return { buffer, extension, contentType };
}

async function runMigration() {
    console.log("🚀 Starting Image Migration Job...");
    if (DRY_RUN) console.log("⚠️ DRY RUN MODE: No DB or Blob changes will be saved!");
    console.log(`📦 Batch Size: ${MIGRATE_BATCH_SIZE}`);
    if (MIGRATE_START_AFTER_ID) console.log(`⏩ Starting after ID > ${MIGRATE_START_AFTER_ID}`);

    let cursor = MIGRATE_START_AFTER_ID ? parseInt(MIGRATE_START_AFTER_ID, 10) : 0;
    let processedRows = 0;
    let modifiedRows = 0;
    let uploadedBlobs = 0;

    while (true) {
        // Fetch batch
        const items = await db.select()
            .from(inventoryTable)
            .where(gt(inventoryTable.id, cursor))
            .limit(MIGRATE_BATCH_SIZE);

        if (items.length === 0) {
            console.log("\n✅ Migration complete! Reached the end of the table.");
            break;
        }

        console.log(`\n⏳ Processing batch of ${items.length} starting after ID ${cursor}...`);

        for (const item of items) {
            processedRows++;
            // Update cursor on success or skip
            cursor = Math.max(cursor, item.id);

            const images = normalizeImages(item.images);
            let needsUpdate = false;
            const newImages: string[] = [];

            for (let i = 0; i < images.length; i++) {
                const img = images[i];

                if (!img.startsWith("data:")) {
                    newImages.push(img); // keep as is (could already be blob URL or absolute path)
                    continue;
                }

                // Parse base64
                const parsed = parseBase64(img);
                if (!parsed) {
                    console.log(`   [ID: ${item.id}] Index [${i}]: Invalid base64, skipping.`);
                    newImages.push(img);
                    continue;
                }

                // Generate deterministic filename via sha256 to prevent duplicate uploads
                const hash = crypto.createHash("sha256").update(parsed.buffer).digest("hex").substring(0, 16);
                const safeSlug = item.slug || `item-${item.id}`;
                const filename = `inventory/${safeSlug}/${hash}.${parsed.extension}`;

                console.log(`   [ID: ${item.id}] Index [${i}]: Uploading to ${filename} (${(parsed.buffer.byteLength / 1024).toFixed(1)} KB)...`);

                if (!DRY_RUN) {
                    try {
                        const blob = await put(filename, parsed.buffer, {
                            access: 'public',
                            contentType: parsed.contentType,
                            addRandomSuffix: false // We use our own deterministic hash
                        });
                        newImages.push(blob.url);
                        needsUpdate = true;
                        uploadedBlobs++;
                    } catch (e: any) {
                        console.error(`   ❌ [ID: ${item.id}] Failed to upload blob: ${e.message}`);
                        newImages.push(img); // keep original on failure
                    }
                } else {
                    needsUpdate = true;
                    newImages.push(`https://mock.blob.vercel-storage.com/${filename}`); // mock success
                    uploadedBlobs++;
                }
            }

            if (needsUpdate) {
                console.log(`   🔄 Updating DB for ID: ${item.id}`);
                if (!DRY_RUN) {
                    await db.update(inventoryTable)
                        .set({
                            images: newImages,
                            updatedAt: new Date()
                        })
                        .where(eq(inventoryTable.id, item.id));
                }
                modifiedRows++;
            }
        }
    }

    console.log(`\n📊 MIGRATION SUMMARY`);
    console.log(`   Processed Rows: ${processedRows}`);
    console.log(`   Modified Rows: ${modifiedRows}`);
    console.log(`   Uploaded Blobs: ${uploadedBlobs}`);
    if (DRY_RUN) console.log(`   (Nothing was actually saved because DRY_RUN=1)`);
    process.exit(0);
}

runMigration().catch(e => {
    console.error("💥 Fatal Migration Error:", e);
    process.exit(1);
});
