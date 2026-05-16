import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const key = new TextEncoder().encode(SESSION_SECRET);

export interface SessionData {
    employeeId: string;
    name: string;
    exp: number;
}

export async function createSession(employeeId: string, name: string) {
    const exp = Math.floor(Date.now() / 1000) + (SESSION_DURATION / 1000);

    const token = await new SignJWT({ employeeId, name, exp })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(exp)
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('employee_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION / 1000,
        path: '/'
    });

    return token;
}

export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('employee_session')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, key);
        return payload as unknown as SessionData;
    } catch (error) {
        console.error('Session verification failed:', error);
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('employee_session');
}
