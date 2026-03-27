# Crochet Hub - Phase-Wise Implementation Plan

**Document Version:** 2.0
**Date:** 27 Mar 2026
**Source:** PRD v2.0, BRD v1.0
**Status:** Phase 1 complete (Branches 1-45), Phase 2 complete (Branches 46-56), Phase 3 planned

---

## Current State

### What's Built (Branches 1-18)

**Backend (fully implemented):**
- Auth (JWT, refresh tokens, RBAC) — Branch 5
- Product catalog (search, filter, categories) — Branch 6
- Seller onboarding & approval workflow — Branch 7
- Seller product CRUD with approval — Branch 8
- Cart & transactional checkout — Branch 9
- Order lifecycle state machine — Branch 10
- Warehouse fulfillment & QC — Branch 11
- On-demand requests & quotes — Branch 12
- Returns & disputes — Branch 13
- Seller finance (payouts, commissions, penalties) — Branch 14
- Ratings & reviews — Branch 15
- Notifications (Socket.io) — Branch 16
- Admin dashboard KPIs — Branch 17
- Seller dashboard KPIs — Branch 18

**Frontend (partially built):**
- Login/register pages (basic forms)
- Storefront layout, homepage, products listing, product detail (basic)
- Cart page, checkout page (basic)
- Buyer: orders list, order detail (basic)
- Seller: dashboard, products list, products/new (basic)
- Admin: dashboard, sellers, products, orders, warehouse (basic)
- shadcn/ui: badge, button, card, input, label only

### What's Missing

**Frontend infrastructure:**
- No React Query hooks (all pages use raw `useEffect` + `api.get()`)
- No Next.js middleware for auth guards
- No Socket.io client provider
- No reusable DataTable, MultiStepForm, ImageUploader
- Only 5 of ~20 needed shadcn/ui components installed
- No Framer Motion animations
- No URL state management for filters

**Backend gaps:**
- Forgot/reset password endpoints
- Email verification endpoint
- Assign seller to on-demand request
- Return refund initiation
- Compression middleware
- Soft-delete Prisma middleware

---

## Phase 1 — MVP Completion (Branches 19-45)

### Tier 0: Foundation Infrastructure

These branches must be built first — they are dependencies for nearly everything else.

---

#### Branch 19: `feature/fe-shadcn-components`

**Scope:** Install all remaining shadcn/ui components needed across the application.

**Components to install:**
- `table`, `textarea`, `select`, `dialog`, `alert-dialog`, `tabs`, `skeleton`, `switch`, `progress`, `sheet`, `scroll-area`, `accordion`, `command`, `pagination`, `alert`, `breadcrumb`, `tooltip`, `dropdown-menu`, `popover`, `checkbox`, `radio-group`, `separator`, `avatar`, `hover-card`, `slider`, `calendar`, `aspect-ratio`

**Files:** `apps/web/src/components/ui/*.tsx` (one per component)
**Dependencies:** None
**Complexity:** S

---

#### Branch 20: `feature/fe-api-layer`

**Scope:** Domain-specific API client modules + React Query hooks for ALL existing backend endpoints. Upgrade Axios interceptor with silent token refresh on 401.

**API client modules to create:**
| File | Endpoints Covered |
|------|-------------------|
| `lib/api/auth.ts` | login, register, refresh, logout, forgot/reset password |
| `lib/api/catalog.ts` | products list, product detail, categories, category products |
| `lib/api/cart.ts` | view cart, add/update/remove items |
| `lib/api/checkout.ts` | create order, payment callback |
| `lib/api/orders.ts` | buyer orders list, order detail, cancel |
| `lib/api/on-demand.ts` | submit request, list, detail, accept/reject quote |
| `lib/api/returns.ts` | submit return, list, detail |
| `lib/api/ratings.ts` | submit rating |
| `lib/api/profile.ts` | profile CRUD, address CRUD |
| `lib/api/seller.ts` | dashboard, products CRUD, orders, payouts, profile, ratings |
| `lib/api/admin.ts` | all admin endpoints (dashboard, sellers, products, orders, warehouse, on-demand, returns, disputes, payouts, audit-logs) |
| `lib/api/query-keys.ts` | Centralized query key factory |

**React Query hooks to create:**
| File | Hooks |
|------|-------|
| `lib/hooks/use-auth.ts` | useLogin, useRegister, useLogout |
| `lib/hooks/use-catalog.ts` | useProducts, useProduct, useCategories |
| `lib/hooks/use-cart.ts` | useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem |
| `lib/hooks/use-orders.ts` | useOrders, useOrder, useCancelOrder |
| `lib/hooks/use-on-demand.ts` | useOnDemandRequests, useSubmitRequest, useAcceptQuote, useRejectQuote |
| `lib/hooks/use-returns.ts` | useReturns, useReturn, useSubmitReturn |
| `lib/hooks/use-ratings.ts` | useSubmitRating |
| `lib/hooks/use-profile.ts` | useProfile, useAddresses, useUpdateProfile, useAddAddress |
| `lib/hooks/use-seller.ts` | useSellerDashboard, useSellerProducts, useSellerOrders, useSellerPayouts |
| `lib/hooks/use-admin.ts` | All admin query/mutation hooks |

**Modify:** `lib/api/client.ts` — add token refresh interceptor (attempt silent refresh before redirecting to /login)

**Dependencies:** None
**Complexity:** L

---

