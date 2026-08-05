import 'server-only';

import { cookies } from 'next/headers';
import {
  INVENTORY_SESSION_COOKIE,
  verifyInventorySessionToken,
} from './inventory-session';

export async function assertInventorySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(INVENTORY_SESSION_COOKIE)?.value;
  const isAuthorized = await verifyInventorySessionToken(token);

  if (!isAuthorized) {
    throw new Error('Unauthorized inventory operation. Sign in again and retry.');
  }
}
