
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requestHasInventorySession } from '@/lib/inventory-session';

export async function GET(request: Request) {
    if (!(await requestHasInventorySession(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
