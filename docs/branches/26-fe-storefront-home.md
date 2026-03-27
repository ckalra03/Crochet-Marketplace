# Branch 26: Enhanced Storefront Homepage

## Overview

Refactored the storefront homepage into modular, reusable client components that
fetch data via React Query hooks. Replaced the previous monolithic server component
with a clean server shell that composes five self-contained sections.

## Components Created

### 1. `components/storefront/hero-banner.tsx`
- Full-width hero with warm coral/rose gradient background
- Headline: "Handcrafted with Love, Delivered with Care"
- Two CTAs: "Shop Now" (-> /products) and "Custom Order" (-> /on-demand/new)
- Decorative CSS circles and emoji-based visuals (no external images)
- Responsive: stacked on mobile, side-by-side grid on desktop

### 2. `components/storefront/category-cards.tsx`
- Responsive grid of category cards (2 cols mobile, 3 md, 4 lg)
- Fetches categories from catalog API via `useCategories()` hook
- Each card shows category initial, name, and product count
- Uses `Card` / `CardContent` from `ui/card`
- Links to `/products?categoryId={id}`

### 3. `components/storefront/featured-products.tsx`
- Horizontal scrollable row of up to 8 latest products
- Fetches products via `useProducts({ limit: 8 })`
- Each card: gradient placeholder, name, price (`formatMoney`), type badge, seller name
- Uses `ScrollArea` / `ScrollBar` from `ui/scroll-area` and `Badge` from `ui/badge`
- "View All" link to /products

### 4. `components/storefront/how-it-works.tsx`
- 3-step visual guide: Browse -> Order -> Receive
- Lucide icons: Search, ShoppingCart, Package
- Horizontal on desktop, vertical stack on mobile

### 5. `components/storefront/seller-cta.tsx`
- Call-to-action for artisans to join as sellers
- Benefits list with check icons
- CTA button linking to /seller/register
- Branded primary-600 background with decorative circles

### 6. Updated `app/(storefront)/page.tsx`
- Server component shell composing all five sections
- Removed inline data fetching (now delegated to React Query in each component)

## Design Decisions

- **Client components with React Query**: Each section manages its own loading/error
  states, benefits from client-side caching, and doesn't block page render.
- **No external images**: All visuals use CSS gradients, Tailwind utilities, Lucide
  icons, and emoji. This avoids broken image issues and keeps the bundle lean.
- **formatMoney utility**: Used for consistent INR currency formatting.
- **Existing hooks**: Leverages `useCategories()` and `useProducts()` from
  `lib/hooks/use-catalog.ts` without modification.

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/components/storefront/hero-banner.tsx` | Created |
| `apps/web/src/components/storefront/category-cards.tsx` | Created |
| `apps/web/src/components/storefront/featured-products.tsx` | Created |
| `apps/web/src/components/storefront/how-it-works.tsx` | Created |
| `apps/web/src/components/storefront/seller-cta.tsx` | Created |
| `apps/web/src/app/(storefront)/page.tsx` | Updated |
| `docs/branches/26-fe-storefront-home.md` | Created |
| `CHANGELOG.md` | Updated |