#### Branch 21: `feature/fe-auth-middleware`

**Scope:** Next.js middleware for route protection + role-based redirects. Client-side AuthGuard wrapper.

**Files to create:**
- `apps/web/src/middleware.ts` — Next.js edge middleware:
  - `/account/*`, `/checkout`, `/on-demand/*` → require authenticated buyer
  - `/seller/*` → require authenticated seller (approved status)
  - `/admin/*` → require authenticated admin
  - `/login`, `/register` → redirect authenticated users to their dashboard
  - Unauthorized → redirect to `/login?redirect={currentPath}`
- `apps/web/src/lib/utils/auth-guard.tsx` — client-side `<AuthGuard role="SELLER">` wrapper

**Modify:**
- `lib/stores/auth-store.ts` — store token in cookies (for middleware to read)
- `app/admin/layout.tsx` — wrap with AuthGuard
- `app/seller/layout.tsx` — wrap with AuthGuard

**Dependencies:** None
**Complexity:** M

---

#### Branch 22: `feature/fe-socket-provider`

**Scope:** React context provider for Socket.io with React Query cache invalidation.

**Files to create:**
- `lib/socket/socket-provider.tsx` — connect on auth, disconnect on logout, auto-reconnect
- `lib/socket/use-socket.ts` — `useSocket()` hook
- `lib/socket/use-socket-event.ts` — `useSocketEvent(event, callback)` with auto-cleanup
- `lib/socket/socket-query-invalidator.tsx` — maps Socket.io events to React Query invalidations:

| Socket Event | Query Invalidation |
|-------------|-------------------|
| `order:status_updated` | `['orders', orderNumber]` |
| `order:allocated` | `['seller', 'orders']` |
| `quote:issued` | `['on-demand-requests']` |
| `product:reviewed` | `['seller', 'products']` |
| `seller:application_reviewed` | `['seller', 'profile']` |
| `return:resolved` | `['returns']` |
| `payout:processed` | `['seller', 'payouts']` |
| `warehouse:item_received` | `['admin', 'warehouse']` |
| `dispute:created` | `['admin', 'disputes']` |
| `dashboard:counts_updated` | `['admin', 'dashboard']` |

**Modify:** `components/providers.tsx` — wrap with `<SocketProvider>`

**Dependencies:** Branch 20
**Complexity:** M

---

#### Branch 23: `feature/fe-reusable-components`

**Scope:** Core reusable components used across 15+ pages.

**New dependency:** `@tanstack/react-table`

**Components to create:**

| Component | File | Used In |
|-----------|------|---------|
| DataTable (generic) | `components/data-table/data-table.tsx` | S-03, S-06, A-02, A-04, A-06, A-08, A-10, A-12, A-13, A-14 |
| DataTable Pagination | `components/data-table/data-table-pagination.tsx` | All DataTable pages |
| DataTable Column Header | `components/data-table/data-table-column-header.tsx` | All DataTable pages |
| DataTable Toolbar | `components/data-table/data-table-toolbar.tsx` | All DataTable pages |
| DataTable Faceted Filter | `components/data-table/data-table-faceted-filter.tsx` | All DataTable pages |
| MultiStepForm | `components/forms/multi-step-form.tsx` | S-01, B-09 |
| ImageUploader | `components/forms/image-uploader.tsx` | S-04, B-09, B-11, B-13, A-14 |
| PriceInput | `components/forms/price-input.tsx` | S-04, A-09 |
| AddressForm | `components/forms/address-form.tsx` | B-05, B-14 |
| SearchInput | `components/forms/search-input.tsx` | B-02, S-03, A-06 |
| EmptyState | `components/feedback/empty-state.tsx` | All list pages |
| LoadingSkeleton | `components/feedback/loading-skeleton.tsx` | All pages |
| StatusBadge | `components/feedback/status-badge.tsx` | All status displays |
| CountdownTimer | `components/feedback/countdown-timer.tsx` | B-10, S-13 |
| Timeline | `components/feedback/timeline.tsx` | B-08, B-12, A-07 |
| BreadcrumbNav | `components/layout/breadcrumb-nav.tsx` | All detail pages |
| PageHeader | `components/layout/page-header.tsx` | All pages |
| KpiCard | `components/dashboard/kpi-card.tsx` | S-02, A-01 |
| KpiCardGrid | `components/dashboard/kpi-card-grid.tsx` | S-02, A-01 |
| ConfirmationDialog | `components/feedback/confirmation-dialog.tsx` | All destructive actions |
| Format utilities | `lib/utils/format.ts` | money (INR), dates, status labels |

**Dependencies:** Branch 19
**Complexity:** L

---

### Tier 1: Auth Completion + Backend Gaps

---

#### Branch 24: `feature/auth-password-reset`

**Scope:** Backend forgot/reset password APIs + frontend pages.

**Backend:**
- Add `passwordResetToken String?`, `passwordResetExpiry DateTime?` to User model
- `POST /api/v1/auth/forgot-password` — generate token, log to console (dev)
- `POST /api/v1/auth/reset-password` — validate token, update password, revoke all refresh tokens
- Rate limiting: 3 per hour per IP

**Frontend:**
- `app/(auth)/forgot-password/page.tsx` (AU-03) — email input form
- `app/(auth)/reset-password/page.tsx` (AU-04) — token + new password form
- Add "Forgot password?" link to login page

**Dependencies:** Branch 20, Branch 21
**Complexity:** M

