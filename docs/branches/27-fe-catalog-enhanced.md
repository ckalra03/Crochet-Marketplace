# Branch 27: `feature/fe-catalog-enhanced` — Enhanced Product Catalog

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Enhanced the storefront product catalog with URL-based filter state management, responsive filter sidebar with mobile Sheet slide-out, active filter chips, reusable product card and grid components, and a new category landing page.

## Files Created

| File | Purpose |
|------|---------|
| `lib/hooks/use-url-filters.ts` | Custom hook for URL filter state: `useUrlFilters()` returns current filters, `setFilter`, `removeFilter`, `clearFilters` |
| `components/catalog/product-filter-sidebar.tsx` | Responsive filter panel — sticky sidebar on desktop, Sheet slide-out on mobile |
| `components/catalog/active-filter-chips.tsx` | Removable badge chips showing active filters with "Clear all" |
| `components/catalog/product-grid.tsx` | Responsive grid (1/2/3/4 cols), skeleton loading, empty state |
| `components/product/product-card.tsx` | Product card with image, type badge, seller name, price + compare-at strikethrough |
| `app/(storefront)/categories/[slug]/page.tsx` | Category landing page with filtered products, sort, pagination |

## Files Modified

| File | Changes |
|------|---------|
| `app/(storefront)/products/page.tsx` | Converted from SSR to client component using React Query hooks, URL filter system, new components |

## Key Features

### URL Filter State (`useUrlFilters`)
- All filter values stored in URL search params (browser back/forward works)
- `setFilter(key, value)` updates a single param and resets page to 1
- `removeFilter(key)` removes a param
- `clearFilters()` strips all params
- `apiParams` derived value ready to pass to `useProducts()` hook

### Filter Sidebar
- Category filter: checkboxes populated from `useCategories()` hook
- Product type: checkboxes for READY_STOCK, MADE_TO_ORDER, ON_DEMAND
- Price range: min/max inputs in INR (converted to/from cents for URL)
- Sort: select dropdown (newest, price_asc, price_desc, name)
- "Clear All Filters" button when any filters are active
- Responsive: full sidebar on desktop (lg+), Sheet slide-out on mobile

### Product Card
- Image from PRODUCT_IMAGES map, gradient fallback with product type icon
- Product type badge with color coding (green/amber/purple)
- Seller business name
- Price formatted with `formatMoney()`, compare-at strikethrough when applicable
- Entire card links to `/products/{slug}`
- Hover: shadow lift + image scale

### Product Grid
- Responsive: 1 col mobile, 2 sm, 3 lg, 4 xl
- Loading: skeleton grid with pulse animation
- Empty: icon + message empty state

### Category Page
- Route: `/categories/[slug]`
- Breadcrumb: Home > Products > Category Name
- Uses `useCategoryProducts()` hook
- Sort dropdown and pagination
- Reuses ProductGrid component

## Test Coverage

- `apps/web/tests/e2e/catalog-enhanced.spec.ts` — Playwright API tests for filtered products, paginated products, and category products endpoint
