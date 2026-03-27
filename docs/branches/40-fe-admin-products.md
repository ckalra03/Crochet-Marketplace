# Branch 40: `feature/fe-admin-products` -- Admin Product Approval

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Admin product approval pages with tabbed DataTable views, a product detail review page, and a reusable ProductReviewPanel component with confirmation/rejection dialogs.

## New / Updated API Functions (`lib/api/admin.ts`)

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getAdminProducts(params?)` | GET | `/admin/products` | List all products with optional status filter |
| `getAdminProduct(id)` | GET | `/admin/products/:id` | Fetch single product detail (admin view) |

## New Hooks (`lib/hooks/use-admin.ts`)

| Hook | Purpose |
|------|---------|
| `useAdminProducts(params?)` | Fetch all products with optional filters (query) |
| `useAdminProduct(id)` | Fetch single product by ID (query) |

Updated `useApproveProduct()` and `useRejectProduct()` to also invalidate the `admin.products` query cache.

## New Query Keys (`lib/api/query-keys.ts`)

| Key | Factory |
|-----|---------|
| `admin.products` | `['admin', 'products', 'list', params]` |
| `admin.product` | `['admin', 'products', id]` |

## New Components

| Component | File | Purpose |
|-----------|------|---------|
| `ProductReviewPanel` | `components/admin/product-review-panel.tsx` | Approve (green) and Reject (red) buttons with confirmation dialog for approve and reason-required dialog for reject. Uses `useApproveProduct()` and `useRejectProduct()` mutations. Shows toast on success. |

## New / Updated Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin/products` | `app/admin/products/page.tsx` | Tabbed view: "Pending Approval" tab with DataTable (Product Name, Seller, Type badge, Price, Submitted Date, Approve/Reject actions) and "All Products" tab with DataTable showing all products and their statuses. Product name links to detail page. |
| `/admin/products/[id]` | `app/admin/products/[id]/page.tsx` | Full product review detail: product preview (name, description, type badge, price, compare-at-price, stock, lead time, materials, dimensions, care instructions), media gallery, seller info sidebar (business name, rating, status), return policy, submission info, and ProductReviewPanel at bottom for PENDING_APPROVAL products. Breadcrumb navigation. |

## Key Design Decisions

- **Tabbed layout**: Separates pending products (action-oriented) from the full list (overview), reducing cognitive load for admins
- **Inline actions on pending tab**: Approve/Reject buttons directly in the DataTable rows for quick batch processing
- **Confirmation dialog for approve**: Prevents accidental approvals since the action makes the product publicly visible
- **Required rejection reason**: Ensures sellers receive actionable feedback when their product is rejected
- **Detail page as buyer preview**: Shows the product exactly as a buyer would see it, helping admins evaluate the listing quality
- **ProductReviewPanel reusability**: The same component is used both inline in the DataTable and at the bottom of the detail page

## E2E Tests (`tests/e2e/admin-products.spec.ts`)

- Pending products list API returns valid response
- Products page displays both tabs
- Approve product via API
- Reject product with reason via API
- Reject without reason returns 400
