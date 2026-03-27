# Branch 29: `feature/fe-cart-checkout` -- Enhanced Cart, Checkout & Order Confirmation

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Rebuilt the cart and checkout pages from inline `api.get`/`api.post` calls into properly componentized `'use client'` pages that leverage React Query hooks (`useCart`, `useCreateOrder`, `useAddresses`). Added an order confirmation page with success animation. Extracted six reusable components across `components/cart/` and `components/checkout/`.

## New Components

### Cart (`components/cart/`)

| Component | File | Purpose |
|-----------|------|---------|
| `QuantityControl` | `quantity-control.tsx` | Compact +/- buttons with min 1 / max stockQuantity enforcement |
| `CartItemList` | `cart-item-list.tsx` | Cart items grouped by seller with product type badge, unit price, quantity control, line total, remove button |
| `CartSummary` | `cart-summary.tsx` | Subtotal, item count, shipping (free), total, "Proceed to Checkout" CTA; sticky on desktop |

### Checkout (`components/checkout/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AddressSelector` | `address-selector.tsx` | Radio group of saved addresses from `useAddresses()`, default pre-selected, Dialog-based "Add New Address" form |
| `OrderSummary` | `order-summary.tsx` | Readonly item list with thumbnails, pricing breakdown, policy acknowledgment checkbox (adapts for MTO/On-Demand) |
| `PaymentSection` | `payment-section.tsx` | Mock payment for Phase 1 with dev-mode disclaimer and "Pay" button |

## Updated Pages

### `app/(buyer)/cart/page.tsx`

- Replaced inline `api.get('/cart')` with `useCart()` React Query hook
- Loading skeleton with animated placeholders
- Empty cart state with "Start Shopping" CTA
- Items displayed via `CartItemList` + `CartSummary` in a 2+1 grid

### `app/(buyer)/checkout/page.tsx`

- Multi-step layout: Address > Review > Payment
- Pre-selects default address from `useAddresses()`
- Redirects to cart if cart is empty
- Uses `useCreateOrder()` mutation; on success redirects to confirmation page
- Back-to-cart navigation link

### `app/(buyer)/orders/[orderNumber]/confirmation/page.tsx` (NEW)

- Fetches order via `getOrderByNumber()` with React Query
- CSS checkmark success animation
- Shows order number, order date, estimated delivery (7 days)
- Line items summary with totals
- Shipping address display
- "Track Order" and "Continue Shopping" action buttons

## E2E Tests

`apps/web/tests/e2e/cart-checkout.spec.ts` covers:
- Cart API: add item, view cart, update quantity, remove item
- Checkout API: create order with valid address
- Checkout rejects when cart is empty

## Key Dependencies

- `useCart()`, `useUpdateCartItem()`, `useRemoveCartItem()` from `lib/hooks/use-cart.ts`
- `useCreateOrder()` from `lib/hooks/use-checkout.ts`
- `useAddresses()`, `useAddAddress()` from `lib/hooks/use-profile.ts`
- `formatMoney()`, `formatDate()` from `lib/utils/format.ts`
- `useCartStore` (Zustand) for client-side cart count badge sync