---

#### Branch 25: `feature/backend-gaps`

**Scope:** Remaining backend API gaps from PRD.

**What to build:**
1. **Email verification:** `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/resend-verification` — add `emailVerificationToken String?` to User
2. **Assign seller to on-demand:** `POST /api/v1/admin/on-demand-requests/:id/assign-seller` — assign approved seller to produce custom item
3. **Return refund initiation:** `POST /api/v1/admin/returns/:id/initiate-refund` — mark refund initiated with reference
4. **Compression middleware:** Add `compression` package to Express app.ts
5. **Soft-delete Prisma middleware:** Intercept delete on User/Product, set `deletedAt`, filter on find operations

**Files:**
- `apps/api/prisma/schema.prisma` — schema additions
- `apps/api/src/middleware/soft-delete.ts`
- `apps/api/src/modules/auth/auth.service.ts` — email verification
- `apps/api/src/modules/on-demand/on-demand.service.ts` — assignSeller
- `apps/api/src/modules/returns/return.service.ts` — initiateRefund
- `apps/api/src/app.ts` — compression

**Dependencies:** None (pure backend)
**Complexity:** M

---

### Tier 2: Buyer Storefront Enhancement

---

#### Branch 26: `feature/fe-storefront-home`

**Scope:** Enhanced homepage (B-01) with all PRD sections.

**Components:**
- `components/storefront/hero-banner.tsx` — animated hero with CTA
- `components/storefront/featured-carousel.tsx` — horizontal scroll product carousel
- `components/storefront/how-it-works.tsx` — 3-4 step visual guide
- `components/storefront/seller-spotlight.tsx` — featured seller card
- `components/storefront/trending-carousel.tsx` — trending products

**Optional dependency:** `framer-motion`

**Dependencies:** Branch 20
**Complexity:** M

---

#### Branch 27: `feature/fe-catalog-enhanced`

**Scope:** Interactive catalog with URL-synced filters (B-02), category pages (B-16).

**Components:**
- `components/catalog/product-filter-sidebar.tsx` — checkboxes (category, type), price range slider, synced to URL
- `components/catalog/sort-select.tsx` — newest, price asc/desc, rating
- `components/catalog/active-filter-chips.tsx` — removable filter tags
- `components/catalog/product-grid.tsx` — responsive grid with loading skeletons
- `components/product/product-card.tsx` — reusable product card
- `lib/hooks/use-url-filters.ts` — URL state management hook

**Pages:**
- `app/(storefront)/products/page.tsx` — refactor with client-side filters + React Query
- `app/(storefront)/categories/[slug]/page.tsx` — NEW (SSG + ISR)

**Optional dependency:** `nuqs` (type-safe URL search params)

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 28: `feature/fe-product-detail`

**Scope:** Full-featured product detail page (B-03).

**Components:**
- `components/product/product-gallery.tsx` — image carousel, thumbnails, zoom, lightbox
- `components/product/product-type-badge.tsx` — Ready Stock (emerald), MTO (amber), On-Demand (violet)
- `components/product/seller-attribution.tsx` — seller name, avatar, rating, link
- `components/product/lead-time-indicator.tsx` — "Ships in X days"
- `components/product/return-policy-callout.tsx` — contextual return info
- `components/product/review-list.tsx` — paginated reviews with star breakdown
- `components/product/related-products.tsx` — horizontal carousel
- `components/product/add-to-cart-section.tsx` — quantity + add to cart (optimistic)

**Dependencies:** Branch 20, Branch 27 (ProductCard)
**Complexity:** M

---

#### Branch 29: `feature/fe-cart-checkout`

**Scope:** Full cart + multi-step checkout + order confirmation (B-04, B-05, B-06).

**Components:**
- `components/cart/cart-item-list.tsx` — grouped by seller
- `components/cart/quantity-control.tsx` — +/- with debounced API
- `components/cart/cart-summary.tsx` — subtotal, shipping, total
- `components/cart/empty-cart.tsx`
- `components/checkout/address-selector.tsx` — saved addresses
- `components/checkout/address-form-modal.tsx` — add new address
- `components/checkout/policy-acknowledgment.tsx` — return policy checkbox for MTO/On-Demand
- `components/checkout/payment-embed.tsx` — mock payment (Phase 1)
- `components/checkout/checkout-steps.tsx` — step indicator

**Pages:**
- `app/(buyer)/cart/page.tsx` — refactor with React Query
- `app/(buyer)/checkout/page.tsx` — refactor as multi-step
- `app/(buyer)/orders/[orderNumber]/confirmation/page.tsx` — NEW confirmation page

**Dependencies:** Branch 20, Branch 23
**Complexity:** L

---

#### Branch 30: `feature/fe-buyer-orders`

**Scope:** Full order management for buyers (B-07, B-08).

**Components:**
- `components/order/order-tabs.tsx` — Active/Completed/Cancelled with counts
- `components/order/order-card.tsx` — summary card for list view
- `components/order/order-timeline.tsx` — vertical step timeline
- `components/order/shipping-info.tsx` — tracking, carrier, estimated delivery
- `components/order/order-actions.tsx` — cancel, return, rate buttons

**Pages:**
- `app/(buyer)/orders/page.tsx` — refactor with tabs, pagination, React Query
- `app/(buyer)/orders/[orderNumber]/page.tsx` — refactor with timeline + Socket.io live updates

