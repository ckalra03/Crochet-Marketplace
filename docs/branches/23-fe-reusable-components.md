# Branch 23: `feature/fe-reusable-components` — Reusable Frontend Components

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Core reusable UI components and format utilities shared across the admin, seller, and buyer dashboards. These components standardize data display, feedback patterns, and layout across the application.

## Components Created

### Data Display

| Component | Path | Purpose |
|-----------|------|---------|
| `DataTable` | `components/data-table/data-table.tsx` | Generic table with sorting, filtering, pagination using @tanstack/react-table |
| `DataTableColumnHeader` | (same file) | Sortable column header with asc/desc/none toggle |

### Feedback

| Component | Path | Purpose |
|-----------|------|---------|
| `StatusBadge` | `components/feedback/status-badge.tsx` | Maps status strings to colored badges (order, seller, product, return, dispute, payout) |
| `EmptyState` | `components/feedback/empty-state.tsx` | Centered placeholder with icon, title, description, optional action |
| `Timeline` | `components/feedback/timeline.tsx` | Vertical timeline with completed/current/upcoming steps |
| `ConfirmationDialog` | `components/feedback/confirmation-dialog.tsx` | Confirm-before-action wrapper around AlertDialog |

### Dashboard

| Component | Path | Purpose |
|-----------|------|---------|
| `KpiCard` | `components/dashboard/kpi-card.tsx` | Metric card with value, title, icon, trend arrow |
| `KpiCardGrid` | `components/dashboard/kpi-card-grid.tsx` | Responsive grid (1/2/4 cols) for KpiCard layout |

### Layout

| Component | Path | Purpose |
|-----------|------|---------|
| `PageHeader` | `components/layout/page-header.tsx` | Page title, description, actions, breadcrumb support |

### Utilities

| Function | Path | Purpose |
|----------|------|---------|
| `formatMoney(cents)` | `lib/utils/format.ts` | Integer cents to INR string (e.g. 150000 -> "₹1,500.00") |
| `formatDate(date)` | (same file) | "DD MMM YYYY" format |
| `formatDateTime(date)` | (same file) | "DD MMM YYYY, HH:MM" format |
| `formatRelativeTime(date)` | (same file) | "2 hours ago", "3 days ago" |
| `getStatusLabel(status)` | (same file) | SNAKE_CASE to Title Case |

## StatusBadge Color Mapping

| Type | Statuses & Colors |
|------|-------------------|
| Order | PENDING_PAYMENT(yellow), CONFIRMED/PROCESSING/WAREHOUSE_RECEIVED/PACKING(blue), IN_PRODUCTION(purple), QC_IN_PROGRESS(amber), QC_FAILED/FAILED(red), DISPATCHED(indigo), DELIVERED/COMPLETED(green), CANCELLED(gray) |
| Seller | PENDING(yellow), APPROVED(green), SUSPENDED/REJECTED(red) |
| Product | DRAFT/DISABLED(gray), PENDING_APPROVAL(yellow), APPROVED(green), REJECTED(red) |
| Return | REQUESTED(yellow), APPROVED/REFUNDED(green), REJECTED(red), RECEIVED(blue), CANCELLED(gray) |
| Dispute | OPEN(yellow), UNDER_REVIEW(blue), RESOLVED(green), CLOSED(gray), ESCALATED(red) |
| Payout | PENDING(yellow), APPROVED(blue), PAID(green), FAILED(red) |

## Architecture Decisions

- **DataTable is generic:** Accepts `ColumnDef[]` and `data[]` — each page defines its own columns, keeping the table component simple and reusable.
- **StatusBadge auto-detects type:** If no `type` prop is passed, it searches all color maps to find the status. Passing `type` is more explicit and recommended.
- **Format utilities are pure functions:** No React dependency, safe for both server and client use.
- **All components use `'use client'`:** Since they use React hooks or event handlers.
- **Consistent import pattern:** All components import from `@/components/ui/` and `@/lib/utils/cn`.

## Key Files

- `apps/web/src/components/data-table/data-table.tsx`
- `apps/web/src/components/feedback/status-badge.tsx`
- `apps/web/src/components/feedback/empty-state.tsx`
- `apps/web/src/components/feedback/timeline.tsx`
- `apps/web/src/components/feedback/confirmation-dialog.tsx`
- `apps/web/src/components/dashboard/kpi-card.tsx`
- `apps/web/src/components/dashboard/kpi-card-grid.tsx`
- `apps/web/src/components/layout/page-header.tsx`
- `apps/web/src/lib/utils/format.ts`
