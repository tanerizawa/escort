import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication (defense-in-depth — AuthGuard also checks client-side)
const PROTECTED_PREFIXES = ['/user/', '/escort/'];

// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/otp'];

// Public routes that bypass all checks
const PUBLIC_PREFIXES = ['/_next/', '/api/', '/uploads/', '/favicon', '/og-image', '/sitemap', '/robots'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static/API routes
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // Check auth cookie (synced by client when logging in)
  const hasAuthCookie = request.cookies.has('areton_auth');

  // Redirect authenticated users away from auth pages
  if (hasAuthCookie && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/user/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected routes to login
  if (!hasAuthCookie && PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