**Dependencies:** Branch 20, Branch 22, Branch 23
**Complexity:** M

---

#### Branch 31: `feature/fe-on-demand-buyer`

**Scope:** Complete on-demand/custom order buyer flow (B-09, B-10, B-15).

**Components:**
- `components/on-demand/request-form-wizard.tsx` — MultiStepForm: Details, Preferences, Review
- `components/on-demand/quote-card.tsx` — quote with countdown, accept/decline
- `components/on-demand/request-card.tsx` — compact card for list
- `components/on-demand/request-status-badge.tsx`

**Pages:**
- `app/(buyer)/on-demand/page.tsx` — request list
- `app/(buyer)/on-demand/new/page.tsx` — multi-step wizard
- `app/(buyer)/on-demand/[id]/page.tsx` — detail with quote review

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 32: `feature/fe-returns-ratings`

**Scope:** Return submission + rating/review (B-11, B-12, B-13).

**Components:**
- `components/returns/return-form.tsx` — reason selection, description, image upload
- `components/returns/return-status-card.tsx`
- `components/ratings/star-rating-input.tsx` — interactive star selector
- `components/ratings/review-form.tsx` — star input + text + submit

**Pages:**
- `app/(buyer)/returns/page.tsx` — returns list
- `app/(buyer)/returns/new/page.tsx` — return request form
- `app/(buyer)/returns/[returnNumber]/page.tsx` — return tracking with timeline
- `app/(buyer)/orders/[orderNumber]/rate/page.tsx` — rate + review form

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 33: `feature/fe-buyer-profile`

**Scope:** Buyer profile & account management (B-14).

**Components:**
- `components/profile/personal-info-form.tsx` — name, email (readonly), phone
- `components/profile/address-manager.tsx` — list, add, edit, delete, set default
- `components/profile/password-change-form.tsx`

**Pages:**
- `app/(buyer)/profile/page.tsx` — tabbed account page

**Dependencies:** Branch 20, Branch 23
**Complexity:** S

---

#### Branch 34: `feature/fe-static-pages`

**Scope:** Static content pages (B-19, B-20).

**Pages:**
- `app/(storefront)/about/page.tsx` — About Crochet Hub (SSG)
- `app/(storefront)/policies/page.tsx` — Policy index
- `app/(storefront)/policies/[slug]/page.tsx` — individual policies (return, shipping, privacy, terms)

**Dependencies:** None
**Complexity:** S

---

### Tier 3: Seller Dashboard Enhancement

---

#### Branch 35: `feature/fe-seller-onboarding`

**Scope:** Full 5-step seller registration wizard (S-01).

**Components:**
- `components/seller/registration-wizard.tsx` — 5 steps:
  1. Personal/Business Info
  2. Business Details & Description
  3. Portfolio/Sample Work (ImageUploader)
  4. Bank Account Details
  5. Terms & Agreement + Submit
- `components/seller/portfolio-uploader.tsx` — image grid upload

**Pages:**
- `app/seller/register/page.tsx` — registration wizard entry

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 36: `feature/fe-seller-dashboard-full`

**Scope:** Enhanced seller dashboard + full product management (S-02, S-03, S-04, S-05).

**Components:**
- `components/seller/pending-actions-widget.tsx` — items needing attention
- `components/seller/welcome-checklist.tsx` — onboarding progress for new sellers
- `components/seller/product-form.tsx` — shared tabbed form (Basic Info, Media, Pricing, Meta)
- `components/seller/product-media-tab.tsx` — media upload, reorder, primary selection

**Pages:**
- `app/seller/page.tsx` — enhanced dashboard with KPIs + widgets
- `app/seller/products/page.tsx` — refactor with DataTable (name, type, status, price, stock, actions)
- `app/seller/products/new/page.tsx` — refactor with tabbed form + auto-save
- `app/seller/products/[id]/edit/page.tsx` — NEW edit page (pre-populated)

**Dependencies:** Branch 20, Branch 23
**Complexity:** L

---

#### Branch 37: `feature/fe-seller-orders-payouts`

**Scope:** Seller orders, payouts, profile, ratings (S-06, S-07, S-08, S-09).

**Components:**
- `components/seller/payout-summary-card.tsx` — current cycle overview
- `components/seller/business-info-form.tsx`
- `components/seller/bank-details-form.tsx`
- `components/seller/portfolio-editor.tsx`

**Pages:**
- `app/seller/orders/page.tsx` — DataTable + Socket.io live updates
- `app/seller/orders/[id]/page.tsx` — order item detail (seller view)
- `app/seller/payouts/page.tsx` — payout summary + history
- `app/seller/payouts/[id]/page.tsx` — payout detail with line items
- `app/seller/profile/page.tsx` — tabbed profile editing
- `app/seller/ratings/page.tsx` — received ratings list

**Dependencies:** Branch 20, Branch 22, Branch 23
**Complexity:** L

---

### Tier 4: Admin Panel Enhancement

---

#### Branch 38: `feature/fe-admin-dashboard-full`

**Scope:** Full admin dashboard (A-01).

**Components:**
- `components/admin/pending-count-badges.tsx` — sellers, products, disputes, returns
- `components/admin/quick-action-shortcuts.tsx` — action button grid
- `components/admin/activity-feed.tsx` — recent audit log entries

**Pages:**
- `app/admin/page.tsx` — refactor with KpiCardGrid + widgets

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 39: `feature/fe-admin-sellers`

