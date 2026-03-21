# Branch 15: Ratings & Reviews

**Branch:** `feature/ratings` (merged to `main`)
**Date:** 2026-03-22
**Commits:** 2

## What was built

Buyer post-delivery rating system with seller aggregate scores — per FR-B-005.

## Features

- Buyer submits 1-5 star rating + optional text review for each order item
- Validates: order is DELIVERED/COMPLETED, buyer owns the order, seller exists, not already rated
- Product ratings: list with avg score and pagination
- Seller ratings: aggregate across all products with avg score

## API Endpoints

| Actor | Method | Path | Purpose |
|-------|--------|------|---------|
| Buyer | POST | /orders/:orderNumber/items/:itemId/rating | Submit rating (score 1-5, review) |
| Seller | GET | /seller/ratings | View received ratings with avg score |

## Data Model

```
Rating {
  orderItemId  → unique per (orderItemId, userId)
  userId       → buyer who rated
  sellerProfileId → seller being rated
  productId    → product being rated
  score        → 1-5 (SmallInt)
  review       → optional text
  isVisible    → admin can hide (default true)
}
```

## Aggregation

- Per-product avg: `prisma.rating.aggregate({ _avg: { score: true } })`
- Per-seller avg: same query scoped to `sellerProfileId`
- Included in catalog product detail response as `avgRating`
