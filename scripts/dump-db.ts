
import { db } from '../lib/db';
import { inventory as inventoryTable } from '../lib/db/schema';
import { desc } from 'drizzle-orm';

async function dump() {
    console.log('--- DB DUMP START ---');
    try {
        const data = await db.select().from(inventoryTable).orderBy(desc(inventoryTable.updatedAt)).limit(10);
        console.log(`Found ${data.length} items.`);
        data.forEach(item => {
            console.log(`ID: ${item.id} | Slug: ${item.slug} | Title: ${item.seo_title?.substring(0, 30)}... | Updated: ${item.updatedAt}`);
        });
    } catch (e) {
        console.error('DUMP FAILED:', e);
    }
    console.log('--- DB DUMP END ---');
    process.exit(0);
}

dump();
