import { db } from "../lib/db";
import { inventory as inventoryTable } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function debugSlug(slug: string) {
    console.log(`--- DEBUGGING SLUG: ${slug} ---`);
    try {
        const results = await db.select().from(inventoryTable).where(eq(inventoryTable.slug, slug)).limit(1);
        if (results.length === 0) {
            console.log("No record found.");
            return;
        }
        const item = results[0];
        console.log(`ID: ${item.id}`);
        console.log(`Brand: ${item.brand}`);
        console.log(`Model: ${item.model}`);
        console.log(`Images Count: ${Array.isArray(item.images) ? item.images.length : 'Not an array'}`);
        if (Array.isArray(item.images)) {
            item.images.forEach((img, i) => {
                console.log(`  Img ${i} length: ${img.length}`);
                console.log(`  Img ${i} starts with: ${img.substring(0, 50)}...`);
            });
        }
        console.log(`Description length: ${item.description?.length}`);
        console.log(`SEO Description length: ${item.seo_description?.length}`);
    } catch (err) {
        console.error("DB Error:", err);
    }
}

const targetSlug = process.argv[2] || "ge-wbvh5200jww-gr207404t";
debugSlug(targetSlug);
