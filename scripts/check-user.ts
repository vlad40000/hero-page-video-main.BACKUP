
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkUser() {
    try {
        console.log("Checking for employee ID: ADMIN01");
        const employee = await db.query.employees.findFirst({
            where: eq(employees.employeeId, 'ADMIN01')
        });

        if (employee) {
            console.log("User FOUND:", employee);
        } else {
            console.log("User NOT FOUND in database.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Database Error:", error);
        process.exit(1);
    }
}

checkUser();
