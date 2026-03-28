# Branch 59: Fix Product Form & Add Product Preview

**Date:** 2026-03-27

## Summary

Fixes six bugs in the seller product create/edit form and adds a new product preview page that shows sellers how their product will appear to buyers.

## Bug Fixes

### 1. Categories not using hook (new + edit pages)
Both the new product page and edit product page were manually fetching categories with raw `fetch()` instead of using the `useCategories()` hook from `@/lib/hooks/use-catalog`. Replaced with the shared hook, which is cached via React Query and consistent with the rest of the codebase.

**Files:** `apps/web/src/app/seller/products/new/page.tsx`, `apps/web/src/app/seller/products/[id]/edit/page.tsx`

### 2. Media not passed to form on edit
The edit page was not passing `media` to the ProductForm's `initialData`, causing the Images tab to show "Save your product first" even when editing an existing product with images.

**Fix:** Added `media: product.media ?? []` to the initialData mapping.

**File:** `apps/web/src/app/seller/products/[id]/edit/page.tsx`

### 3. Missing GET /seller/products/:id route
The seller API had no route to fetch a single product by ID. The frontend API function `getSellerProduct(id)` already existed and called this endpoint, but the backend was missing.

**Fix:** Added `GET /products/:id` route in `seller.routes.ts` and `getSellerProduct()` method in `product.service.ts`.

**Files:** `apps/api/src/routes/seller.routes.ts`, `apps/api/src/modules/products/product.service.ts`

### 4. Price input shows in paise (confusing)
The price input label said "Price (in paise, e.g. 89900 = Rs 899)" which is confusing for sellers.

**Fix:** Changed the form to accept prices in rupees (INR). The form fields are now `priceInRupees` and `compareAtPriceInRupees`. Conversion to paise (multiply by 100) happens in `toApiPayload()` before sending to the API. On edit load, paise values from the API are divided by 100 for display.

**File:** `apps/web/src/components/seller/product-form.tsx`

### 5. Form doesn't default stockQuantity for READY_STOCK
When productType is READY_STOCK, stockQuantity was not defaulting to 0.

**Fix:** In `toApiPayload()`, stockQuantity defaults to 0 when productType is READY_STOCK.

**File:** `apps/web/src/components/seller/product-form.tsx`

### 6. Categories loading race condition on edit page
Categories and product data loaded independently, and the form could render before categories were ready, causing the category dropdown to be empty.

**Fix:** The edit page now shows a loading state until BOTH product and categories are loaded.

**File:** `apps/web/src/app/seller/products/[id]/edit/page.tsx`

## New Feature: Product Preview Page

### Preview page (`/seller/products/[id]/preview`)
A new preview page that shows sellers how their product will look to buyers:
- Image gallery with primary image highlight and thumbnail strip
- Product name, description, price (formatted with formatMoney), and type badge
- Stock availability / lead time info
- Materials, dimensions, care instructions, return policy
- "Back to Edit" button
- "Submit for Approval" button (only for DRAFT/REJECTED products)
- StatusBadge showing current product status

**File:** `apps/web/src/app/seller/products/[id]/preview/page.tsx`

### Preview links added to:
- Product list page: Eye icon button in the Actions column
- Product form: "Preview" button next to Save/Submit (only in edit mode)

**Files:** `apps/web/src/app/seller/products/page.tsx`, `apps/web/src/components/seller/product-form.tsx`

## Files Modified
| File | Change |
|------|--------|
| `apps/web/src/app/seller/products/new/page.tsx` | Replaced raw fetch with useCategories() hook |
| `apps/web/src/app/seller/products/[id]/edit/page.tsx` | useCategories() hook, media pass-through, loading race fix |
| `apps/web/src/components/seller/product-form.tsx` | INR price input, stockQuantity default, Preview button |
| `apps/web/src/app/seller/products/page.tsx` | Added Preview button in actions column |
| `apps/api/src/routes/seller.routes.ts` | Added GET /products/:id route |
| `apps/api/src/modules/products/product.service.ts` | Added getSellerProduct() method |

## Files Created
| File | Purpose |
|------|---------|
| `apps/web/src/app/seller/products/[id]/preview/page.tsx` | Product preview page |
| `docs/branches/59-fix-product-form.md` | Branch documentation |
