import { NextRequest, NextResponse } from 'next/server';

// --- Route pattern definitions ---

// Routes that require any authenticated user
const PROTECTED_PATTERNS = [
  /^\/cart/,
  /^\/checkout/,
  /^\/orders(\/|$)/,
  /^\/on-demand(\/|$)/,
  /^\/returns(\/|$)/,
  /^\/profile(\/|$)/,
];

// Routes that require the SELLER role (except /seller/register which any auth user can access)
const SELLER_PATTERNS = [/^\/seller(?!\/register)(\/|$)/];

// Routes that require the ADMIN role
const ADMIN_PATTERNS = [/^\/admin(\/|$)/];

// Auth pages — redirect authenticated users away from these
const AUTH_PAGES = [/^\/login$/, /^\/register$/];

// --- JWT helpers ---

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

/**
 * Decode a JWT payload without verifying the signature.
 * The API handles real verification — middleware only needs the role claim
 * for route-level gating.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → Base64 → decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Return the dashboard path for a given role.
 */
function getDashboardForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'SELLER':
      return '/seller';
    default:
      return '/';
  }
}

/**
 * Check if the pathname matches any pattern in the list.
 */
function matchesAny(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(pathname));
}

// --- Middleware ---

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the access token from cookies (set by the auth store on login)
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? decodeJwtPayload(token) : null;

  // Check if token is expired (exp is in seconds)
  const isAuthenticated = payload !== null && payload.exp * 1000 > Date.now();
  const role = isAuthenticated ? payload!.role : null;

  // --- Auth pages: redirect logged-in users to their dashboard ---
  if (matchesAny(pathname, AUTH_PAGES)) {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(getDashboardForRole(role!), request.url),
      );
    }
    // Not authenticated — let them visit login/register
    return NextResponse.next();
  }

  // --- Protected routes: require authentication ---
  if (matchesAny(pathname, PROTECTED_PATTERNS)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // --- Seller routes: require SELLER role ---
  if (matchesAny(pathname, SELLER_PATTERNS)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'SELLER') {
      // Wrong role — send them to their own dashboard
      return NextResponse.redirect(
        new URL(getDashboardForRole(role!), request.url),
      );
    }
    return NextResponse.next();
  }

  // --- Admin routes: require ADMIN role ---
  if (matchesAny(pathname, ADMIN_PATTERNS)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(
        new URL(getDashboardForRole(role!), request.url),
      );
    }
    return NextResponse.next();
  }

  // All other routes — no protection needed
  return NextResponse.next();
}

// Only run middleware on relevant paths (skip static assets, API routes, etc.)
export const config = {
  matcher: [
    '/cart/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/on-demand/:path*',
    '/returns/:path*',
    '/profile/:path*',
    '/seller/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
