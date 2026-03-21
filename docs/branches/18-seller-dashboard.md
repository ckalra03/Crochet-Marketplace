# Branch 18: Seller Dashboard

**Branch:** `feature/seller-dashboard` (merged to `main`)
**Date:** 2026-03-22
**Commits:** 2

## What was built

Seller dashboard KPI endpoint with comprehensive business metrics — per BR-020.

## Dashboard Stats (`GET /seller/dashboard`)

| Metric | Description |
|--------|-------------|
| `totalOrders` | All-time order items allocated to seller |
| `ordersThisMonth` | Orders in last 30 days |
| `pendingOrders` | Orders in CONFIRMED or PROCESSING |
| `totalRevenueInCents` | Sum of delivered/completed order items |
| `revenueThisMonthInCents` | Revenue in last 30 days |
| `avgRating` | Average buyer rating (1-5) |
| `totalRatings` | Number of ratings received |
| `activeProducts` | APPROVED and active product count |
| `pendingProducts` | Products awaiting approval |
| `totalPayoutsPaidInCents` | Sum of all paid payouts |
| `pendingPayouts` | Payouts in DRAFT or APPROVED |
| `commissionRate` | Seller's commission rate (basis points) |
| `recentOrders` | Last 5 order items with order details |

## Response Shape

```json
{
  "overview": {
    "totalOrders": 42,
    "ordersThisMonth": 8,
    "pendingOrders": 2,
    "totalRevenueInCents": 1250000,
    "revenueThisMonthInCents": 350000,
    "avgRating": 4.5,
    "totalRatings": 15,
    "activeProducts": 12,
    "pendingProducts": 1,
    "totalPayoutsPaidInCents": 950000,
    "pendingPayouts": 1
  },
  "recentOrders": [...],
  "commissionRate": 1500
}
```

## BRD Compliance

- **BR-020:** Seller dashboard provides transparent payout explanations ✓
- **FR-S-004:** Seller can view order allocations and payout details ✓
- **FR-S-005:** Seller receives performance feedback via ratings ✓
