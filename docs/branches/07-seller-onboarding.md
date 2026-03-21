# Branch 7: Seller Onboarding

**Branch:** `feature/seller-onboarding` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 3

## What was built

Curated seller onboarding with approval workflow, per BR-005.

## Flow

```
1. Buyer registers account (role: BUYER)
2. POST /seller/register → Creates SellerProfile (PENDING), changes user role to SELLER
3. Admin sees pending seller in /admin/sellers?status=PENDING
4. Admin reviews profile, portfolio, business info
5. Admin POST /admin/sellers/:id/approve → status: APPROVED
   OR POST /admin/sellers/:id/reject → status: REJECTED (with reason)
6. Approved seller can now create product listings
```

## State Machine

```
PENDING → APPROVED (admin approves)
PENDING → REJECTED (admin rejects with reason)
APPROVED → SUSPENDED (admin suspends with reason)
```

## Audit Trail

Every admin action (approve/reject/suspend) creates an `audit_logs` entry with:
- `userId`: admin who took action
- `action`: `seller.approved`, `seller.rejected`, `seller.suspended`
- `oldValues`: `{ status: "PENDING" }`
- `newValues`: `{ status: "APPROVED" }` or `{ status: "REJECTED", reason: "..." }`

## Playwright Tests

- Buyer registers as seller → 201, status PENDING
- Admin lists pending sellers
- Admin approves seller → status APPROVED
- Non-admin gets 403 on admin routes
