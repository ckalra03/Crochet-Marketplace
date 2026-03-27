# Branch 42: `feature/fe-admin-on-demand` -- Admin On-Demand + Quote Management

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Admin-facing on-demand request management and quote creation pages with supporting components. All pages use `'use client'` components, React Query hooks from `use-admin.ts`, and reusable components (DataTable, StatusBadge, Card).

## New Components

| Component | File | Purpose |
|-----------|------|---------|
| `QuoteForm` | `components/admin/quote-form.tsx` | Quote creation form with price (INR, auto-converts to cents), estimated days, validity period (default 72h or custom), description/notes. Uses `useCreateQuote()` with toast feedback. |
| `SellerAssignmentSelect` | `components/admin/seller-assignment-select.tsx` | Searchable dropdown of approved sellers fetched via `useAdminSellers({ status: 'APPROVED' })`. Shows business name + star rating. Returns `sellerProfileId`. |

## Updated Components

| Component | File | Change |
|-----------|------|--------|
| `StatusBadge` | `components/feedback/status-badge.tsx` | Added `onDemand` color map (SUBMITTED, UNDER_REVIEW, QUOTED, ACCEPTED, IN_PRODUCTION, COMPLETED, CANCELLED, EXPIRED) and `'onDemand'` to `StatusType` union. |

## New / Updated Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin/on-demand` | `app/admin/on-demand/page.tsx` | **New**: DataTable with columns (Request #, Buyer, Category, Budget Range, Status, Date, Actions), status filter tabs (All, Submitted, Under Review, Quoted, Accepted), search by request number, click-through to detail. |
| `/admin/on-demand/[id]` | `app/admin/on-demand/[id]/page.tsx` | **New**: Full request detail -- request info (description, category, budget, expected date), buyer info, reference images gallery, existing quotes list, QuoteForm for creating new quotes, SellerAssignmentSelect for assigning sellers. Quote/assignment forms hidden for terminal statuses. |

## API Layer Changes

| File | Change |
|------|--------|
| `lib/api/admin.ts` | Added `getOnDemandRequest(id)` for fetching single request detail; added `assignSellerToRequest(requestId, data)` for seller assignment. |
| `lib/hooks/use-admin.ts` | Added `useAdminOnDemandRequest(id)` query hook; added `useAssignSeller()` mutation hook. |

## Tests

| File | What It Tests |
|------|---------------|
| `tests/e2e/admin-on-demand.spec.ts` | Lists on-demand requests (all + filtered by status), creates a quote via API. |

## Key Patterns

- **INR-to-cents conversion**: QuoteForm accepts price in rupees, converts to integer cents via `Math.round(price * 100)` before sending to API.
- **Terminal status gating**: Quote form and seller assignment are hidden when request status is COMPLETED, CANCELLED, or EXPIRED.
- **Consistent DataTable pattern**: Same structure as admin orders/products/warehouse pages -- status tabs, search column, sortable headers, action buttons.
- **Toast notifications**: Uses `sonner` for success/error feedback, consistent with other admin components.
