
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const employee = await db.query.employees.findFirst({
            where: eq(employees.employeeId, 'ADMIN01')
        });

        if (employee) {
            return NextResponse.json({ exists: true, user: employee });
        } else {
            return NextResponse.json({ exists: false });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
