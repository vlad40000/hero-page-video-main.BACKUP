import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  INVENTORY_SESSION_COOKIE,
  verifyInventorySessionToken,
} from '@/lib/inventory-session';

const NOINDEX_PREFIXES = [
  '/inventory',
  '/employee',
  '/forms',
  '/leasing',
  '/wholesale',
  '/place-order',
  '/parts/uploads',
];

function isPathOrChild(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function addNoIndexHeader(response: NextResponse, pathname: string): NextResponse {
  if (NOINDEX_PREFIXES.some((prefix) => isPathOrChild(pathname, prefix))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPathOrChild(pathname, '/employee/inventory')) {
    const suffix = pathname.slice('/employee/inventory'.length);
    return addNoIndexHeader(
      NextResponse.redirect(new URL(`/inventory${suffix}${search}`, request.url)),
      pathname,
    );
  }

  if (pathname === '/employee') {
    return addNoIndexHeader(
      NextResponse.redirect(new URL('/employee/login', request.url)),
      pathname,
    );
  }

  const token = request.cookies.get(INVENTORY_SESSION_COOKIE)?.value;
  const hasSession = await verifyInventorySessionToken(token);

  if (isPathOrChild(pathname, '/inventory') && !hasSession) {
    const loginUrl = new URL('/employee/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return addNoIndexHeader(NextResponse.redirect(loginUrl), pathname);
  }

  if (pathname === '/employee/login' && hasSession) {
    return addNoIndexHeader(
      NextResponse.redirect(new URL('/inventory', request.url)),
      pathname,
    );
  }

  return addNoIndexHeader(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    '/inventory',
    '/inventory/:path*',
    '/employee',
    '/employee/:path*',
    '/forms',
    '/forms/:path*',
    '/leasing',
    '/leasing/:path*',
    '/wholesale',
    '/wholesale/:path*',
    '/place-order',
    '/parts/uploads',
    '/parts/uploads/:path*',
  ],
};
