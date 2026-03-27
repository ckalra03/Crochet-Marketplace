# Branch 36: `feature/fe-seller-dashboard` -- Enhanced Seller Dashboard & Product Management

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

A complete overhaul of the seller dashboard and product management UI. The previous implementation used raw `useEffect` + `api.get()` calls and inline forms. This branch replaces them with proper React Query hooks, reusable components (KpiCard, DataTable, StatusBadge), a tabbed ProductForm with Zod validation, and full CRUD + approval workflow support.

## Components Created

| Component | File | Purpose |
|-----------|------|---------|
| `PendingActionsWidget` | `components/seller/pending-actions-widget.tsx` | Cards showing draft products count and allocated orders count with navigation links |
| `ProductForm` | `components/seller/product-form.tsx` | Tabbed form (Basic Info, Pricing, Details) with Zod validation, create/edit modes, "Save Draft" and "Submit for Approval" buttons |

## Pages Updated / Created

| Route | File | Changes |
|-------|------|---------|
| `/seller` | `app/seller/page.tsx` | Replaced raw fetch with `useSellerDashboard()`, added KpiCard grid, PendingActionsWidget, commission rate display, StatusBadge in recent orders |
| `/seller/products` | `app/seller/products/page.tsx` | Replaced card list with DataTable (sortable columns: Name, Type badge, Status badge, Price, Stock, Actions), search filtering, Edit/Submit/Delete actions |
| `/seller/products/new` | `app/seller/products/new/page.tsx` | Uses ProductForm in create mode with breadcrumb navigation |
| `/seller/products/[id]/edit` | `app/seller/products/[id]/edit/page.tsx` | **New** -- ProductForm in edit mode, fetches product via `useSellerProduct()`, breadcrumb navigation |

## API & Hook Additions

| Addition | File | Purpose |
|----------|------|---------|
| `getSellerProduct(id)` | `lib/api/seller.ts` | Fetch a single product by ID (seller-scoped) |
| `useSellerProduct(id)` | `lib/hooks/use-seller.ts` | React Query hook for single product fetch |
| `seller.product(id)` | `lib/api/query-keys.ts` | Query key for single product cache |
| Updated `CreateProductData` | `lib/api/seller.ts` | Added fields: name, compareAtPriceInCents, leadTimeDays, returnPolicy, materials, dimensions, careInstructions |
| Updated `UpdateProductData` | `lib/api/seller.ts` | Same new fields as CreateProductData |

## ProductForm Details

The ProductForm uses three tabs:

1. **Basic Info**: Name (text), Description (textarea), Category (select dropdown), Product Type (radio: READY_STOCK, MADE_TO_ORDER, ON_DEMAND)
2. **Pricing**: Price in paise (number), Compare-at price (number), Stock quantity (shown for READY_STOCK only), Lead time days (shown for MADE_TO_ORDER only)
3. **Details**: Return policy (radio: DEFECT_ONLY, NO_RETURN, STANDARD), Materials (text), Dimensions (text), Care instructions (textarea)

Validation uses a Zod schema. On validation error, the form jumps to the tab containing the first error. Supports two submit paths:
- **Save Draft**: Creates/updates the product in DRAFT status
- **Submit for Approval**: Saves, then calls the submit-for-approval endpoint

## Tests

- `apps/web/tests/e2e/seller-dashboard.spec.ts`: Playwright e2e tests covering dashboard API loading, products list, create product flow, and update product flow.

## Key Files

- `apps/web/src/components/seller/pending-actions-widget.tsx`
- `apps/web/src/components/seller/product-form.tsx`
- `apps/web/src/app/seller/page.tsx`
- `apps/web/src/app/seller/products/page.tsx`
- `apps/web/src/app/seller/products/new/page.tsx`
- `apps/web/src/app/seller/products/[id]/edit/page.tsx`
- `apps/web/src/lib/api/seller.ts`
- `apps/web/src/lib/hooks/use-seller.ts`
- `apps/web/src/lib/api/query-keys.ts`
