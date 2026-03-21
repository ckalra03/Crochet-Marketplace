# Branch 6: Product Catalog

**Branch:** `feature/catalog` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 3

## What was built

Public-facing product catalog API with search, filtering, pagination, and category tree.

## Architecture Decisions

- **PostgreSQL `contains` for search:** Good enough for MVP. PRD notes full-text search via `to_tsvector` for Phase 2 when catalog grows.
- **SSR-ready endpoints:** All catalog routes are public (no auth required) so Next.js Server Components can fetch them directly.
- **Seller attribution on every product:** Per BR-004, seller info is always included in product responses.

## API Endpoints

| Method | Path | Parameters | Purpose |
|--------|------|-----------|---------|
| GET | /catalog/products | `search`, `categoryId`, `productType`, `minPrice`, `maxPrice`, `sellerId`, `page`, `limit`, `sort` | Browse products |
| GET | /catalog/products/:slug | — | Product detail |
| GET | /catalog/categories | — | Category tree |
| GET | /catalog/categories/:slug/products | `page`, `limit`, `sort` | Products in category |

## Sort Options

| Value | Behavior |
|-------|----------|
| `newest` (default) | `createdAt DESC` |
| `price_asc` | `priceInCents ASC` |
| `price_desc` | `priceInCents DESC` |
| `name` | `name ASC` |

## Response Shapes

### Product List
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Crochet Teddy Bear",
      "slug": "crochet-teddy-bear",
      "productType": "READY_STOCK",
      "priceInCents": 89900,
      "category": { "id": "...", "name": "Amigurumi", "slug": "amigurumi" },
      "sellerProfile": { "id": "...", "businessName": "Craft Corner Studio" },
      "media": [{ "filePath": "...", "isPrimary": true }],
      "_count": { "ratings": 0 }
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 4, "totalPages": 1 }
}
```

### Product Detail (includes avg rating)
```json
{
  ...product,
  "ratings": [...],
  "avgRating": 4.5
}
```

## Playwright Tests

- Lists products with pagination
- Gets product by slug with seller info
- Returns 404 for non-existent slug
- Filters by product type (READY_STOCK)
- Searches by keyword ("teddy")
- Lists categories with counts
- Gets products by category slug
