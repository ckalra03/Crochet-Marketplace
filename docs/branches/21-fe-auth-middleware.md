# Branch 21: `feature/fe-auth-middleware` — Next.js Auth Middleware + Route Protection

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Server-side edge middleware and client-side AuthGuard component for protecting routes based on authentication state and user roles. The auth store was updated to sync the access token to a cookie so the middleware can read it.

## Edge Middleware (`src/middleware.ts`)

Runs on the Next.js edge runtime before page rendering:

| Route Pattern | Requirement | Unauthorized Action |
|---------------|------------|-------------------|
| `/cart`, `/checkout`, `/orders/*`, `/on-demand/*`, `/returns/*`, `/profile/*` | Authenticated user | Redirect to `/login?redirect={path}` |
| `/seller/*` (except `/seller/register`) | SELLER role | Redirect to role's dashboard |
| `/admin/*` | ADMIN role | Redirect to role's dashboard |
| `/login`, `/register` | NOT authenticated | Redirect authenticated users to dashboard |

- Reads `accessToken` from cookies (not localStorage, which is unavailable in edge runtime)
- Decodes JWT payload via simple base64 decode to extract role — no signature verification (API handles that)
- Checks token expiry to avoid acting on stale tokens
- Matcher config limits middleware to relevant paths only (skips static assets, API routes)

## Client-Side AuthGuard (`lib/utils/auth-guard.tsx`)

React component for wrapping protected page content:

```tsx
<AuthGuard role="SELLER" fallback={<Spinner />}>
  <SellerDashboard />
</AuthGuard>
```

- Uses `useAuthStore` Zustand state
- Calls `loadFromStorage()` on mount to hydrate from localStorage
- Redirects to `/login?redirect={path}` if not authenticated
- Redirects to role-appropriate dashboard on role mismatch
- Shows configurable fallback UI during loading/redirect

## Auth Store Cookie Sync

Updated `lib/stores/auth-store.ts`:

- `setAuth()` now sets `accessToken` cookie (max-age 900s = 15 min, matching JWT expiry)
- `logout()` clears the cookie (max-age 0)
- `loadFromStorage()` re-syncs cookie on hydration (page reload)

## Architecture Decisions

- **Two layers of protection:** Edge middleware handles initial page loads and server-side redirects; AuthGuard handles client-side navigation and hydration race conditions
- **No JWT verification in middleware:** The middleware only decodes the payload for role checking. The API validates signatures on every request, so the middleware is just a UX optimization (fast redirects) not a security boundary
- **Cookie + localStorage dual storage:** localStorage is the source of truth for the client; the cookie is a read-only mirror for the edge middleware
- **SameSite=Lax cookie:** Prevents CSRF while allowing normal navigation

## How to Verify

```bash
# TypeScript check — should show zero errors
cd apps/web && npx tsc --noEmit

# Check the files exist
ls src/middleware.ts
ls src/lib/utils/auth-guard.tsx
ls src/lib/stores/auth-store.ts
```

Manual testing:
1. Visit `/profile` without logging in — should redirect to `/login?redirect=%2Fprofile`
2. Log in as a buyer — should not be able to access `/admin` or `/seller/dashboard`
3. Log in as admin — visiting `/login` should redirect to `/admin`
4. Log out — cookie should be cleared, protected routes redirect to login

## Key Files

- `apps/web/src/middleware.ts` — Edge middleware with route protection
- `apps/web/src/lib/utils/auth-guard.tsx` — Client-side AuthGuard component
- `apps/web/src/lib/stores/auth-store.ts` — Updated with cookie sync
