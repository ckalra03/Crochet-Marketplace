# Branch 10: Order Management

**Branch:** `feature/order-management` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 1

## What was built

Full order lifecycle management with state machine validation, multi-actor views, and audit trail.

## Order State Machine

```
PENDING_PAYMENT → CONFIRMED (payment success)
PENDING_PAYMENT → FAILED (payment failed)
CONFIRMED → PROCESSING (admin acknowledges)
CONFIRMED → CANCELLED (buyer/admin cancels)
PROCESSING → WAREHOUSE_RECEIVED / IN_PRODUCTION
PROCESSING → CANCELLED
IN_PRODUCTION → WAREHOUSE_RECEIVED
WAREHOUSE_RECEIVED → QC_IN_PROGRESS
QC_IN_PROGRESS → PACKING (QC pass)
QC_IN_PROGRESS → QC_FAILED (QC fail)
QC_FAILED → WAREHOUSE_RECEIVED (resend)
QC_FAILED → CANCELLED
PACKING → DISPATCHED
DISPATCHED → DELIVERED
DELIVERED → COMPLETED
```

Transitions are validated against `ORDER_TRANSITIONS` from the shared package. Invalid transitions return 400 with allowed options.

## Actor Views

| Actor | Capabilities |
|-------|-------------|
| **Buyer** | List own orders (filter by status), view detail with items/tracking/returns, cancel pre-dispatch |
| **Seller** | List allocated order items with order context |
| **Admin** | List all orders, view full detail, advance status |

## Cancellation Logic

- Only allowed in: PENDING_PAYMENT, CONFIRMED, PROCESSING
- Stock restoration: READY_STOCK items get quantity incremented back
- Sets `cancelledAt` timestamp and `cancellationReason`

## Auto-timestamps

- `shippedAt` set on transition to DISPATCHED
- `deliveredAt` set on transition to DELIVERED
