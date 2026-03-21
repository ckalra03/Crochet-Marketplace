# Branch 2: Database Schema — Prisma & Database

**Branch:** `feature/database-schema` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 4

## What was built

Complete database schema covering all Phase 1-3 models using Prisma ORM with PostgreSQL.

## Architecture Decisions

- **Integer cents for money:** All monetary values stored as `Int` (paise/cents). Commission rates as basis points (1500 = 15.00%). Prevents floating-point rounding errors in financial calculations.
- **`@map()` everywhere:** camelCase TypeScript, snake_case database columns. Best of both worlds.
- **`@unique` on email:** Simple unique constraint instead of compound `@@unique([email, deletedAt])` which caused Prisma v6 compatibility issues.
- **Soft deletes at application layer:** Prisma v6 removed `$use()` middleware. Soft-delete filtering handled in service queries with `deletedAt: null`.

## Database Models (26 total)

### Phase 1 (MVP) — 21 models
| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| User | All actors (buyer/seller/admin) | → SellerProfile, Addresses, Orders |
| RefreshToken | JWT refresh token storage | → User |
| SellerProfile | Seller business info + status | → User, Products, Payouts |
| Category | Product categories (hierarchical) | → self (parent/children), Products |
| Product | Product listings | → SellerProfile, Category, Media |
| ProductMedia | Product images/videos | → Product |
| Address | Shipping addresses | → User, Orders |
| CartItem | Shopping cart | → User, Product |
| Order | Customer orders | → User, Address, OrderItems, Payments |
| OrderItem | Individual items in order | → Order, Product, SellerProfile |
| Payment | Payment transactions | → Order |
| OnDemandRequest | Custom order requests | → User, Category, Quotes |
| Quote | Admin quotes for on-demand | → OnDemandRequest, SellerProfile |
| Return | Return requests | → Order, OrderItem, User |
| Dispute | Dispute cases | → Order, User, SellerProfile |
| Rating | Buyer ratings/reviews | → OrderItem, User, Product |
| WarehouseItem | Fulfillment tracking | → OrderItem, SellerProfile |
| QcRecord | Quality check records | → WarehouseItem, User |
| Payout | Seller payout cycles | → SellerProfile, PayoutLineItems |
| PayoutLineItem | Per-item payout breakdown | → Payout, OrderItem |
| AuditLog | Business action audit trail | → User |

### Phase 2 — 3 models
SellerPerformanceMetrics, SlaRecord, SellerPenalty

### Phase 3 — 3 models
Tender, TenderBid, SellerTrustTier

## Seed Data

| Entity | Count | Details |
|--------|-------|---------|
| Admin | 1 | admin@crochethub.com / admin123456 |
| Buyer | 1 | buyer@test.com / buyer123456 |
| Seller | 1 | seller@test.com / seller123456 (approved) |
| Categories | 7 | Amigurumi, Blankets, Bags, Home Decor, Baby, Clothing, Seasonal |
| Products | 4 | Teddy Bear, Baby Blanket, Market Bag, Wall Hanging |
| Address | 1 | Buyer's home address in Bangalore |

## How to verify

```bash
cd apps/api
npx prisma db push        # Sync schema to DB
npx tsx prisma/seed.ts     # Seed test data
npx prisma studio          # Visual DB browser at localhost:5555
```