**Scope:** Seller application management (A-02, A-03, A-13).

**Components:**
- `components/admin/seller-review-actions.tsx` — approve/reject/suspend with confirmation

**Pages:**
- `app/admin/sellers/page.tsx` — DataTable (business name, status, date, actions)
- `app/admin/sellers/[id]/page.tsx` — NEW review detail (full profile, portfolio, approval panel)

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 40: `feature/fe-admin-products`

**Scope:** Product approval workflow (A-04, A-05).

**Components:**
- `components/admin/product-review-panel.tsx` — full preview + approve/reject

**Pages:**
- `app/admin/products/page.tsx` — DataTable with Pending/All tabs
- `app/admin/products/[id]/page.tsx` — NEW review detail (buyer preview, media, seller info)

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 41: `feature/fe-admin-orders-warehouse`

**Scope:** Order management + warehouse/QC dashboard (A-06, A-07, A-14).

**Components:**
- `components/admin/fulfillment-timeline.tsx` — order fulfillment progress
- `components/admin/qc-checklist-form.tsx` — 6 crochet-specific checks (loose ends, finishing, dimensions, color match, stitch quality, packaging)
- `components/admin/dispatch-form.tsx` — tracking number + carrier
- `components/admin/order-status-advance.tsx` — advance order state button

**Pages:**
- `app/admin/orders/page.tsx` — DataTable with advanced filters
- `app/admin/orders/[orderNumber]/page.tsx` — NEW admin order detail
- `app/admin/warehouse/page.tsx` — DataTable with status tabs
- `app/admin/warehouse/[id]/page.tsx` — NEW QC detail with checklist

**Dependencies:** Branch 20, Branch 23
**Complexity:** L

---

#### Branch 42: `feature/fe-admin-on-demand`

**Scope:** On-demand request management + quote creation (A-08, A-09).

**Components:**
- `components/admin/quote-form.tsx` — price, estimated days, validity, notes
- `components/admin/seller-assignment-select.tsx` — search and select approved seller

**Pages:**
- `app/admin/on-demand/page.tsx` — DataTable of all requests
- `app/admin/on-demand/[id]/page.tsx` — detail with quote creation + seller assignment

**Dependencies:** Branch 20, Branch 23, Branch 25 (assign seller API)
**Complexity:** M

---

#### Branch 43: `feature/fe-admin-returns-disputes`

**Scope:** Return + dispute resolution (A-10, A-11).

**Components:**
- `components/admin/evidence-gallery.tsx` — image grid viewer
- `components/admin/resolution-form.tsx` — resolution type, refund amount, summary
- `components/admin/return-review-form.tsx` — approve/reject with refund details

**Pages:**
- `app/admin/returns/page.tsx` — DataTable of all returns
- `app/admin/returns/[id]/page.tsx` — return detail + resolution
- `app/admin/disputes/page.tsx` — DataTable of all disputes
- `app/admin/disputes/[id]/page.tsx` — dispute detail with evidence + resolution

**Dependencies:** Branch 20, Branch 23, Branch 25 (refund API)
**Complexity:** M

---

#### Branch 44: `feature/fe-admin-payouts`

**Scope:** Payout processing (A-12).

**Components:**
- `components/admin/payout-cycle-selector.tsx` — date range picker
- `components/admin/bulk-approve-dialog.tsx`

**Pages:**
- `app/admin/payouts/page.tsx` — DataTable with cycle selector, status filters
- `app/admin/payouts/[id]/page.tsx` — payout detail, approve/mark-paid actions

**Dependencies:** Branch 20, Branch 23
**Complexity:** M

---

#### Branch 45: `feature/fe-admin-audit-logs`

**Scope:** Audit log viewer (already has API).

**Pages:**
- `app/admin/audit-logs/page.tsx` — DataTable with filters (action, user, date range, entity type)

**Dependencies:** Branch 20, Branch 23
**Complexity:** S

---

## Phase 2 — Performance, Analytics & Engagement (Branches 46-56)

---

#### Branch 46: `feature/redis-integration`

**Scope:** Redis infrastructure.

**Backend:**
- Redis client singleton (`apps/api/src/config/redis.ts`)
- Cache middleware for catalog endpoints (TTL: products 30s, categories 5min)
- Rate limiting backed by Redis store
- Socket.io Redis adapter for horizontal scaling

**Dependencies:** None
**Complexity:** M

---

#### Branch 47: `feature/bullmq-jobs`

**Scope:** Background job queues.

**Jobs:**
| Job | Schedule | Purpose |
|-----|----------|---------|
| `payout-generation` | Admin trigger or weekly cron | Generate payout cycles for all sellers |
| `sla-check` | Every 15 minutes | Check overdue orders, flag SLA breaches |
| `quote-expiry` | Every hour | Expire quotes past validity window |
| `return-window-expiry` | Daily | Mark items past return window as payout-eligible |

**Files:** `apps/api/src/jobs/*.job.ts`
**Dependencies:** Branch 46 (Redis)
**Complexity:** L

---

#### Branch 48: `feature/sla-monitoring`

**Scope:** SLA monitoring, auto-penalties, seller performance.

