# Branch 14: Seller Finance — Payouts

**Branch:** `feature/seller-finance` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 1

## What was built

Cycle-based payout calculation engine with commission deduction and transparent line-item breakdown — per BR-018/BR-019.

## Payout Calculation Algorithm

```
Input: cycleStart, cycleEnd

1. Find eligible order items:
   - sellerProfileId is not null
   - status is DELIVERED or COMPLETED
   - deliveredAt between cycleStart and (cycleEnd - RETURN_WINDOW_DAYS)
   - Not already included in any payout

2. Group by seller

3. For each seller:
   a. For each item:
      - itemAmount = totalPriceInCents
      - commission = round(itemAmount * commissionRate / 10000)
      - net = itemAmount - commission
   b. Sum: totalOrderValue, totalCommission, netPayout
   c. Skip if netPayout < 50000 (₹500 minimum threshold)
   d. Create Payout + PayoutLineItems

4. Return all generated payouts
```

## Payout Lifecycle

```
DRAFT → APPROVED (admin approves)
APPROVED → PAID (admin marks paid with bank reference)
```

## Key Design Decisions

- **Return window hold-back:** Items must be past `RETURN_WINDOW_DAYS` (7 days) from delivery before becoming payout-eligible. Prevents paying for items that get returned.
- **Minimum threshold:** ₹500 (50000 paise). Below-threshold amounts roll to next cycle.
- **Line-item transparency:** Every payout has per-order-item breakdown showing gross, commission, adjustments, net.
- **Commission in basis points:** Seller's `commissionRate` is 1500 = 15.00%. Stored on seller profile, applied per item.

## API Endpoints

| Actor | Method | Path | Purpose |
|-------|--------|------|---------|
| Seller | GET | /seller/payouts | List own payouts |
| Seller | GET | /seller/payouts/:id | Payout detail with line items |
| Admin | GET | /admin/payouts | All payouts (filter by status) |
| Admin | POST | /admin/payouts/generate | Generate payout cycle |
| Admin | POST | /admin/payouts/:id/approve | Approve payout |
| Admin | POST | /admin/payouts/:id/mark-paid | Mark as paid with reference |

## BRD Compliance

- **BR-018:** Payout shows order value, commission, adjustments, net ✓
- **BR-019:** Payouts follow declared cycle ✓
- **BR-020:** Seller dashboard provides transparent payout explanations ✓
