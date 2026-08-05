'use server';

import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  createInventorySessionToken,
  INVENTORY_SESSION_COOKIE,
  INVENTORY_SESSION_MAX_AGE_SECONDS,
  isInventorySessionConfigured,
} from '@/lib/inventory-session';

function cleanSecret(value: string | undefined): string {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function secretsMatch(candidate: string, expected: string): boolean {
  const candidateDigest = createHash('sha256').update(candidate).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

function safeInventoryDestination(value: FormDataEntryValue | null): string {
  const destination = typeof value === 'string' ? value : '/inventory';
  return destination === '/inventory' || destination.startsWith('/inventory/')
    ? destination
    : '/inventory';
}

export async function loginEmployee(formData: FormData) {
  const expectedPassword = cleanSecret(process.env.INVENTORY_ADMIN_PASSWORD);
  const submittedPassword = String(formData.get('password') ?? '');
  const destination = safeInventoryDestination(formData.get('next'));

  if (expectedPassword.length < 12 || !isInventorySessionConfigured()) {
    redirect(`/employee/login?error=configuration&next=${encodeURIComponent(destination)}`);
  }

  if (!secretsMatch(submittedPassword, expectedPassword)) {
    redirect(`/employee/login?error=invalid&next=${encodeURIComponent(destination)}`);
  }

  const token = await createInventorySessionToken();
  const cookieStore = await cookies();
  cookieStore.set(INVENTORY_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: INVENTORY_SESSION_MAX_AGE_SECONDS,
  });

  redirect(destination);
}

export async function logoutEmployee() {
  const cookieStore = await cookies();
  cookieStore.delete(INVENTORY_SESSION_COOKIE);
  cookieStore.delete('employee_session');
  redirect('/employee/login');
}