**Backend:**
- SLA monitoring service: breach detection per order status transition
- Auto-penalty creation on SLA breach
- Seller performance metrics calculation (avgRating, qcPassRate, onTimeRate, returnRate, disputeRate)
- `POST /api/v1/admin/penalties` — create penalty
- `POST /api/v1/admin/penalties/:id/waive` — waive penalty
- `GET /api/v1/admin/sla/dashboard` — SLA overview
- `GET /api/v1/admin/sla/breaches` — breached SLAs list
- `GET /api/v1/admin/performance/sellers` — seller rankings
- `GET /api/v1/seller/performance` — own performance metrics
- `GET /api/v1/seller/penalties` — own penalties

**Dependencies:** Branch 47 (BullMQ for scheduled checks)
**Complexity:** L

---

#### Branch 49: `feature/analytics-apis`

**Scope:** Analytics and platform configuration.

**Backend:**
- Revenue analytics: daily/weekly/monthly, by category, by seller
- Order analytics: volume, conversion, AOV trends
- Platform settings APIs: commission rates, SLA thresholds, return windows
- `GET /api/v1/admin/analytics/revenue`
- `GET /api/v1/admin/analytics/orders`
- `GET /api/v1/admin/analytics/sellers`
- `GET/PUT /api/v1/admin/settings`

**Dependencies:** None
**Complexity:** M

---

#### Branch 50: `feature/wishlist`

**Scope:** Wishlist feature (B-17).

**Backend:**
- Add Wishlist model to Prisma (userId, productId, createdAt)
- `GET /api/v1/wishlist` — list wishlist items
- `POST /api/v1/wishlist/:productId` — add to wishlist
- `DELETE /api/v1/wishlist/:productId` — remove from wishlist
- Include `isWishlisted` flag in product detail API for authenticated users

**Frontend:**
- Heart icon toggle on ProductCard and product detail
- `app/(buyer)/wishlist/page.tsx` — wishlist grid with remove option

**Dependencies:** Branch 20
**Complexity:** S

---

#### Branch 51: `feature/fe-notification-center`

**Scope:** Persistent notifications (B-18).

**Backend:**
- Notification model: id, userId, type, title, body, data (JSON), readAt, createdAt
- `GET /api/v1/notifications` — paginated list
- `POST /api/v1/notifications/:id/read` — mark read
- `POST /api/v1/notifications/read-all` — mark all read
- NotificationService persists before emitting Socket.io

**Frontend:**
- `components/layout/notification-bell.tsx` — bell icon with unread count badge
- `app/(buyer)/notifications/page.tsx` — full notification history page

**Dependencies:** Branch 22 (Socket provider)
**Complexity:** M

---

#### Branch 52: `feature/fe-charts`

**Scope:** Recharts integration for dashboards (S-10, S-11, A-17).

**New dependency:** `recharts`

**Components:**
- `components/charts/line-chart.tsx` — reusable line chart wrapper
- `components/charts/bar-chart.tsx` — reusable bar chart wrapper
- `components/charts/doughnut-chart.tsx` — reusable doughnut chart

**Pages:**
- `app/seller/performance/page.tsx` — S-10: revenue chart, orders chart, rating trend, QC pass/fail
- `app/seller/payouts/[id]/page.tsx` — S-11: enhanced payout detail with breakdown visualization
- `app/admin/analytics/page.tsx` — A-17: revenue over time, orders by status, top sellers, top products

**Dependencies:** Branch 49 (analytics APIs), Branch 20
**Complexity:** M

---

#### Branch 53: `feature/fe-seller-sla`

**Scope:** Seller SLA compliance (S-12).

**Pages:**
- `app/seller/compliance/page.tsx` — SLA compliance overview, breach alerts, on-time metrics

**Dependencies:** Branch 48 (SLA APIs)
**Complexity:** S

---

#### Branch 54: `feature/fe-admin-sla`

**Scope:** Admin SLA monitoring dashboard (A-15).

**Pages:**
- `app/admin/sla/page.tsx` — SLA monitoring: breaches by seller, trends, rankings

**Dependencies:** Branch 48 (SLA APIs), Branch 52 (charts)
**Complexity:** M

---

#### Branch 55: `feature/fe-admin-penalties`

**Scope:** Penalty management (A-16).

**Pages:**
- `app/admin/penalties/page.tsx` — penalty DataTable, create/waive actions

**Dependencies:** Branch 48 (penalty APIs), Branch 23
**Complexity:** S

---

#### Branch 56: `feature/fe-admin-settings`

**Scope:** Platform settings configuration (A-18).

**Pages:**
- `app/admin/settings/page.tsx` — commission rate, SLA thresholds, return windows, payout cycle config

**Dependencies:** Branch 49 (settings APIs)
**Complexity:** S

---

## Phase 3 — Advanced Features (Branches 57-62)

---

#### Branch 57: `feature/tender-management`

**Scope:** Tender/collaboration system backend.

**Backend:**
- Tender lifecycle: OPEN → BIDDING → AWARDED → IN_PROGRESS → COMPLETED
- `POST /api/v1/admin/tenders` — create tender
- `GET /api/v1/admin/tenders` — list tenders
- `GET /api/v1/admin/tenders/:id/bids` — view bids
- `POST /api/v1/admin/tenders/:id/award` — award to seller
- `GET /api/v1/seller/tenders` — available tenders for seller
- `POST /api/v1/seller/tenders/:id/bid` — submit bid

**Dependencies:** None
**Complexity:** L

---

#### Branch 58: `feature/trust-tiers`

**Scope:** Trust tier system.

