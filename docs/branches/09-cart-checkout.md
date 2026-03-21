# Branch 9: Cart & Checkout

**Branch:** `feature/cart-checkout` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 2

## What was built

Cart management with stock validation and transactional checkout with mock payment for localhost.

## Cart Features

- Add item (validates product is APPROVED + active)
- Stock validation for READY_STOCK products
- Upsert: adding existing product increments quantity
- Update quantity (0 = remove)
- Cart response includes product details, seller info, and total

## Checkout Flow

```
1. POST /checkout with { shippingAddressId, policyAcknowledged: true }
2. Transaction begins:
   a. Validate all cart items still available
   b. Reserve stock (decrement for READY_STOCK)
   c. Create Order + OrderItems
   d. Clear cart
3. Transaction commits
4. Mock payment auto-confirms (for localhost dev)
5. Order status: PENDING_PAYMENT → CONFIRMED
6. Payment record created with MOCK gateway
7. Return order with items + payment details
```

## Key Design Decisions

- **Transactional checkout:** Stock reservation + order creation in single `prisma.$transaction` prevents race conditions
- **Mock payment gateway:** Auto-confirms for localhost. Production will integrate Razorpay/Stripe with webhook verification
- **Order number format:** `CH-YYYYMMDD-XXXX` (human-readable)
- **Price snapshot:** `unitPriceInCents` and `productName` are copied to OrderItem at checkout time (not referenced)

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /cart | View cart with totals |
| POST | /cart/items | Add item `{ productId, quantity }` |
| PUT | /cart/items/:id | Update quantity |
| DELETE | /cart/items/:id | Remove item |
| POST | /checkout | Create order from cart |
| POST | /checkout/payment-callback | Payment webhook |
