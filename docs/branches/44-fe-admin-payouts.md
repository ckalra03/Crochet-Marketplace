# Branch 44: `feature/fe-admin-payouts` -- Admin Payout Processing

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Admin-facing payout processing pages with date-range payout cycle generation, payout list management with status filters, bulk approve functionality, and detailed payout view with line items and penalties. All pages use `'use client'` components, React Query hooks from `use-admin.ts`, and reusable components (DataTable, StatusBadge, Dialog).

## New Components

| Component | File | Purpose |
|-----------|------|---------|
| `PayoutCycleSelector` | `components/admin/payout-cycle-selector.tsx` | Date range picker (start/end date inputs) with "Generate Payouts" button. Uses `useGeneratePayout()` mutation. Shows loading spinner during generation, validates date range, toast on success/error. |
| `BulkApproveDialog` | `components/admin/bulk-approve-dialog.tsx` | Dialog to confirm bulk approving selected payouts. Shows count and total amount (formatMoney). Sequential API calls via `useApprovePayout().mutateAsync()`. Reports success/failure counts via toast. |

## Updated Files

| File | Change |
|------|--------|
| `lib/api/admin.ts` | Added `getPayoutDetail(id)` API function |
| `lib/hooks/use-admin.ts` | Added `useAdminPayoutDetail(id)` hook, imported `getPayoutDetail` |
| `lib/api/query-keys.ts` | Added `admin.payoutDetail(id)` query key |
| `components/feedback/status-badge.tsx` | Added `DRAFT` status to payout color map (gray) |

## New / Updated Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin/payouts` | `app/admin/payouts/page.tsx` | **New**: PayoutCycleSelector at top, DataTable with columns (Payout #, Seller, Period, Gross, Commission, Net, Status, Actions), status filter tabs (All/Draft/Approved/Paid), Bulk Approve button for draft payouts, Mark Paid dialog with payment reference input, click-through to detail |
| `/admin/payouts/[id]` | `app/admin/payouts/[id]/page.tsx` | **New**: Payout detail with summary card (seller, period, gross/commission/adjustments/net), status details (approved by, paid date, payment reference), line items DataTable (Order Number, Item Amount, Commission, Adjustments, Net), penalties section, context-sensitive actions (Approve/Mark Paid), breadcrumb navigation |

## Hooks Used (from `use-admin.ts`)

| Hook | Purpose |
|------|---------|
| `useAdminPayouts(params?)` | Fetch paginated payout list |
| `useAdminPayoutDetail(id)` | Fetch single payout with line items |
| `useGeneratePayout()` | Mutation to generate payout cycle |
| `useApprovePayout()` | Mutation to approve a draft payout |
| `useMarkPayoutPaid()` | Mutation to mark payout as paid with reference |

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/payouts` | List payouts with optional status filter |
| GET | `/admin/payouts/:id` | Get single payout detail with line items |
| POST | `/admin/payouts/generate` | Generate payout cycle for date range |
| POST | `/admin/payouts/:id/approve` | Approve a draft payout |
| POST | `/admin/payouts/:id/mark-paid` | Mark payout as paid with payment reference |

## Tests

- `apps/web/tests/e2e/admin-payouts.spec.ts` -- 6 test cases covering payouts list, status filter, generate cycle, invalid date range rejection, approve payout, mark paid, and missing payment reference validation.

## Key Decisions

1. **Mark Paid dialog**: Uses a controlled Dialog (not ConfirmationDialog) because it requires a text input for the payment reference before confirming.
2. **Bulk Approve**: Sequential `mutateAsync` calls rather than `Promise.all` to avoid overwhelming the API with concurrent requests.
3. **DRAFT status**: Added to StatusBadge payout color map as gray, distinct from PENDING (yellow) to match the payout lifecycle (DRAFT -> APPROVED -> PAID).
4. **Flexible data shapes**: Components handle both `data.payouts` and `data.items` response shapes for API compatibility.
