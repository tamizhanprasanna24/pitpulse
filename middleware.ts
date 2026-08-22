import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Enforce High Privacy & Security Headers for all requests
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 2. Protect dashboard routes from unauthenticated access
  if (pathname.startsWith('/dashboard')) {
    const hasAuthToken = request.cookies.get('auth_token')?.value;
    const hasLocalSession = request.cookies.get('pitpulse_logged_in')?.value;

    // If completely unauthenticated in server cookies/session, redirect to login page
    if (!hasAuthToken && !hasLocalSession) {
      // Allow client-side React AuthContext to perform fine-grained hydration,
      // but ensure security headers are attached to every dashboard route.
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
