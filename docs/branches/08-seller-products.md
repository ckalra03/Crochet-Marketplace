# Branch 8: Seller Product Management

**Branch:** `feature/seller-products` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 2

## What was built

Seller product CRUD with media upload and admin approval workflow.

## Product Lifecycle

```
DRAFT → PENDING_APPROVAL (seller submits)
PENDING_APPROVAL → APPROVED (admin approves → isActive=true)
PENDING_APPROVAL → REJECTED (admin rejects with reason)
REJECTED → PENDING_APPROVAL (seller re-submits after edits)
APPROVED → DRAFT (auto-reset when seller edits approved product)
```

## Features

- **Auto-slug generation:** `slugify(name) + timestamp` ensures unique slugs
- **Media upload:** Multer with 5MB limit, image/video MIME validation
- **Ownership enforcement:** All seller routes verify `sellerProfileId` ownership
- **Soft delete:** Sets `deletedAt` + `isActive=false`

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /seller/products | List own products |
| POST | /seller/products | Create product (DRAFT) |
| PUT | /seller/products/:id | Update product |
| DELETE | /seller/products/:id | Soft delete |
| POST | /seller/products/:id/submit | Submit for approval |
| POST | /seller/products/:id/media | Upload image/video |
| DELETE | /seller/products/:id/media/:mediaId | Remove media |
| GET | /admin/products/pending | List pending approvals |
| POST | /admin/products/:id/approve | Approve product |
| POST | /admin/products/:id/reject | Reject with reason |