**Backend:**
- Trust tier CRUD: BRONZE, SILVER, GOLD, PLATINUM
- Auto-tier calculation based on seller performance metrics
- Tier benefits: lower commission rate, priority assignment
- `PUT /api/v1/admin/sellers/:id/trust-tier` — assign tier
- `GET/POST/PUT/DELETE /api/v1/admin/trust-tiers` — tier CRUD

**Dependencies:** Branch 48 (seller performance metrics)
**Complexity:** M

---

#### Branch 59: `feature/advanced-reports`

**Scope:** Async report generation.

**Backend:**
- Report templates: sales, seller performance, payout reconciliation, inventory
- BullMQ job for async CSV/PDF generation
- Report storage + download API
- `POST /api/v1/admin/reports/generate` — trigger report
- `GET /api/v1/admin/reports` — list reports
- `GET /api/v1/admin/reports/:id/download` — download

**Dependencies:** Branch 47 (BullMQ)
**Complexity:** M

---

#### Branch 60: `feature/fe-tender-board`

**Scope:** Seller tender Kanban board (S-13).

**New dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable`

**Components:**
- `components/tender/tender-kanban-board.tsx` — drag-drop columns
- `components/tender/bid-submission-form.tsx`
- `components/tender/bid-status-tracker.tsx`

**Pages:**
- `app/seller/tenders/page.tsx` — Kanban board

**Dependencies:** Branch 57 (tender APIs)
**Complexity:** L

---

#### Branch 61: `feature/fe-admin-tenders-tiers`

**Scope:** Admin tender + trust tier management (A-19, A-20).

**Pages:**
- `app/admin/tenders/page.tsx` — tender DataTable + create form
- `app/admin/tenders/[id]/page.tsx` — detail, bid review, award action
- `app/admin/trust-tiers/page.tsx` — tier configuration, seller assignments

**Dependencies:** Branch 57, Branch 58
**Complexity:** M

---

#### Branch 62: `feature/fe-advanced-reporting`

**Scope:** Advanced reporting UI (A-21).

**New dependency:** `@tanstack/react-virtual`

**Components:**
- `components/admin/report-builder.tsx` — report type, date range, filters
- Progress indicator for async generation (Socket.io)
- Virtualized tables for large datasets

**Pages:**
- `app/admin/reports/page.tsx` — report builder + history

**Dependencies:** Branch 59 (report APIs), Branch 52 (charts)
**Complexity:** M

---

## Dependency Graph

```
Phase 1 Foundation:
  19 (shadcn) ─────────────────┐
  20 (API layer) ──────────────┤─── 22 (Socket) ──┐
  21 (auth middleware) ────────┤                   │
                               ├── 23 (reusable) ─┤
                               │                   │
Phase 1 Auth + Backend:        │                   │
  24 (password reset) ◄── 20, 21                   │
  25 (backend gaps)            │                   │
                               │                   │
Phase 1 Storefront:            │                   │
  26 (home) ◄── 20             │                   │
  27 (catalog) ◄── 20, 23     │                   │
  28 (product detail) ◄── 20, 27                   │
  29 (cart+checkout) ◄── 20, 23                    │
  30 (buyer orders) ◄── 20, 22, 23                 │
  31 (on-demand) ◄── 20, 23                        │
  32 (returns+ratings) ◄── 20, 23                  │
  33 (buyer profile) ◄── 20, 23                    │
  34 (static pages)            │                   │
                               │                   │
Phase 1 Seller:                │                   │
  35 (onboarding) ◄── 20, 23  │                   │
  36 (dashboard+products) ◄── 20, 23              │
  37 (orders+payouts) ◄── 20, 22, 23              │
                               │                   │
Phase 1 Admin:                 │                   │
  38-45 ◄── 20, 23 (some also need 25)            │
                                                   │
Phase 2:                                           │
  46 (Redis) ──► 47 (BullMQ) ──► 48 (SLA)        │
  49 (Analytics)                                   │
  50 (Wishlist) ◄── 20                             │
  51 (Notifications) ◄── 22 ◄─────────────────────┘
  52 (Charts) ◄── 49
  53-56 ◄── 48, 49

Phase 3:
  57 (Tenders API) ──► 60 (Kanban), 61 (Admin)
  58 (Trust Tiers) ◄── 48 ──► 61
  59 (Reports API) ◄── 47 ──► 62 (Reports UI)
