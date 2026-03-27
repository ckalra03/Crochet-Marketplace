# Branch 45: `feature/fe-admin-audit-logs` -- Admin Audit Logs

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Admin-facing audit logs page that displays a searchable, filterable, paginated table of all administrative actions and system events. Supports expandable rows to inspect old/new value diffs for each logged action.

## New / Updated Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` | **New**: Audit logs viewer with DataTable, server-side pagination, filters (action, user, entity type, date range), expandable rows showing old/new JSON values, loading skeletons, and empty state. |

## Updated API Types

| File | Change |
|------|--------|
| `lib/api/admin.ts` | Added `startDate` and `endDate` optional fields to `AuditLogParams` interface to support date range filtering. |

## Existing Hooks Used

- `useAdminAuditLogs(params)` from `lib/hooks/use-admin.ts` -- fetches paginated audit logs with all filter parameters.

## UI Components Used

- `@tanstack/react-table` -- manual pagination table (server-side) with custom row rendering for expandable detail rows.
- `Input`, `Select`, `Label`, `Button`, `Skeleton`, `Table` -- from `components/ui/`.
- `formatDateTime` from `lib/utils/format.ts` -- formats timestamps in the table.

## Filters

| Filter | Type | Description |
|--------|------|-------------|
| Action | Select dropdown | Filter by action type (CREATE, UPDATE, DELETE, APPROVE, REJECT, etc.) |
| User ID / Name | Text input | Search by user ID or name string |
| Entity Type | Select dropdown | Filter by auditable entity (Order, Product, User, SellerProfile, Return, Dispute, Payout, etc.) |
| Start Date | Date input | Filter logs from this date onward |
| End Date | Date input | Filter logs up to this date |

## Key Decisions

- **Server-side pagination**: Unlike other admin DataTable pages that use client-side pagination via `getPaginationRowModel()`, audit logs use manual/server-side pagination because the dataset can grow very large.
- **Expandable rows**: Instead of navigating to a detail page, old/new values are shown inline via collapsible rows for quick inspection.
- **Fragment-based row expansion**: Uses React `Fragment` to render the detail row immediately after its parent row within the same `<tbody>`.

## E2E Tests

| File | Tests |
|------|-------|
| `tests/e2e/admin-audit-logs.spec.ts` | 3 tests: audit logs list returns data, filter by action, pagination with page param. |
