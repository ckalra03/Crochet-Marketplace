# Branch 13: Returns & Disputes

**Branch:** `feature/returns-disputes` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 1

## What was built

Return policy matrix engine (per BRD Section 9.3) and dispute resolution system.

## Return Policy Matrix

Per BR-015, returns are evaluated against a predefined eligibility matrix:

| Product Type | DEFECTIVE | WRONG_ITEM | TRANSIT_DAMAGE | PREFERENCE_CHANGE |
|-------------|-----------|------------|----------------|-------------------|
| READY_STOCK | Eligible | Eligible | Eligible | Not eligible |
| MADE_TO_ORDER | Eligible | Eligible | Eligible | Not eligible |
| ON_DEMAND | Eligible | Eligible | Eligible | Not eligible |

## Return Flow

```
1. Buyer POST /returns → system checks:
   a. Order is DELIVERED or COMPLETED
   b. Within 7-day return window (RETURN_WINDOW_DAYS)
   c. Reason is eligible for product type (RETURN_ELIGIBILITY matrix)
   → If any check fails: 400 with explanation
   → If passes: Return created (status: REQUESTED)

2. Admin sees return in /admin/returns
3. Admin POST /admin/returns/:id/review with:
   - resolution: FULL_REFUND | PARTIAL_REFUND | REPLACEMENT | REJECTED
   - refundAmountInCents (for partial)
   - adminNotes
4. Return status: APPROVED or REJECTED
```

## Dispute Flow

```
1. Buyer creates dispute: POST with orderId, type (QUALITY/DELIVERY/PAYMENT/OTHER), description
2. Admin reviews in /admin/disputes
3. Admin resolves: POST /admin/disputes/:id/resolve with resolutionSummary
4. Status: OPEN → RESOLVED
```

## Number Formats

- Returns: `RET-YYYYMMDD-XXXX`
- Disputes: `DSP-YYYYMMDD-XXXX`

## BRD Compliance

- **BR-015:** Return outcomes follow predefined policy matrix ✓
- **BR-016:** Defect, wrong-item, transit-damage are platform-resolvable ✓
- **BR-001:** Super Seller is final decision authority ✓
