
import 'dotenv/config'; // Load env vars
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { employees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('Usage: npx tsx scripts/create-employee.ts <Name> <EmployeeID>');
    process.exit(1);
}

const [name, employeeId] = args;

async function createEmployee() {
    console.log(`Creating employee: ${name} (${employeeId})`);

    try {
        // Check if exists
        const existing = await db.select().from(employees).where(eq(employees.employeeId, employeeId));

        if (existing.length > 0) {
            console.log('Employee ID already exists. Updating name...');
            await db.update(employees).set({ name }).where(eq(employees.employeeId, employeeId));
        } else {
            await db.insert(employees).values({
                name,
                employeeId,
                lastLogin: null
            });
        }

        console.log('✅ Success!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createEmployee();
