# Branch 28: `feature/fe-product-detail` -- Enhanced Product Detail Page

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Fully rebuilt the product detail page from a server-rendered page with hardcoded image constants into a client-side `'use client'` page powered by the `useProduct(slug)` React Query hook. Extracted all visual sections into dedicated, reusable components under `components/product/`.

## New Components (`components/product/`)

| Component | File | Purpose |
|-----------|------|---------|
| `ProductGallery` | `product-gallery.tsx` | Main image + thumbnail strip, CSS hover-zoom, Dialog-based lightbox, gradient placeholder when no media |
| `ProductTypeBadge` | `product-type-badge.tsx` | Color-coded badge: emerald (Ready Stock), amber (Made to Order), violet (On Demand) |
| `SellerAttribution` | `seller-attribution.tsx` | Seller avatar initial, business name link, optional star rating display |
| `LeadTimeIndicator` | `lead-time-indicator.tsx` | Contextual shipping timeline based on product type and lead time days |
| `ReturnPolicyCallout` | `return-policy-callout.tsx` | Alert-based return policy info, adapts message per product type |
| `ReviewList` | `review-list.tsx` | Average rating summary + review cards with star display, date, reviewer name |
| `AddToCartSection` | `add-to-cart-section.tsx` | Quantity selector with +/- buttons, uses `useAddToCart()` hook, toast on success, disabled when out of stock |

## Updated Page (`app/(storefront)/products/[slug]/page.tsx`)

- Converted from server component (`async function` + `fetch`) to client component using `useProduct(slug)` hook
- Added skeleton loading state while data fetches
- Added 404 fallback with friendly message and link back to products
- Added breadcrumb navigation (Home > Products > Category > Product Name)
- Uses `formatMoney()` for price display instead of manual string formatting
- Renders all new components in a responsive two-column layout
- Reviews section always renders (shows "No reviews yet" when empty)

## Key Design Decisions

- **No external images**: Gradient placeholders with lucide-react icons when product has no media
- **CSS zoom**: `group-hover:scale-110` on the main image container for a lightweight zoom effect
- **Lightbox**: Uses the existing `Dialog` component from `ui/dialog` rather than adding a third-party lightbox library
- **Hook-based cart**: `AddToCartSection` uses `useAddToCart()` mutation hook (from `use-cart.ts`) with proper `isPending` state, replacing the manual `api.post` approach in the old `AddToCartButton`

## Key Files

- `apps/web/src/components/product/product-gallery.tsx`
- `apps/web/src/components/product/product-type-badge.tsx`
- `apps/web/src/components/product/seller-attribution.tsx`
- `apps/web/src/components/product/lead-time-indicator.tsx`
- `apps/web/src/components/product/return-policy-callout.tsx`
- `apps/web/src/components/product/review-list.tsx`
- `apps/web/src/components/product/add-to-cart-section.tsx`
- `apps/web/src/app/(storefront)/products/[slug]/page.tsx`
