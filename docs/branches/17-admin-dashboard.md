# Branch 17: Admin Dashboard

**Branch:** `feature/admin-dashboard` (merged to `main`)
**Date:** 2026-03-22
**Commits:** 2

## What was built

Admin dashboard KPI endpoint and queryable audit log API.

## Dashboard Stats (`GET /admin/dashboard`)

Returns aggregate metrics:

| Metric | Description |
|--------|-------------|
| `ordersToday` | Orders created since midnight |
| `totalOrders` | All-time order count |
| `pendingSellerApprovals` | Sellers with PENDING status |
| `pendingProductApprovals` | Products with PENDING_APPROVAL status |
| `openDisputes` | Disputes in OPEN or INVESTIGATING |
| `pendingReturns` | Returns in REQUESTED or UNDER_REVIEW |
| `pendingPayouts` | Payouts in DRAFT or APPROVED |
| `totalRevenueInCents` | Sum of all successful payments |
| `activeProducts` | APPROVED + active products |
| `activeSellers` | APPROVED sellers |

## Audit Logs (`GET /admin/audit-logs`)

Queryable audit trail with filters:

| Parameter | Description |
|-----------|-------------|
| `action` | Filter by action name (contains search) |
| `userId` | Filter by actor user ID |
| `auditableType` | Filter by entity type (Order, SellerProfile, etc.) |
| `page`, `limit` | Pagination (default limit: 50) |

Response includes user details (name, email) for each log entry.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /admin/dashboard | Aggregate KPI stats |
| GET | /admin/audit-logs | Queryable audit trail |
