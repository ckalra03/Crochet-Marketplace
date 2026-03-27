# Branch 37: `feature/fe-seller-orders-payouts` -- Seller Orders, Payouts, Profile & Ratings

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Complete seller-facing pages for orders, payouts, profile management, and ratings. All pages are `'use client'` components using React Query hooks from `use-seller.ts` and reusable components (DataTable, KpiCard, StatusBadge, Breadcrumb).

## New / Updated API Functions (`lib/api/seller.ts`)

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getSellerOrder(id)` | GET | `/seller/orders/:id` | Fetch single order item detail |
| `updateBankDetails(data)` | PUT | `/seller/bank-details` | Update seller bank/payout details |

## New Hooks (`lib/hooks/use-seller.ts`)

| Hook | Purpose |
|------|---------|
| `useSellerProfile()` | Fetch seller profile (query) |
| `useUpdateSellerProfile()` | Mutation to update business info |
| `useUpdateBankDetails()` | Mutation to update bank details |
| `useSellerOrder(id)` | Fetch single order item detail |

## New Pages

| Route | File | Purpose |
|-------|------|---------|
| `/seller/orders` | `app/seller/orders/page.tsx` | Seller order items list with DataTable, tab filtering (All/Active/Completed/Cancelled), Socket.io live updates, loading skeletons, empty state |
| `/seller/orders/[id]` | `app/seller/orders/[id]/page.tsx` | Order item detail with breadcrumb, QC status indicator, buyer requirements, read-only view |
| `/seller/payouts` | `app/seller/payouts/page.tsx` | Payout list with KPI summary cards (Current Cycle Earnings, Commission Rate, Last Payout) and DataTable |
| `/seller/payouts/[id]` | `app/seller/payouts/[id]/page.tsx` | Payout detail with summary card, line items DataTable, payment reference |
| `/seller/profile` | `app/seller/profile/page.tsx` | Tabbed profile editor: Business Info, Bank Details, Portfolio (placeholder) |
| `/seller/ratings` | `app/seller/ratings/page.tsx` | Ratings received by seller with average summary and rating cards |

## Key Design Decisions

- **Read-only order detail**: Sellers cannot change order status -- that is managed by warehouse/admin
- **Socket.io integration**: Orders list listens for `seller:order_allocated` to auto-refresh via query invalidation
- **Tab filtering**: Client-side filtering on the orders list (all data fetched once, filtered by status groups)
- **KPI cards** on payouts page pull from `useSellerDashboard()` for current cycle earnings and commission rate
- **Tabbed profile**: Business info and bank details are separate forms; portfolio tab is a placeholder for future image upload
- **Bank details** use a dedicated API endpoint (`PUT /seller/bank-details`) and mutation hook
- **QC indicator**: Order detail shows a colored dot for QC_IN_PROGRESS, QC_FAILED, or QC_PASSED

## Reusable Components Used

- `DataTable` + `DataTableColumnHeader` -- sortable, filterable, paginated tables
- `KpiCard` -- dashboard metric cards with icons
- `StatusBadge` -- color-coded status labels (order + payout types)
- `Breadcrumb` -- navigation breadcrumbs on detail pages
- `Skeleton` -- loading placeholders
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` -- tabbed navigation

## Key Files

- `apps/web/src/lib/api/seller.ts` (updated)
- `apps/web/src/lib/hooks/use-seller.ts` (updated)
- `apps/web/src/app/seller/orders/page.tsx`
- `apps/web/src/app/seller/orders/[id]/page.tsx`
- `apps/web/src/app/seller/payouts/page.tsx`
- `apps/web/src/app/seller/payouts/[id]/page.tsx`
- `apps/web/src/app/seller/profile/page.tsx`
- `apps/web/src/app/seller/ratings/page.tsx`
- `apps/web/tests/e2e/seller-orders-payouts.spec.ts`
