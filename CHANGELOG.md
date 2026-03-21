# Changelog

All notable changes to the Crochet Hub project, organized by feature branch.

## Branch 1: `feature/project-setup` — Monorepo & Infrastructure

**Merged:** 2026-03-21 | **Commits:** 5

- Initialized git repository with `main` branch
- Set up pnpm workspace monorepo with Turborepo orchestration
- Created `apps/api` (Express.js), `apps/web` (Next.js), `packages/shared`
- TypeScript base config with strict mode
- Docker Compose for PostgreSQL 16 and Redis 7
- ESLint + Prettier code formatting
- `.env.example` with all required environment variables
- Playwright E2E test configuration with multi-server setup
- Initial Next.js landing page with Crochet Hub branding

**Key files:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`, `.env.example`

---

## Branch 2: `feature/database-schema` — Prisma & Database

**Merged:** 2026-03-21 | **Commits:** 4

- Full Prisma schema with 26 models across Phase 1-3
- Phase 1 models: User, RefreshToken, SellerProfile, Category, Product, ProductMedia, Address, CartItem, Order, OrderItem, Payment, OnDemandRequest, Quote, Return, Dispute, Rating, WarehouseItem, QcRecord, Payout, PayoutLineItem, AuditLog
- Phase 2 models: SellerPerformanceMetrics, SlaRecord, SellerPenalty
- Phase 3 models: Tender, TenderBid, SellerTrustTier
- All monetary values as integer cents (no floating point)
- Commission rates as basis points (1500 = 15.00%)
- Snake_case DB columns mapped to camelCase TypeScript via `@map()`
- Prisma client singleton for connection pool management
- Seed script: admin user, test buyer, test seller (approved), 7 categories, 4 sample products, buyer address

**Key files:** `apps/api/prisma/schema.prisma`, `apps/api/src/config/database.ts`, `apps/api/prisma/seed.ts`

---

## Branch 3: `feature/shared-package` — Shared Types & Utilities

**Merged:** 2026-03-21 | **Commits:** 3

- Shared constants: Roles, OrderStatus, ProductType, ProductStatus, ReturnReason, SellerStatus, ReturnPolicy
- Order state transition map (`ORDER_TRANSITIONS`) defining valid status changes
- Return eligibility matrix (`RETURN_ELIGIBILITY`) per product type
- Zod validation schemas: auth (register, login, forgot/reset password), product (create, update), order (checkout, cancel, status update), return (create, review), seller (register, update, reject)
- Money utility class: integer-cents arithmetic, basis points calculation, locale-aware formatting (INR), JSON serialization for API responses

**Key files:** `packages/shared/src/constants/`, `packages/shared/src/validators/`, `packages/shared/src/utils/money.ts`

---

## Branch 4: `feature/logging` — Logging Infrastructure

**Merged:** 2026-03-21 | **Commits:** 3

- Winston logger with console (colored dev output) and file transports (`logs/app.log`, `logs/error.log`)
- File rotation: 10MB max size, 5 files retained
- Module-scoped child loggers via `createModuleLogger('module-name')`
- Morgan HTTP request logging piped through Winston
- Request ID middleware: UUID per request for log tracing (reads `X-Request-ID` header or generates new)
- Audit logger service: writes business-critical actions to `audit_logs` DB table with actor, action, old/new values, IP, user agent

**Key files:** `apps/api/src/support/logger.ts`, `apps/api/src/support/audit-logger.ts`, `apps/api/src/middleware/request-id.ts`, `apps/api/src/middleware/request-logger.ts`

---

## Branch 5: `feature/auth` — Authentication System

**Merged:** 2026-03-21 | **Commits:** 4

### Backend
- JWT service: access tokens (15min expiry), refresh tokens (7d expiry)
- Auth service: register (bcrypt 12 rounds), login with credential verification, token refresh with rotation (revoke old, issue new), logout with token revocation
- Auth middleware: `authenticate` (JWT verification), `optionalAuth`, `requireRole` (RBAC)
- Validation middleware: Zod schema validation for request bodies
- Error handler middleware: catches `AppError` for HTTP errors, logs unhandled errors
- Rate limiting on auth routes (20 requests / 15 minutes)

### Routes
- `POST /api/v1/auth/register` — buyer registration
- `POST /api/v1/auth/login` — returns access + refresh tokens
- `POST /api/v1/auth/refresh` — rotate refresh token
- `POST /api/v1/auth/logout` — revoke refresh token
- `GET /api/v1/profile` — view profile (protected)
- `PUT /api/v1/profile` — update name/phone
- `GET/POST/PUT/DELETE /api/v1/profile/addresses` — address CRUD

### Tests
- Playwright E2E: register, duplicate check, validation, login, wrong password, protected route access, token refresh

**Key files:** `apps/api/src/modules/auth/`, `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/auth.routes.ts`, `apps/web/tests/e2e/auth.spec.ts`

---

## Branch 6: `feature/catalog` — Product Catalog

**Merged:** 2026-03-21 | **Commits:** 3

### Backend
- Catalog service: product listing with full-text search (PostgreSQL `contains`), filtering (category, type, price range, seller), pagination, sorting (newest, price asc/desc, name)
- Product detail by slug: includes seller info, media, ratings with avg score
- Category tree: hierarchical with product counts

### Routes
- `GET /api/v1/catalog/products` — browse with filters
- `GET /api/v1/catalog/products/:slug` — product detail
- `GET /api/v1/catalog/categories` — category tree
- `GET /api/v1/catalog/categories/:slug/products` — products in category

### Tests
- Playwright E2E: listing, slug lookup, 404, type filter, search, categories, category products

**Key files:** `apps/api/src/modules/catalog/catalog.service.ts`, `apps/api/src/routes/catalog.routes.ts`, `apps/web/tests/e2e/catalog.spec.ts`

---

## Branch 7: `feature/seller-onboarding` — Seller Registration & Approval

**Merged:** 2026-03-21 | **Commits:** 3

### Backend
- Seller registration: buyer submits application → role changes to SELLER → profile created with PENDING status
- Admin approval workflow: list sellers (filter by status), view detail, approve/reject/suspend
- Audit logging on all approval decisions

### Routes
- `POST /api/v1/seller/register` — submit seller application
- `GET/PUT /api/v1/seller/profile` — view/update own profile
- `GET /api/v1/admin/sellers` — list sellers (admin)
- `GET /api/v1/admin/sellers/:id` — seller detail (admin)
- `POST /api/v1/admin/sellers/:id/approve|reject|suspend` — admin actions

### Tests
- Playwright E2E: buyer registers as seller, admin lists pending, admin approves, non-admin rejected

**Key files:** `apps/api/src/modules/seller-onboarding/seller.service.ts`, `apps/api/src/routes/seller.routes.ts`, `apps/web/tests/e2e/seller-onboarding.spec.ts`

---

## Branch 8: `feature/seller-products` — Seller Product Management

**Merged:** 2026-03-21 | **Commits:** 2

### Backend
- Seller product CRUD: create (auto-slug), update, soft-delete
- Submit for approval: draft/rejected → pending_approval
- Media upload via multer (5MB limit, image/video only)
- Admin product approval: list pending, approve (sets active), reject with reason
- Product state machine: DRAFT → PENDING_APPROVAL → APPROVED/REJECTED

### Routes
- `GET/POST/PUT/DELETE /api/v1/seller/products` — seller product CRUD
- `POST /api/v1/seller/products/:id/submit` — submit for approval
- `POST /api/v1/seller/products/:id/media` — upload media
- `DELETE /api/v1/seller/products/:id/media/:mediaId` — remove media
- `GET /api/v1/admin/products/pending` — pending queue
- `POST /api/v1/admin/products/:id/approve|reject` — admin approval

**Key files:** `apps/api/src/modules/products/product.service.ts`, `apps/api/src/routes/seller.routes.ts` (product section)

---

## Branch 9: `feature/cart-checkout` — Cart & Checkout

**Merged:** 2026-03-21 | **Commits:** 2

### Backend
- Cart service: add/update/remove items with stock validation (ready_stock quantity check)
- Checkout service: transactional order creation — validates all items, reserves stock (`FOR UPDATE`-style via decrement), calculates totals, creates order + order items, clears cart
- Mock payment: auto-confirms payment for localhost development
- Payment record creation with gateway, transaction ID, amount
- Order number generation: `CH-YYYYMMDD-XXXX`

### Routes
- `GET /api/v1/cart` — view cart with product details
- `POST /api/v1/cart/items` — add item
- `PUT /api/v1/cart/items/:id` — update quantity
- `DELETE /api/v1/cart/items/:id` — remove item
- `POST /api/v1/checkout` — create order from cart
- `POST /api/v1/checkout/payment-callback` — webhook handler

**Key files:** `apps/api/src/modules/cart/cart.service.ts`, `apps/api/src/modules/checkout/checkout.service.ts`

---

## Branch 10: `feature/order-management` — Order Lifecycle

**Merged:** 2026-03-21 | **Commits:** 1

### Backend
- Order state machine: validates transitions using `ORDER_TRANSITIONS` map from shared package
- Buyer: list own orders (filter by status), view detail with items/tracking/returns, cancel (pre-dispatch only, restores stock)
- Seller: list allocated order items with order context
- Admin: list all orders, view full detail, advance status (with audit trail)
- Auto-timestamps: `shippedAt` on DISPATCHED, `deliveredAt` on DELIVERED

### Routes
- `GET /api/v1/orders` — buyer's orders
- `GET /api/v1/orders/:orderNumber` — order detail
- `POST /api/v1/orders/:orderNumber/cancel` — cancel order
- `GET /api/v1/seller/orders` — seller allocated items
- `GET /api/v1/admin/orders` — all orders
- `POST /api/v1/admin/orders/:orderNumber/update-status` — advance state

**Key files:** `apps/api/src/modules/orders/order.service.ts`, `apps/api/src/routes/order.routes.ts`

---

## Branch 11: `feature/fulfillment-qc` — Warehouse & QC

**Merged:** 2026-03-21 | **Commits:** 1

### Backend
- Warehouse item lifecycle: AWAITING_ARRIVAL → RECEIVED → QC_PENDING → QC_PASSED/QC_FAILED → PACKED → DISPATCHED
- QC inspection with crochet-specific checklist: loose ends, finishing consistency, correct dimensions, color match, stitch quality, packaging adequacy
- Dispatch with tracking number and shipping carrier
- Audit logging on receive, QC pass/fail, dispatch

### Routes
- `GET /api/v1/admin/warehouse` — warehouse dashboard (filter by status)
- `POST /api/v1/admin/warehouse/:id/receive` — mark received
- `POST /api/v1/admin/warehouse/:id/qc` — submit QC result (PASS/FAIL + checklist)
- `POST /api/v1/admin/warehouse/:id/dispatch` — dispatch with tracking

**Key files:** `apps/api/src/modules/fulfillment/fulfillment.service.ts`

---

## Branch 12: `feature/on-demand` — On-Demand / Custom Orders

**Merged:** 2026-03-21 | **Commits:** 1

### Backend
- Buyer submits custom request: description, category, budget range, expected date
- Admin creates quote: price, estimated days, validity window (default 72h)
- Buyer accepts/rejects quote (validates expiry)
- State machine: SUBMITTED → UNDER_REVIEW → QUOTED → ACCEPTED/REJECTED/EXPIRED
- Request number generation: `ODR-YYYYMMDD-XXXX`

### Routes
- `POST /api/v1/on-demand` — submit request
- `GET /api/v1/on-demand` — buyer's requests
- `GET /api/v1/on-demand/:id` — request detail with quotes
- `POST /api/v1/on-demand/:id/quotes/:quoteId/accept|reject`
- `GET /api/v1/admin/on-demand-requests` — all requests
- `POST /api/v1/admin/on-demand-requests/:id/quote` — create quote

**Key files:** `apps/api/src/modules/on-demand/on-demand.service.ts`, `apps/api/src/routes/on-demand.routes.ts`

---

## Branch 13: `feature/returns-disputes` — Returns & Disputes

**Merged:** 2026-03-21 | **Commits:** 1

### Backend
- Return policy matrix engine: checks product type + reason against `RETURN_ELIGIBILITY` map
- Return window enforcement: 7 days from delivery (`RETURN_WINDOW_DAYS`)
- Auto-reject ineligible returns (e.g., preference change on MTO)
- Admin review: approve/reject with resolution (full/partial refund, replacement), refund amount, admin notes
- Dispute creation and resolution with audit trail
- Return number: `RET-YYYYMMDD-XXXX`, Dispute number: `DSP-YYYYMMDD-XXXX`

### Routes
- `POST /api/v1/returns` — submit return (validates eligibility)
- `GET /api/v1/returns` — buyer's returns
- `GET /api/v1/returns/:returnNumber` — return detail
- `GET /api/v1/admin/returns` — all returns
- `POST /api/v1/admin/returns/:id/review` — admin resolution
- `GET /api/v1/admin/disputes` — all disputes
- `POST /api/v1/admin/disputes/:id/resolve` — resolve dispute

**Key files:** `apps/api/src/modules/returns/return.service.ts`, `apps/api/src/modules/disputes/dispute.service.ts`

---

## Branch 14: `feature/seller-finance` — Payouts & Commissions

**Merged:** 2026-03-21 | **Commits:** 1

### Backend
- Payout calculation engine: groups eligible delivered items by seller, calculates commission (basis points from seller profile), enforces minimum threshold (₹500)
- Hold-back for return window: items must be past RETURN_WINDOW_DAYS before becoming payout-eligible
- Per-item line items for full payout transparency
- Admin workflow: generate cycle → draft → approve → mark paid (with bank reference)
- Seller view: list own payouts, view line-item breakdown
- Payout number: `PAY-YYYYMMDD-XXXX`

### Routes
- `GET /api/v1/seller/payouts` — seller's payouts
- `GET /api/v1/seller/payouts/:id` — payout detail with line items
- `GET /api/v1/admin/payouts` — all payouts
- `POST /api/v1/admin/payouts/generate` — generate payout cycle
- `POST /api/v1/admin/payouts/:id/approve` — approve payout
- `POST /api/v1/admin/payouts/:id/mark-paid` — mark as paid

**Key files:** `apps/api/src/modules/seller-finance/payout.service.ts`

---

## Branch 15: `feature/ratings` — Ratings & Reviews

**Merged:** 2026-03-22 | **Commits:** 2

- Buyer submits 1-5 star rating + optional review per order item
- Validates: order delivered, buyer ownership, no duplicates
- Product and seller aggregate scoring (avg via Prisma aggregate)
- Seller can view all received ratings with avg score

**Key files:** `apps/api/src/modules/ratings/rating.service.ts`

---

## Branch 16: `feature/notifications` — Notifications & Real-time

**Merged:** 2026-03-22 | **Commits:** 2

- Socket.io server with JWT auth middleware
- Role-based rooms: `user:{id}`, `seller:{id}`, `admin`
- NotificationService with typed helpers for buyer (order status, quotes, returns), seller (approval, orders, payouts), and admin (applications, disputes) events
- Integrated Socket.io into Express HTTP server

**Key files:** `apps/api/src/socket/socket.ts`, `apps/api/src/modules/notifications/notification.service.ts`

---

## Branch 17: `feature/admin-dashboard` — Admin Dashboard

**Merged:** 2026-03-22 | **Commits:** 2

- Dashboard KPI stats: orders today, pending approvals, open disputes, revenue, active counts
- Queryable audit log API with filters (action, userId, auditableType) and pagination

**Key files:** `apps/api/src/modules/dashboard/admin-dashboard.service.ts`

---

## Branch 18: `feature/seller-dashboard` — Seller Dashboard

**Merged:** 2026-03-22 | **Commits:** 2

- Seller dashboard KPI: total/monthly orders, revenue, avg rating, active/pending products, payouts
- Recent orders feed (last 5)
- Commission rate display

**Key files:** `apps/api/src/modules/dashboard/seller-dashboard.service.ts`
