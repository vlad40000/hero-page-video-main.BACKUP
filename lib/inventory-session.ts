import { SignJWT, jwtVerify } from 'jose';

export const INVENTORY_SESSION_COOKIE = 'rr_employee_session';
export const INVENTORY_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const SESSION_ISSUER = 'roadrunner-appliance';
const SESSION_AUDIENCE = 'inventory-admin';

function cleanSecret(value: string | undefined): string {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function getSessionSecret(): Uint8Array | null {
  const rawSecret = cleanSecret(
    process.env.INVENTORY_SESSION_SECRET,
  );

  if (rawSecret.length < 32) return null;
  return new TextEncoder().encode(rawSecret);
}

export function isInventorySessionConfigured(): boolean {
  return getSessionSecret() !== null;
}

export async function createInventorySessionToken(): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      'Inventory session signing is not configured. Set INVENTORY_SESSION_SECRET to at least 32 characters.',
    );
  }

  return new SignJWT({ role: 'inventory-admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('inventory-admin')
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function verifyInventorySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const secret = getSessionSecret();
  if (!secret) return false;

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
      algorithms: ['HS256'],
    });

    return payload.sub === 'inventory-admin' && payload.role === 'inventory-admin';
  } catch {
    return false;
  }
}

export function readCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;

  for (const segment of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = segment.trim().split('=');
    if (rawName === name) return decodeURIComponent(rawValue.join('='));
  }

  return undefined;
}

export async function requestHasInventorySession(request: Request): Promise<boolean> {
  const token = readCookieValue(
    request.headers.get('cookie'),
    INVENTORY_SESSION_COOKIE,
  );

  return verifyInventorySessionToken(token);
}
