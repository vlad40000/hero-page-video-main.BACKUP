import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  if (pathname === '/employee' || pathname === '/employee/login') {
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
