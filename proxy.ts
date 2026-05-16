import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/employee/inventory')) {
        const suffix = pathname.slice('/employee/inventory'.length);
        return NextResponse.redirect(new URL(`/inventory${suffix}`, request.url));
    }

    if (pathname.startsWith('/employee')) {
        return NextResponse.redirect(new URL('/inventory', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/employee', '/employee/:path*'],
};
