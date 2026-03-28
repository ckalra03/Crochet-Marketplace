# Branch 58: `feature/guest-cart` — Guest Cart (Browse & Cart Without Login)

**Date:** 2026-03-28

## What Was Built

Allow unauthenticated (guest) users to add products to cart and view their cart without logging in. Login is only required at checkout. Guest cart merges into user cart on login/register.

## How It Works

### Guest Flow
```
Guest browses → Adds to cart (X-Session-ID header) → Views cart freely
  → Clicks "Sign in to Checkout" → Logs in
  → Guest cart merged into user cart (server-side)
  → Redirected to /cart → Proceeds to /checkout
```

### Session ID
- Generated client-side as UUID, stored in `localStorage`
- Sent as `X-Session-ID` header on every API request (when no JWT token is present)
- Cleared from localStorage on login (cart has been merged)

### Cart Merge on Login
- Runs inside `authService.login()` and `authService.register()`
- For duplicate products: sums quantities (capped at stock for READY_STOCK)
- For unique products: moves from session to user (updates row)
- Wrapped in `$transaction` for atomicity

## Files Modified

### Backend
| File | Change |
|------|--------|
| `modules/cart/cart.service.ts` | Refactored all methods to accept `CartIdentifier` (userId or sessionId). Added `mergeGuestCart()` method. |
| `routes/cart.routes.ts` | Added `getCartId(req)` helper. Routes now work with both JWT auth and X-Session-ID. |
| `routes/index.ts` | Changed cart middleware from `authenticate` to `optionalAuth` |
| `modules/auth/auth.service.ts` | Added `sessionId` param to `login()` and `register()`. Calls `mergeGuestCart()` on login. |
| `routes/auth.routes.ts` | Passes `X-Session-ID` header to auth service on login/register |

### Frontend
| File | Change |
|------|--------|
| `lib/api/client.ts` | Request interceptor now sends `X-Session-ID` for guests (when no JWT) |
| `lib/stores/auth-store.ts` | `setAuth()` clears `sessionId` from localStorage after login |
| `middleware.ts` | Removed `/cart` from protected routes (guests can access cart page) |
| `components/product/add-to-cart-section.tsx` | Removed login redirect — guests can add to cart directly |
| `components/cart/cart-summary.tsx` | Shows "Sign in to Checkout" button for guests, "Proceed to Checkout" for authenticated |

## What Stays Protected

- `/checkout` — requires login (needs address + payment identity)
- `/orders`, `/profile`, `/returns`, `/on-demand` — still require login
- `/seller/*`, `/admin/*` — still require respective roles

## How to Verify

1. Open homepage without logging in
2. Click a product → click "Add to Cart" → should succeed
3. Go to `/cart` → should show the item
4. Click "Sign in to Checkout" → redirects to login
5. Login → cart should show merged items
6. Proceed to checkout normally

```bash
# Run guest cart tests
npx playwright test tests/e2e/guest-cart.spec.ts
```

## Key Files
- `apps/api/src/modules/cart/cart.service.ts` — CartIdentifier type + mergeGuestCart
- `apps/api/src/routes/cart.routes.ts` — getCartId helper
- `apps/web/src/lib/api/client.ts` — X-Session-ID interceptor
- `apps/web/src/components/cart/cart-summary.tsx` — conditional checkout CTA
