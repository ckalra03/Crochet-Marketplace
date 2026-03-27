# Branch 50: `feature/wishlist` -- Wishlist Feature (Backend + Frontend)

**Date:** 2026-03-27 | **Commits:** 1

## What Was Built

Full wishlist feature allowing buyers to save products they're interested in. Backend service with CRUD operations plus a paginated listing endpoint, and frontend with React Query hooks, a heart toggle button with optimistic updates, and a dedicated wishlist page.

## Database Changes

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Added `Wishlist` model (id, userId, productId, createdAt) mapped to `wishlists` table with unique constraint on (userId, productId) and index on userId. Added `wishlists Wishlist[]` relation to both `User` and `Product` models. |

## New Backend Files

| File | Purpose |
|------|---------|
| `apps/api/src/modules/wishlist/wishlist.service.ts` | Wishlist service with `getWishlist` (paginated), `addToWishlist` (idempotent), `removeFromWishlist`, `isWishlisted`, `getWishlistProductIds` methods |
| `apps/api/src/routes/wishlist.routes.ts` | Express routes for wishlist CRUD operations |

## API Endpoints Added

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/wishlist` | List wishlist items (paginated, auth required) |
| GET | `/api/v1/wishlist/ids` | Get all wishlisted product IDs for quick lookup |
| POST | `/api/v1/wishlist/:productId` | Add product to wishlist (idempotent, returns 201) |
| DELETE | `/api/v1/wishlist/:productId` | Remove product from wishlist (returns 204) |

All routes require buyer authentication.

## Backend Changes

| File | Change |
|------|--------|
| `apps/api/src/routes/index.ts` | Registered `/wishlist` route with `authenticate` middleware |
| `apps/api/src/modules/catalog/catalog.service.ts` | Updated `getProductBySlug` to accept optional `userId` and return `isWishlisted` boolean flag |
| `apps/api/src/routes/catalog.routes.ts` | Added `optionalAuth` middleware to product detail route so authenticated users get wishlist status |

## New Frontend Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/api/wishlist.ts` | API functions: `getWishlist`, `getWishlistIds`, `addToWishlist`, `removeFromWishlist` |
| `apps/web/src/lib/hooks/use-wishlist.ts` | React Query hooks: `useWishlist`, `useWishlistIds` (returns Set), `useAddToWishlist`, `useRemoveFromWishlist` |
| `apps/web/src/components/product/wishlist-button.tsx` | Heart icon toggle with optimistic updates, auth check, and toast feedback |
| `apps/web/src/app/(buyer)/wishlist/page.tsx` | Wishlist page with ProductCard grid, empty state, loading skeletons |

## Frontend Changes

| File | Change |
|------|--------|
| `apps/web/src/lib/api/query-keys.ts` | Added `wishlist` query key factory (all, list, ids) |

## Tests

| File | Coverage |
|------|----------|
| `apps/web/tests/e2e/wishlist.spec.ts` | Tests: 401 without auth, add returns 201, duplicate add is idempotent, list returns items, ids endpoint, remove returns 204 |

## Key Design Decisions

- **Idempotent add**: Adding a product that's already wishlisted returns the existing record instead of throwing an error
- **Optimistic UI**: The heart button toggles immediately and rolls back on error for a snappy UX
- **Quick lookup via IDs endpoint**: The `/wishlist/ids` endpoint returns just product IDs so the frontend can build a Set for O(1) lookups across product grids
- **Optional auth on product detail**: The catalog product detail route now uses `optionalAuth` so authenticated users see the `isWishlisted` flag without breaking unauthenticated access
