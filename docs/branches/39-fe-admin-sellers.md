# Branch 39: `feature/fe-admin-sellers` -- Admin Seller Management

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Admin seller management pages for reviewing and managing seller applications. Upgraded the existing placeholder sellers list to use DataTable with proper columns, status filtering tabs, and search. Added a seller detail/review page with full profile view, masked bank details, portfolio images, commission rate, approval history, and action panel. Built a reusable `SellerReviewActions` component with Approve, Reject (with reason dialog), and Suspend (with reason dialog) functionality.

## New Components

| Component | File | Purpose |
|-----------|------|---------|
| `SellerReviewActions` | `components/admin/seller-review-actions.tsx` | Action panel with Approve/Reject/Suspend buttons, confirmation dialogs, and reason textarea for reject/suspend |

## Updated Pages

| Route | File | Changes |
|-------|------|---------|
| `/admin/sellers` | `app/admin/sellers/page.tsx` | Full rewrite: DataTable with sortable columns (Business Name, Applicant Name, Email, Status, Applied Date, Actions), status filter tabs (All/Pending/Approved/Suspended/Rejected), search by business name, row click navigation, loading skeletons |

## New Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin/sellers/[id]` | `app/admin/sellers/[id]/page.tsx` | Seller detail/review page with breadcrumb, full profile view, masked bank details, portfolio images grid, commission rate, approval history timeline, and SellerReviewActions panel (Pending: approve/reject, Approved: suspend) |

## Hooks Used (from `use-admin.ts`)

| Hook | Purpose |
|------|---------|
| `useAdminSellers(params)` | Fetch paginated seller list with optional status filter |
| `useAdminSeller(id)` | Fetch single seller profile by ID |
| `useApproveSeller()` | Mutation to approve a pending seller |
| `useRejectSeller()` | Mutation to reject a pending seller with reason |
| `useSuspendSeller()` | Mutation to suspend an active seller with reason |

## Reusable Components Used

- `DataTable` + `DataTableColumnHeader` -- sortable, filterable, paginated table
- `StatusBadge` -- color-coded seller status display
- `ConfirmationDialog` -- confirm before approve action
- `PageHeader` -- consistent page header with breadcrumbs
- `Breadcrumb` -- navigation breadcrumb trail

## Testing

- Playwright e2e tests in `apps/web/tests/e2e/admin-sellers.spec.ts` covering:
  - Admin sellers list API response
  - Admin seller detail API response
  - Approve seller flow
  - Reject seller with reason flow
