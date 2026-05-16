'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — LOGIN BYPASSED (DB login removed; rebuild in progress)
// The employee DB table is unavailable. Login checks are disabled.
// All employee routes are temporarily open for direct access.
// Restore DB-backed auth once the employee table is rebuilt.
// ─────────────────────────────────────────────────────────────────────────────

export async function loginEmployee(_formData: FormData) {
    // DB check removed — always succeeds so the login page can still redirect
    // cleanly if someone ends up there. Delete this action when auth is rebuilt.
    return { success: true };
}

export async function logoutEmployee() {
    const cookieStore = await cookies();
    cookieStore.delete('rr_employee_session');
    cookieStore.delete('employee_session');
    redirect('/inventory');
}
