# Branch 3: Shared Package — Types & Utilities

**Branch:** `feature/shared-package` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 3

## What was built

Shared TypeScript package consumed by both `apps/api` and `apps/web` for type safety across the stack.

## Architecture Decisions

- **Shared Zod schemas:** Single source of truth for validation — same schemas used by Express middleware and React Hook Form.
- **Money as value object:** Immutable class with arithmetic methods prevents scattered formatting/rounding logic.
- **Constants over enums:** `as const` objects provide type inference without TypeScript enum overhead.

## Contents

### Constants (`packages/shared/src/constants/`)

| File | Exports |
|------|---------|
| `roles.ts` | `ROLES` object, `Role` type |
| `order-states.ts` | `ORDER_STATUS`, `ORDER_TRANSITIONS` (state machine map), `PRODUCT_TYPE`, `PRODUCT_STATUS`, `RETURN_REASON`, `SELLER_STATUS`, `RETURN_POLICY`, `RETURN_ELIGIBILITY` (policy matrix), `RETURN_WINDOW_DAYS` (7) |

### Validators (`packages/shared/src/validators/`)

| File | Schemas |
|------|---------|
| `auth.ts` | `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `refreshTokenSchema` |
| `product.ts` | `createProductSchema`, `updateProductSchema` |
| `order.ts` | `checkoutSchema`, `cancelOrderSchema`, `updateOrderStatusSchema` |
| `return.ts` | `createReturnSchema`, `reviewReturnSchema` |
| `seller.ts` | `sellerRegisterSchema`, `updateSellerProfileSchema`, `rejectSellerSchema` |

### Utilities (`packages/shared/src/utils/`)

| File | Exports |
|------|---------|
| `money.ts` | `Money` class — `fromCents()`, `fromAmount()`, `add()`, `subtract()`, `multiply()`, `applyBasisPoints()`, `format()`, `toJSON()` |

## Usage Example

```typescript
import { Money, ORDER_TRANSITIONS, registerSchema } from '@crochet-hub/shared';

// Validate input
const result = registerSchema.safeParse(req.body);

// Check state transitions
const allowed = ORDER_TRANSITIONS['CONFIRMED']; // ['PROCESSING', 'CANCELLED']

// Money arithmetic
const price = Money.fromCents(89900);
const commission = price.applyBasisPoints(1500); // 15% = ₹134.85
console.log(commission.format()); // "₹134.85"
```
