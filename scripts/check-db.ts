
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkEmployees() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        return;
    }

    const db = drizzle(neon(process.env.DATABASE_URL), { schema });

    try {
        console.log('Fetching employees...');
        const allEmployees = await db.select().from(schema.employees);
        console.log('All Employees:', JSON.stringify(allEmployees, null, 2));
    } catch (error) {
        console.error('Error fetching employees:', error);
    }
}

checkEmployees();
