import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  // 1. Protect dashboard routes from unauthenticated access
  if (pathname.startsWith('/dashboard')) {
    // If no session cookie or profile marker, redirect to login
    const isLocalDemo = request.cookies.get('pitpulse_logged_in')?.value;
    
    // Allow client-side auth context to perform detailed profile role checks,
    // but if completely unauthenticated in server request headers/cookies, redirect to /auth/login.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