```

---

## Recommended Sprint Sequence

### Phase 1 Sprints

| Sprint | Branches | Focus |
|--------|----------|-------|
| **Sprint 1** | 19, 20, 21, 25, 34 | Foundation + backend gaps + static pages |
| **Sprint 2** | 22, 23, 24 | Socket provider + reusable components + auth |
| **Sprint 3** | 26, 27, 28, 29 | Storefront (highest business value) |
| **Sprint 4** | 30, 31, 32, 33 | Buyer account flows |
| **Sprint 5** | 35, 36, 37 | Seller dashboard |
| **Sprint 6** | 38, 39, 40, 41 | Admin core pages |
| **Sprint 7** | 42, 43, 44, 45 | Admin remaining pages |

### Phase 2 Sprints

| Sprint | Branches | Focus |
|--------|----------|-------|
| **Sprint 8** | 46, 47, 49, 50 | Infrastructure (Redis, BullMQ) + wishlist + analytics APIs |
| **Sprint 9** | 48, 51, 52 | SLA monitoring + notifications + charts |
| **Sprint 10** | 53, 54, 55, 56 | SLA/penalty/settings frontend pages |

### Phase 3 Sprints

| Sprint | Branches | Focus |
|--------|----------|-------|
| **Sprint 11** | 57, 58, 59 | Backend APIs (tenders, trust tiers, reports) |
| **Sprint 12** | 60, 61, 62 | Frontend (Kanban, tier management, reporting) |

---

## New Dependencies by Phase

### Phase 1
| Package | Purpose | Branch |
|---------|---------|--------|
| `@tanstack/react-table` | DataTable component | 23 |
| `framer-motion` (optional) | Animations | 26 |
| `nuqs` (optional) | Type-safe URL params | 27 |

### Phase 2
| Package | Purpose | Branch |
|---------|---------|--------|
| `recharts` | Charts and visualizations | 52 |
| `ioredis` | Redis client (backend) | 46 |
| `bullmq` | Job queues (backend) | 47 |

### Phase 3
| Package | Purpose | Branch |
|---------|---------|--------|
| `@dnd-kit/core` | Drag and drop | 60 |
| `@dnd-kit/sortable` | Sortable lists | 60 |
| `@tanstack/react-virtual` | Virtualized tables | 62 |

---

## PRD Page Coverage Verification

### Buyer Pages (B-01 to B-20)
| Page | PRD ID | Branch | Status |
|------|--------|--------|--------|
| Home | B-01 | 26 | Enhance |
| Product Catalog | B-02 | 27 | Enhance |
| Product Detail | B-03 | 28 | Enhance |
| Cart | B-04 | 29 | Enhance |
| Checkout | B-05 | 29 | Enhance |
| Order Confirmation | B-06 | 29 | New |
| My Orders | B-07 | 30 | Enhance |
| Order Detail | B-08 | 30 | Enhance |
| On-Demand Request | B-09 | 31 | New |
| Quote Review | B-10 | 31 | New |
| Return Request | B-11 | 32 | New |
| Return Tracking | B-12 | 32 | New |
| Rate/Review | B-13 | 32 | New |
| Profile | B-14 | 33 | Enhance |
| My On-Demand | B-15 | 31 | New |
| Category Page | B-16 | 27 | New |
| Wishlist | B-17 | 50 (P2) | New |
| Notifications | B-18 | 51 (P2) | New |
| About | B-19 | 34 | New |
| Policies | B-20 | 34 | New |

### Seller Pages (S-01 to S-13)
| Page | PRD ID | Branch | Status |
|------|--------|--------|--------|
| Registration | S-01 | 35 | New |
| Dashboard | S-02 | 36 | Enhance |
| Product List | S-03 | 36 | Enhance |
| Product Create | S-04 | 36 | Enhance |
| Product Edit | S-05 | 36 | New |
| Order Allocations | S-06 | 37 | New |
| Order Detail | S-07 | 37 | New |
| Payout Summary | S-08 | 37 | New |
| Profile | S-09 | 37 | Enhance |
| Performance | S-10 | 52 (P2) | New |
| Payout Detail | S-11 | 52 (P2) | New |
| SLA Compliance | S-12 | 53 (P2) | New |
| Tender Board | S-13 | 60 (P3) | New |

### Admin Pages (A-01 to A-21)
| Page | PRD ID | Branch | Status |
|------|--------|--------|--------|
| Dashboard | A-01 | 38 | Enhance |
| Seller Applications | A-02 | 39 | Enhance |
| Application Review | A-03 | 39 | New |
| Product Queue | A-04 | 40 | Enhance |
| Product Review | A-05 | 40 | New |
| Order Management | A-06 | 41 | Enhance |
| Order Detail | A-07 | 41 | New |
| On-Demand Queue | A-08 | 42 | New |
| Quote Management | A-09 | 42 | New |
| Dispute & Return | A-10 | 43 | Enhance |
| Dispute Detail | A-11 | 43 | New |
| Payout Processing | A-12 | 44 | Enhance |
| Seller Directory | A-13 | 39 | Enhance |
| QC Dashboard | A-14 | 41 | Enhance |
| SLA Monitoring | A-15 | 54 (P2) | New |
| Penalties | A-16 | 55 (P2) | New |
| Analytics | A-17 | 52 (P2) | New |
| Settings | A-18 | 56 (P2) | New |
| Tenders | A-19 | 61 (P3) | New |
| Trust Tiers | A-20 | 61 (P3) | New |
| Reports | A-21 | 62 (P3) | New |

### Auth Pages (AU-01 to AU-04)
| Page | PRD ID | Branch | Status |
|------|--------|--------|--------|
| Login | AU-01 | Existing | Built |
| Register | AU-02 | Existing | Built |
| Forgot Password | AU-03 | 24 | New |
| Reset Password | AU-04 | 24 | New |

---

## Summary

| Phase | Branches | Total | Complexity Distribution |
|-------|----------|-------|------------------------|
| Phase 1 | 19-45 | 27 | 5S, 14M, 8L |
| Phase 2 | 46-56 | 11 | 4S, 4M, 3L |
| Phase 3 | 57-62 | 6 | 0S, 3M, 3L |
| **Total** | **19-62** | **44** | **9S, 21M, 14L** |

All 53 PRD pages (B-01 to B-20, S-01 to S-13, A-01 to A-21, AU-01 to AU-04) are covered.
All PRD API endpoints across Phases 1-3 are accounted for.
No duplication with existing branches 1-18.
