# Changelog

All notable changes to the Crochet Hub project, organized by feature branch.

## Branch 59: `fix/product-form` -- Fix Product Form & Add Product Preview

**Date:** 2026-03-27 | **Commits:** 1

- Replaced raw `fetch()` with `useCategories()` hook in both new and edit product pages for consistency and React Query caching
- Fixed media not being passed to ProductForm on edit, so the Images tab now works correctly
- Added missing `GET /seller/products/:id` API route and `getSellerProduct()` service method
- Changed price input from confusing paise entry to user-friendly rupees (INR) with automatic paise conversion on save
- Added `stockQuantity` default of 0 for READY_STOCK products in the form save handler
- Fixed categories loading race condition on edit page -- form now waits for both product and categories
- Created product preview page at `/seller/products/[id]/preview` showing buyer-facing view with images, price, description, and metadata
- Added Preview buttons to both the product list page (actions column) and the product form (edit mode)

**Key files:** `apps/web/src/components/seller/product-form.tsx`, `apps/web/src/app/seller/products/[id]/preview/page.tsx`, `apps/api/src/routes/seller.routes.ts`

---

## Branch 48: `feature/sla-monitoring` -- SLA Monitoring, Auto-Penalties & Seller Performance

**Date:** 2026-03-27 | **Commits:** 1

- Created SLA monitoring service with paginated breach listing, dashboard summary (total breaches, by-type breakdown, top 10 offending sellers), record creation, and auto-penalty generation (>3 breaches in 30 days triggers $5 penalty)
- Created penalty management service with admin CRUD (list, create, waive) and seller-scoped penalty listing, supporting QC_FAILURE, SLA_BREACH, RETURN_LIABILITY, OTHER types
- Created seller performance metrics service that calculates and upserts avgRating (x100), totalOrders, qcPassRate (basis points), onTimeDeliveryRate, returnRate, disputeRate, violationsCount
- Added 6 admin API routes: SLA dashboard, SLA breaches, penalties list/create/waive, seller performance rankings
- Added 3 seller API routes: own performance metrics, own penalties, own SLA breaches
- Added frontend API functions and React Query hooks for all new endpoints
- Updated query-keys.ts with SLA, penalties, and performance keys under admin and seller namespaces
- Added Playwright e2e tests covering SLA dashboard, breaches, penalties CRUD, and seller performance

**Key files:** `apps/api/src/modules/sla/sla.service.ts`, `apps/api/src/modules/penalties/penalty.service.ts`, `apps/api/src/modules/performance/performance.service.ts`

---

## Branch 51: `feature/notification-center` -- Notification Center (Backend + Frontend)

**Date:** 2026-03-27 | **Commits:** 1

- Added `Notification` Prisma model with JSONB data field, readAt timestamp, and indexes on (userId, readAt) and createdAt
- Created `NotificationPersistenceService` with createNotification (saves + emits via Socket.io), paginated getNotifications, getUnreadCount, markAsRead, and markAllAsRead
- Added 4 notification API routes: GET list, GET unread-count, POST mark-read, POST read-all -- all auth-protected
- Created frontend API functions, React Query hooks (`useNotifications`, `useUnreadCount`, `useMarkAsRead`, `useMarkAllAsRead`), and query keys
- Created `NotificationBell` component with unread badge, dropdown showing last 5 notifications, mark-all-as-read, Socket.io real-time listener with toast
- Created `/notifications` buyer page with paginated history, type-based icons, read/unread visual state, and empty state
- Added NotificationBell to storefront nav (visible when authenticated)
- Added Playwright e2e tests covering list, unread count, mark-read, mark-all-read, and 401 auth guard

**Key files:** `apps/api/src/modules/notifications/notification-persistence.service.ts`, `apps/api/src/routes/notification.routes.ts`, `apps/web/src/components/layout/notification-bell.tsx`, `apps/web/src/app/(buyer)/notifications/page.tsx`

---

## Branch 52: `feature/fe-charts` -- Recharts Chart Dashboards (Frontend)

**Date:** 2026-03-27 | **Commits:** 1

- Added `recharts` dependency for composable React charting
- Created 3 reusable chart wrapper components: `LineChartCard`, `BarChartCard`, `DonutChartCard` with ResponsiveContainer, tooltips, and configurable props
- Created Seller Performance Dashboard (`/seller/performance`) with KPI cards (orders, rating, QC pass rate, on-time delivery), revenue trend line chart, orders-by-status bar chart, and rating distribution donut
- Created Admin Analytics & Reporting page (`/admin/analytics`) with date range picker, period selector (daily/weekly/monthly), KPI summary cards, and 4 chart panels (revenue over time, orders by status, top sellers, top categories)
- Enhanced Seller Payout Detail (`/seller/payouts/[id]`) with donut chart showing Commission vs Net Payout vs Adjustments breakdown
- All charts responsive, themed with CSS variables, and include loading skeletons

**Key files:** `apps/web/src/components/charts/`, `apps/web/src/app/seller/performance/page.tsx`, `apps/web/src/app/admin/analytics/page.tsx`

---

## Branch 50: `feature/wishlist` -- Wishlist Feature (Backend + Frontend)

**Date:** 2026-03-27 | **Commits:** 1

- Added `Wishlist` Prisma model with unique constraint on (userId, productId) and user/product relations
- Created `WishlistService` with paginated listing, idempotent add, remove, isWishlisted check, and product IDs lookup
- Added 4 wishlist API routes: GET list, GET ids, POST add (201), DELETE remove (204) -- all auth-protected
- Updated catalog `getProductBySlug` to return `isWishlisted` flag for authenticated users via `optionalAuth`
- Created frontend API functions, React Query hooks (`useWishlist`, `useWishlistIds`, `useAddToWishlist`, `useRemoveFromWishlist`), and query keys
- Created `WishlistButton` component with heart icon toggle, optimistic updates, and login toast for unauthenticated users
- Created `/wishlist` buyer page with ProductCard grid, empty state, and loading skeletons
- Added Playwright e2e tests covering auth guard, add, duplicate idempotency, list, ids, and remove

**Key files:** `apps/api/src/modules/wishlist/wishlist.service.ts`, `apps/api/src/routes/wishlist.routes.ts`, `apps/web/src/components/product/wishlist-button.tsx`, `apps/web/src/app/(buyer)/wishlist/page.tsx`

---

## Branch 47: `feature/bullmq-jobs` -- BullMQ Background Job Queues

**Date:** 2026-03-27 | **Commits:** 1

- Added BullMQ job queue system with shared queue/worker factory (`jobs/queue.ts`) using existing Redis connection, with default retry (3x exponential backoff) and auto-cleanup settings
- Created 4 job processors: SLA breach check (every 15min), quote expiry (hourly), return window expiry (daily midnight), payout generation (manual trigger)
- SLA check detects orders stuck in CONFIRMED (>2 days), IN_PRODUCTION (>7 days), DISPATCHED (>10 days) and creates SlaRecord breach entries
- Quote expiry marks overdue PENDING quotes as EXPIRED and cascades to parent OnDemandRequest when all quotes expire
- Return window expiry moves DELIVERED orders past 7-day window to COMPLETED, marking items as payout-eligible
- Added `POST /api/v1/admin/payouts/generate-cycle` admin route that enqueues payout generation as a background job (falls back to sync when Redis unavailable)
- Updated server startup to initialize job queues when Redis is available, with graceful shutdown on SIGTERM/SIGINT
- Added branch documentation at `docs/branches/47-bullmq-jobs.md`

**Key files:** `apps/api/src/jobs/queue.ts`, `apps/api/src/jobs/index.ts`, `apps/api/src/jobs/sla-check.job.ts`, `apps/api/src/jobs/quote-expiry.job.ts`, `apps/api/src/jobs/return-window-expiry.job.ts`, `apps/api/src/jobs/payout-generation.job.ts`

---

## Branch 49: `feature/analytics-settings-apis` -- Analytics & Platform Settings APIs

**Date:** 2026-03-27 | **Commits:** 1

- Created `AnalyticsService` with revenue (daily/weekly/monthly grouping via raw SQL), order (volume, avg value, status distribution), seller (top by revenue with ratings), and category (top by revenue) analytics methods
- Created `SettingsService` with key-value CRUD using `PlatformSetting` model, auto-seeding of defaults (commissionRate, returnWindowDays, minimumPayoutCents, payoutCycleFrequency, slaThresholds)
- Added `PlatformSetting` Prisma model mapped to `platform_settings` table (id, key unique, value JsonB, updatedAt)
- Added 6 admin routes: GET analytics/revenue, analytics/orders, analytics/sellers, analytics/categories, GET settings, PUT settings
- Added frontend API functions, TypeScript interfaces, React Query hooks, and query keys for all analytics and settings endpoints
- Added Playwright e2e tests covering all analytics endpoints and settings CRUD (read, update, persistence, upsert)
- Added branch documentation at `docs/branches/49-analytics-apis.md`

**Key files:** `apps/api/src/modules/analytics/analytics.service.ts`, `apps/api/src/modules/settings/settings.service.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/routes/admin.routes.ts`, `apps/web/tests/e2e/analytics-settings.spec.ts`

---

## Branch 46: `feature/redis-integration` -- Redis Caching Layer

**Date:** 2026-03-27 | **Commits:** 1

- Added Redis client singleton (`ioredis`) with exponential backoff retry strategy and graceful degradation when Redis is unavailable
- Created `cacheMiddleware(ttlSeconds)` Express middleware with `X-Cache` header (HIT/MISS/SKIP), URL-based cache keys, and fire-and-forget writes
- Applied cache middleware to catalog routes: products list (30s), product detail (60s), categories (5min), category products (30s)
- Added `REDIS_URL` to Zod environment schema (optional, defaults to `redis://localhost:6379`)
- Updated `.env.example` with `REDIS_URL`
- Added branch documentation at `docs/branches/46-redis-integration.md`

**Key files:** `apps/api/src/config/redis.ts`, `apps/api/src/middleware/cache.ts`, `apps/api/src/routes/catalog.routes.ts`, `apps/api/src/config/env.ts`

---

## Branch 44: `feature/fe-admin-payouts` -- Admin Payout Processing

**Date:** 2026-03-26 | **Commits:** 1

- Created `PayoutCycleSelector` component with date range picker and "Generate Payouts" button using `useGeneratePayout()` mutation, validation, and loading state
- Created `BulkApproveDialog` component for bulk approving selected draft payouts with sequential API calls, count/total display, and success/failure toast reporting
- Created admin payouts list page (`/admin/payouts`) with PayoutCycleSelector, DataTable (Payout #, Seller, Period, Gross, Commission, Net, Status, Actions), status filter tabs (All/Draft/Approved/Paid), Approve and Mark Paid actions with payment reference dialog
- Created admin payout detail page (`/admin/payouts/[id]`) with summary card, status details (approved by, paid date, payment reference), line items DataTable, penalties section, and context-sensitive Approve/Mark Paid actions with breadcrumb
- Added `getPayoutDetail(id)` API function, `useAdminPayoutDetail(id)` hook, and `admin.payoutDetail` query key
- Added `DRAFT` status to StatusBadge payout color map
- Added Playwright e2e tests for payouts list, generate cycle, approve payout, mark paid, and validation
- Added branch documentation at `docs/branches/44-fe-admin-payouts.md`

**Key files:** `apps/web/src/components/admin/payout-cycle-selector.tsx`, `apps/web/src/components/admin/bulk-approve-dialog.tsx`, `apps/web/src/app/admin/payouts/`, `apps/web/tests/e2e/admin-payouts.spec.ts`

---

## Branch 40: `feature/fe-admin-products` -- Admin Product Approval

**Date:** 2026-03-26 | **Commits:** 1

- Created `ProductReviewPanel` component with Approve (green confirmation dialog) and Reject (red dialog with required reason textarea) actions, toast notifications on success
- Rebuilt admin products page (`/admin/products`) with tabbed layout: "Pending Approval" tab showing DataTable with Product Name (linked), Seller, Type badge, Price, Submitted Date, and inline Approve/Reject actions; "All Products" tab showing DataTable with all products and their statuses
- Created admin product detail page (`/admin/products/[id]`) with full product preview (name, description, type badge, price, compare-at-price, stock, lead time, materials, dimensions, care instructions), media gallery, seller info sidebar (business name, rating, status), return policy, and ProductReviewPanel for PENDING_APPROVAL products; includes breadcrumb navigation
- Added `getAdminProducts(params?)` and `getAdminProduct(id)` API functions
- Added `useAdminProducts(params?)` and `useAdminProduct(id)` React Query hooks; updated `useApproveProduct()` and `useRejectProduct()` to invalidate `admin.products` cache
- Added `admin.products` and `admin.product` query keys
- Added Playwright e2e tests for pending products list API, approve product, reject product with reason, reject without reason validation
- Added branch documentation at `docs/branches/40-fe-admin-products.md`

**Key files:** `apps/web/src/components/admin/product-review-panel.tsx`, `apps/web/src/app/admin/products/`, `apps/web/src/lib/api/admin.ts`, `apps/web/src/lib/hooks/use-admin.ts`

---

## Branch 39: `feature/fe-admin-sellers` -- Admin Seller Management

**Date:** 2026-03-26 | **Commits:** 1

- Rebuilt admin sellers list page (`/admin/sellers`) with DataTable, sortable columns (Business Name, Applicant Name, Email, Status, Applied Date, Actions), status filter tabs (All/Pending/Approved/Suspended/Rejected), search by business name, row click navigation, and loading skeletons
- Created admin seller detail page (`/admin/sellers/[id]`) with breadcrumb navigation, full business profile, masked bank details, portfolio images grid, commission rate display, and approval history timeline
- Created `SellerReviewActions` component with Approve (green, confirmation dialog), Reject (red, reason textarea dialog), and Suspend (yellow, reason textarea dialog) buttons using `useApproveSeller()`, `useRejectSeller()`, and `useSuspendSeller()` mutations with toast feedback
- Added Playwright e2e tests for sellers list display, status tab filtering, detail page navigation, approve/reject button visibility, and rejection dialog with reason textarea
- Added branch documentation at `docs/branches/39-fe-admin-sellers.md`

**Key files:** `apps/web/src/app/admin/sellers/`, `apps/web/src/components/admin/seller-review-actions.tsx`, `apps/web/tests/e2e/admin-sellers.spec.ts`

---

## Branch 38: `feature/fe-admin-dashboard` -- Enhanced Admin Dashboard

**Date:** 2026-03-26 | **Commits:** 1

- Rebuilt admin dashboard page (`/admin`) using `KpiCardGrid` with 5 KPI cards: Orders Today, Revenue This Month, Active Sellers, Active Products, Open Disputes
- Created `PendingCountBadges` component showing linked count cards for items needing attention (Pending Sellers, Pending Products, Open Disputes, Pending Returns, QC Queue)
- Created `QuickActionShortcuts` component with icon button grid linking to Review Sellers, Approve Products, QC Dashboard, Process Payouts, and View Audit Logs
- Created `ActivityFeed` component displaying the 10 most recent audit log entries with action, entity type, user name, and relative timestamp
- Replaced raw `useState`/`useEffect` data fetching with `useAdminDashboard()` and `useAdminAuditLogs()` React Query hooks
- Added loading skeletons for all dashboard sections
- Added branch documentation at `docs/branches/38-fe-admin-dashboard-full.md`

**Key files:** `apps/web/src/components/admin/pending-count-badges.tsx`, `apps/web/src/components/admin/quick-action-shortcuts.tsx`, `apps/web/src/components/admin/activity-feed.tsx`, `apps/web/src/app/admin/page.tsx`

---

## Branch 37: `feature/fe-seller-orders-payouts` -- Seller Orders, Payouts, Profile & Ratings

**Date:** 2026-03-26 | **Commits:** 1

- Created seller orders list page (`/seller/orders`) with DataTable, tab-based status filtering (All/Active/Completed/Cancelled), Socket.io live updates via `seller:order_allocated` event, loading skeletons, and empty state
- Created seller order detail page (`/seller/orders/[id]`) with breadcrumb navigation, QC status indicator, buyer requirements section, and read-only view
- Created seller payouts list page (`/seller/payouts`) with KPI summary cards (Current Cycle Earnings, Commission Rate, Last Payout) and DataTable of payout history
- Created seller payout detail page (`/seller/payouts/[id]`) with summary card (gross, commission, adjustments, net), line items DataTable, and payment reference display
- Created seller profile page (`/seller/profile`) with tabbed editor: Business Info form, Bank Details form, Portfolio placeholder
- Created seller ratings page (`/seller/ratings`) with average rating summary and individual rating cards showing buyer name, product, stars, review text, and date
- Added `getSellerOrder(id)` and `updateBankDetails(data)` API functions
- Added `useSellerProfile()`, `useUpdateSellerProfile()`, `useUpdateBankDetails()`, and `useSellerOrder(id)` React Query hooks
- Added Playwright e2e tests for seller orders list, payouts list, payout detail, and ratings APIs
- Added branch documentation at `docs/branches/37-fe-seller-orders-payouts.md`

**Key files:** `apps/web/src/app/seller/orders/`, `apps/web/src/app/seller/payouts/`, `apps/web/src/app/seller/profile/`, `apps/web/src/app/seller/ratings/`, `apps/web/src/lib/api/seller.ts`, `apps/web/src/lib/hooks/use-seller.ts`

---

## Branch 36: `feature/fe-seller-dashboard` -- Enhanced Seller Dashboard & Product Management

**Date:** 2026-03-26 | **Commits:** 1

- Created `PendingActionsWidget` component showing draft products count and allocated orders count with navigation links to the relevant pages
- Created `ProductForm` tabbed component (Basic Info, Pricing, Details) with Zod validation, create/edit modes, radio-button product type and return policy selectors, conditional stock/lead-time fields, and dual submit paths (Save Draft / Submit for Approval)
- Enhanced seller dashboard page (`/seller`) with KpiCard grid (Total Orders, Monthly Revenue, Avg Rating, Active Products), PendingActionsWidget, commission rate display, and StatusBadge in recent orders table
- Rebuilt seller products page (`/seller/products`) using DataTable with sortable columns (Name, Type badge, Status badge, Price, Stock, Actions), search filtering, and inline Edit/Submit/Delete action buttons
- Updated new product page (`/seller/products/new`) with breadcrumb navigation and ProductForm in create mode
- Created edit product page (`/seller/products/[id]/edit`) with breadcrumb navigation, product pre-loading via `useSellerProduct()`, and ProductForm in edit mode
- Added `getSellerProduct(id)` API function, `useSellerProduct()` React Query hook, and `seller.product(id)` query key
- Updated `CreateProductData` and `UpdateProductData` interfaces with new fields (compareAtPriceInCents, leadTimeDays, returnPolicy, materials, dimensions, careInstructions)
- Added Playwright e2e tests for dashboard KPI display, products list, create product, and update product flows
- Added branch documentation at `docs/branches/36-fe-seller-dashboard-full.md`

**Key files:** `apps/web/src/components/seller/`, `apps/web/src/app/seller/`, `apps/web/src/lib/api/seller.ts`, `apps/web/src/lib/hooks/use-seller.ts`

---

## Branch 35: `feature/fe-seller-onboarding` -- Seller Registration Wizard

**Date:** 2026-03-26 | **Commits:** 1

- Created `RegistrationWizard` component: 5-step card-based wizard (Business Info, Contact & Address, Categories, Bank Details, Agreement) with Zod validation per step, visual step indicator with progress dots, and success confirmation state
- Created seller register page (`/seller/register`) with auth guards (BUYER-only access), breadcrumb navigation, and redirect logic for unauthenticated/existing-seller/non-buyer users
- Added Playwright e2e tests for seller registration API (valid buyer, non-buyer rejection, duplicate rejection)
- Added branch documentation at `docs/branches/35-fe-seller-onboarding.md`

**Key files:** `apps/web/src/components/seller/registration-wizard.tsx`, `apps/web/src/app/seller/register/page.tsx`, `apps/web/tests/e2e/seller-registration.spec.ts`

---

## Branch 33: `feature/fe-buyer-profile` -- Buyer Profile & Account Pages

**Date:** 2026-03-26 | **Commits:** 1

- Created `PersonalInfoForm` component with edit mode toggle, name/phone editing, read-only email, Zod validation, and `useUpdateProfile()` mutation with toast feedback
- Created `AddressManager` component with address list (label, full address, "Default" badge), Add/Edit dialog with Zod-validated form, Delete confirmation dialog, and Set as Default action
- Created `PasswordChangeForm` component with current/new/confirm password fields, Zod validation (min 8 chars, match), direct `api.put('/profile/password')` call, form reset on success
- Created buyer profile page (`/profile`) with tabbed layout: Personal Info, Addresses, Change Password
- Added branch documentation at `docs/branches/33-fe-buyer-profile.md`

**Key files:** `apps/web/src/components/profile/`, `apps/web/src/app/(buyer)/profile/page.tsx`

---

## Branch 32: `feature/fe-returns-ratings` -- Returns & Ratings Buyer Flow

**Date:** 2026-03-26 | **Commits:** 1

- Created `ReturnForm` component with order item selector, reason dropdown (DEFECTIVE, WRONG_ITEM, TRANSIT_DAMAGE, PREFERENCE_CHANGE, OTHER), description textarea, evidence file input, policy eligibility callout, and Zod validation
- Created `ReturnCard` component showing return number, status badge, reason, and date with link to detail page
- Created `StarRatingInput` -- interactive 5-star selector with hover preview, click-to-select, and keyboard navigation (accessible `role="radiogroup"`)
- Created `ReviewForm` combining StarRatingInput + textarea, submits via `useSubmitRating()` hook, shows inline success state
- Created returns list page (`/returns`) with loading skeletons, empty state, and "New Return" button
- Created new return page (`/returns/new`) reading `orderId`/`orderItemId` from URL search params with breadcrumb navigation
- Created return detail page (`/returns/[returnNumber]`) with status badge, dynamic progress timeline, return details, evidence display, and resolution info (refund amount, admin notes)
- Created rate order page (`/orders/[orderNumber]/rate`) showing unrated delivered items with ReviewForm for each
- Added Playwright e2e tests for submit return (valid + invalid), list returns, return detail, submit rating, and duplicate rating rejection
- Added branch documentation at `docs/branches/32-fe-returns-ratings.md`

**Key files:** `apps/web/src/components/returns/`, `apps/web/src/components/ratings/`, `apps/web/src/app/(buyer)/returns/`, `apps/web/src/app/(buyer)/orders/[orderNumber]/rate/page.tsx`

---

## Branch 30: `feature/fe-buyer-orders` — Enhanced Buyer Order Pages

**Date:** 2026-03-26 | **Commits:** 1

- Created `OrderTabs` component with tab navigation (All / Active / Completed / Cancelled) and per-tab order counts
- Created `OrderCard` compact summary card with order number, formatted date, StatusBadge, item count, total (formatMoney), and first item thumbnail/name preview
- Created `OrderTimeline` mapping order status progression to the generic Timeline component with timestamps for key events (placed, shipped, delivered)
- Created `ShippingInfo` component showing tracking number, carrier, estimated delivery, and external tracking link (dispatched+ only)
- Created `OrderActions` with context-aware buttons: Cancel Order (with ConfirmationDialog) pre-dispatch, Request Return and Rate & Review for delivered orders
- Rebuilt orders list page with React Query `useOrders()` hook, tab filtering, client-side pagination, loading skeletons, and per-tab empty states
- Rebuilt order detail page with React Query `useOrder()` hook, breadcrumb navigation, OrderTimeline, ShippingInfo, OrderActions, price summary, and Socket.io live updates via `useSocketEvent('order:status_updated', ...)`
- Added Playwright e2e tests for orders list, order detail, cancel order, and cancel rejection

**Key files:** `apps/web/src/components/order/`, `apps/web/src/app/(buyer)/orders/page.tsx`, `apps/web/src/app/(buyer)/orders/[orderNumber]/page.tsx`, `apps/web/tests/e2e/buyer-orders.spec.ts`

---

## Branch 31: `feature/fe-on-demand-buyer` — On-Demand / Custom Order Buyer Flow

**Date:** 2026-03-26 | **Commits:** 1

- Created `RequestFormWizard` component: 3-step form (Details, Budget & Timeline, Review) with Zod validation per step, category select from `useCategories()`, budget inputs in INR (converted to cents), and redirect on success
- Created `RequestCard` component: compact list card with request number, `StatusBadge`, category, budget range (`formatMoney`), and date; links to detail page
- Created `QuoteCard` component: displays seller quote price, estimated days, description, expiry countdown, "Accept & Pay" button (`useAcceptQuote`), "Decline" with `ConfirmationDialog` (`useRejectQuote`), and status badge for resolved quotes
- Built `/on-demand` list page with `useOnDemandRequests()`, status filter tabs (All/Submitted/Quoted/Accepted/Completed), loading skeletons, and empty state with CTA
- Built `/on-demand/new` page with breadcrumb navigation and `RequestFormWizard`
- Built `/on-demand/[id]` detail page with full request info, breadcrumbs, `QuoteCard` list for QUOTED status, and order link for ACCEPTED status
- Added Playwright e2e tests: submit request, list requests, request detail, auth guard, and quote accept/reject stubs

**Key files:** `apps/web/src/components/on-demand/`, `apps/web/src/app/(buyer)/on-demand/`, `apps/web/tests/e2e/on-demand.spec.ts`

---

## Branch 29: `feature/fe-cart-checkout` — Enhanced Cart, Checkout & Order Confirmation

**Date:** 2026-03-26 | **Commits:** 1

- Rebuilt cart page using `useCart()` React Query hook with loading skeleton, empty state ("Start Shopping" CTA), and error handling
- Created `CartItemList` component: items grouped by seller, product type badges, quantity controls, line totals, and remove buttons using `useUpdateCartItem()` and `useRemoveCartItem()` hooks
- Created `QuantityControl` compact +/- component with min 1 and max from stockQuantity
- Created `CartSummary` sticky sidebar with subtotal, item count, free shipping, and "Proceed to Checkout" button
- Created `AddressSelector` with radio group from `useAddresses()`, default pre-selected, and Dialog-based "Add New Address" form using `useAddAddress()`
- Created `OrderSummary` with readonly item list, thumbnails, pricing breakdown, and adaptive return policy acknowledgment checkbox
- Created `PaymentSection` mock payment with dev-mode disclaimer and `useCreateOrder()` integration
- Rebuilt checkout page with multi-step layout (Address > Review > Payment), back-to-cart link, and redirect to confirmation on success
- Created order confirmation page (`/orders/[orderNumber]/confirmation`) with CSS checkmark animation, order details, estimated delivery, and "Track Order" / "Continue Shopping" CTAs
- Added Playwright e2e tests for cart CRUD operations and checkout flow
- All prices use `formatMoney()` utility for consistent INR formatting

**Key files:** `apps/web/src/components/cart/`, `apps/web/src/components/checkout/`, `apps/web/src/app/(buyer)/cart/page.tsx`, `apps/web/src/app/(buyer)/checkout/page.tsx`, `apps/web/src/app/(buyer)/orders/[orderNumber]/confirmation/page.tsx`

---

## Branch 28: `feature/fe-product-detail` — Enhanced Product Detail Page

**Date:** 2026-03-26 | **Commits:** 1

- Rebuilt product detail page as a `'use client'` page using `useProduct(slug)` React Query hook (replacing server-side fetch)
- Created `ProductGallery` component with thumbnail switching, CSS hover-zoom, and Dialog-based lightbox
- Created `ProductTypeBadge` with color-coded labels: emerald (Ready Stock), amber (Made to Order), violet (On Demand)
- Created `SellerAttribution` component with avatar initial, business name link, and optional star rating
- Created `LeadTimeIndicator` showing contextual shipping timeline per product type
- Created `ReturnPolicyCallout` using Alert component with product-type-aware return policy messaging
- Created `ReviewList` with average rating summary, star display, reviewer names, dates, and "No reviews yet" empty state
- Created `AddToCartSection` with quantity selector, `useAddToCart()` hook, toast notifications, and out-of-stock handling
- Added skeleton loading state and 404 fallback with friendly message
- Added breadcrumb navigation (Home > Products > Category > Product Name)
- Uses `formatMoney()` utility for consistent price formatting

**Key files:** `apps/web/src/components/product/`, `apps/web/src/app/(storefront)/products/[slug]/page.tsx`

---

## Branch 27: `feature/fe-catalog-enhanced` — Enhanced Product Catalog

**Date:** 2026-03-26 | **Commits:** 1

- Created `useUrlFilters()` custom hook for URL-based filter state management with `setFilter`, `removeFilter`, `clearFilters` helpers
- Created `ProductFilterSidebar` with category checkboxes (from `useCategories()`), product type checkboxes (READY_STOCK, MADE_TO_ORDER, ON_DEMAND), price range min/max inputs (INR to/from cents), sort dropdown, and "Clear All" button
- Responsive filter panel: sticky sidebar on desktop (lg+), Sheet slide-out on mobile
- Created `ActiveFilterChips` showing removable badge chips for each active filter with "Clear all" link
- Created `ProductGrid` with responsive columns (1/2/3/4), skeleton loading state, and empty state
- Created `ProductCard` with image (gradient fallback + type icon), product type badge (color-coded), seller name, `formatMoney()` price, compare-at strikethrough, and hover shadow/scale effect
- Converted products page from SSR to `'use client'` using React Query `useProducts()` hook with URL-synced filters
- Added proper pagination using the shadcn Pagination component with ellipsis for large page counts
- Created category landing page at `/categories/[slug]` using `useCategoryProducts()` hook with sort and pagination
- Added Playwright e2e tests for filtered products API, paginated products, and category products endpoint

**Key files:** `apps/web/src/lib/hooks/use-url-filters.ts`, `apps/web/src/components/catalog/`, `apps/web/src/components/product/product-card.tsx`, `apps/web/src/app/(storefront)/products/page.tsx`, `apps/web/src/app/(storefront)/categories/[slug]/page.tsx`

---

## Branch 26: `feature/fe-storefront-home` — Enhanced Storefront Homepage

**Date:** 2026-03-26 | **Commits:** 1

- Created `HeroBanner` component with warm coral/rose gradient, headline, and dual CTAs (Shop Now + Custom Order)
- Created `CategoryCards` component fetching categories via `useCategories()` hook, displayed in a responsive 2/3/4-column grid using `Card` UI component
- Created `FeaturedProducts` component with horizontal `ScrollArea` showing up to 8 products with name, `formatMoney` price, product type badge, and seller name
- Created `HowItWorks` 3-step visual guide (Browse/Order/Receive) using Lucide icons (Search, ShoppingCart, Package)
- Created `SellerCTA` call-to-action section with benefits list and registration link
- Refactored homepage (`app/(storefront)/page.tsx`) from monolithic server component to a clean shell composing five client components
- All visuals use CSS gradients, Tailwind, Lucide icons, and emoji — no external image dependencies

**Key files:** `apps/web/src/components/storefront/hero-banner.tsx`, `apps/web/src/components/storefront/category-cards.tsx`, `apps/web/src/components/storefront/featured-products.tsx`, `apps/web/src/components/storefront/how-it-works.tsx`, `apps/web/src/components/storefront/seller-cta.tsx`, `apps/web/src/app/(storefront)/page.tsx`

---

## Branch 34: `feature/fe-static-pages` — Static Pages (About + Policies)

**Date:** 2026-03-26 | **Commits:** 1

- Created About Crochet Hub page (`/about`) with hero, mission statement, how-it-works steps, why-us cards, and values section
- Created Policies index page (`/policies`) with Card-based links to four individual policy pages
- Created dynamic policy page (`/policies/[slug]`) with `generateStaticParams` for returns, shipping, terms, privacy
- Return policy covers Ready Stock (defect-only), MTO/On-Demand (no preference returns), 7-day window, evidence requirements
- Shipping policy covers centralized fulfillment, QC before dispatch, timelines, tracking
- Terms of service covers platform rules, buyer/seller responsibilities, dispute resolution
- Privacy policy covers data collection, usage, storage, rights
- All pages are SSG static with SEO metadata, semantic HTML, and Tailwind prose styling

**Key files:** `apps/web/src/app/(storefront)/about/page.tsx`, `apps/web/src/app/(storefront)/policies/page.tsx`, `apps/web/src/app/(storefront)/policies/[slug]/page.tsx`

---

## Branch 25: `feature/backend-gaps` — Backend Gaps

**Date:** 2026-03-26 | **Commits:** 1

- Added `compression` middleware to Express app for gzip/deflate response compression (requires `pnpm add compression @types/compression`)
- Added `OnDemandService.assignSeller()` method to assign an approved seller to an on-demand request in UNDER_REVIEW or QUOTED status, with audit logging
- Added `POST /api/v1/admin/on-demand-requests/:id/assign-seller` admin route
- Added `ReturnService.initiateRefund()` method to move an approved return to REFUND_INITIATED status with a refund reference, with audit logging
- Added `POST /api/v1/admin/returns/:id/initiate-refund` admin route
- Created Prisma Client Extension for soft-delete on User and Product models (auto-filters `deletedAt: null` on find queries)
- Applied soft-delete extension in Prisma client setup (`config/database.ts`)

**Key files:** `apps/api/src/app.ts`, `apps/api/src/middleware/soft-delete.ts`, `apps/api/src/modules/on-demand/on-demand.service.ts`, `apps/api/src/modules/returns/return.service.ts`, `apps/api/src/routes/admin.routes.ts`, `apps/api/src/config/database.ts`

---

## Branch 24: `feature/auth-password-reset` — Forgot / Reset Password

**Date:** 2026-03-26 | **Commits:** 1

- Added `passwordResetToken` and `passwordResetExpiry` fields to User model in Prisma schema (migration required)
- Added `forgotPassword(email)` method to AuthService: generates crypto-random token, stores SHA-256 hash with 1h expiry, logs plain token in dev mode
- Added `resetPassword(token, newPassword)` method: validates hashed token + expiry, updates password (bcrypt), revokes all refresh tokens
- Added `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` routes with strict rate limiting (3/hour/IP)
- Used existing `forgotPasswordSchema` and `resetPasswordSchema` from `@crochet-hub/shared`
- Created `/forgot-password` frontend page with email form and generic success message (no user existence leakage)
- Created `/reset-password` frontend page with token from URL params, new password + confirm form, redirect to login on success
- Added "Forgot password?" link to login page
- Added `forgotPassword()` and `resetPassword()` API client functions and React Query hooks
- Created Playwright E2E tests for forgot-password and reset-password endpoints

**Key files:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/routes/auth.routes.ts`, `apps/web/src/app/forgot-password/page.tsx`, `apps/web/src/app/reset-password/page.tsx`, `apps/web/tests/e2e/password-reset.spec.ts`

---

## Branch 23: `feature/fe-reusable-components` — Reusable Frontend Components

**Date:** 2026-03-26 | **Commits:** 1

- Created `DataTable` generic component with @tanstack/react-table (sorting, filtering, pagination) and `DataTableColumnHeader`
- Created `StatusBadge` component mapping status strings to colored badges for 6 entity types (order, seller, product, return, dispute, payout)
- Created `EmptyState` component for no-data placeholders with icon, title, description, optional action
- Created `Timeline` component for vertical step-by-step progression (completed/current/upcoming)
- Created `KpiCard` and `KpiCardGrid` dashboard metric components with trend indicators
- Created `ConfirmationDialog` wrapper around AlertDialog for confirm-before-action patterns
- Created `PageHeader` layout component with title, description, actions, breadcrumb support
- Created format utilities: `formatMoney`, `formatDate`, `formatDateTime`, `formatRelativeTime`, `getStatusLabel`

**Key files:** `apps/web/src/components/data-table/`, `apps/web/src/components/feedback/`, `apps/web/src/components/dashboard/`, `apps/web/src/components/layout/page-header.tsx`, `apps/web/src/lib/utils/format.ts`

---

## Branch 22: `feature/fe-socket-provider` — Socket.io Client Provider

**Date:** 2026-03-26 | **Commits:** 1

- Created `SocketProvider` context provider that connects Socket.io when authenticated, disconnects on logout, passes JWT via `auth: { token }` handshake
- Created `useSocket()` hook returning the socket instance (or null) and `useSocketEvent(event, callback)` hook with auto-cleanup
- Created `SocketQueryInvalidator` component that listens to 10 socket events and invalidates React Query caches with toast notifications via sonner
- Integrated into `Providers.tsx` wrapping children inside `QueryClientProvider`

**Key files:** `apps/web/src/lib/socket/socket-provider.tsx`, `apps/web/src/lib/socket/use-socket.ts`, `apps/web/src/lib/socket/use-socket-event.ts`, `apps/web/src/lib/socket/socket-query-invalidator.tsx`, `apps/web/src/components/providers.tsx`

---

## Branch 21: `feature/fe-auth-middleware` — Next.js Auth Middleware + Route Protection

**Date:** 2026-03-26 | **Commits:** 1

- Created Next.js edge middleware (`src/middleware.ts`) that reads `accessToken` from cookies and protects routes by auth state and role
- Protected route patterns: `/cart`, `/checkout`, `/orders/*`, `/on-demand/*`, `/returns/*`, `/profile/*` (auth required), `/seller/*` (SELLER role), `/admin/*` (ADMIN role)
- Auth pages (`/login`, `/register`) redirect authenticated users to their role-appropriate dashboard
- JWT payload decoded via base64 (no signature verification — API handles that)
- Created client-side `AuthGuard` component (`lib/utils/auth-guard.tsx`) using Zustand auth store with role checking and configurable fallback UI
- Updated auth store (`lib/stores/auth-store.ts`) to sync accessToken to a cookie on `setAuth`/`logout`/`loadFromStorage` so edge middleware can read it

**Key files:** `apps/web/src/middleware.ts`, `apps/web/src/lib/utils/auth-guard.tsx`, `apps/web/src/lib/stores/auth-store.ts`

---

## Branch 20: `feature/fe-api-layer` — API Client Modules + React Query Hooks

**Date:** 2026-03-27 | **Commits:** 1

- Created 12 domain-specific API client modules (`lib/api/auth.ts` through `lib/api/admin.ts`) covering all backend endpoints
- Created centralized query key factory (`lib/api/query-keys.ts`) with namespaced keys for all domains
- Created 11 React Query hook files (`lib/hooks/use-auth.ts` through `lib/hooks/use-admin.ts`) with typed queries and mutations
- Upgraded Axios interceptor with silent token refresh on 401 (promise queue prevents concurrent refreshes)
- All mutations invalidate related queries on success
- Auth mutations sync to Zustand auth store; cart mutations sync to Zustand cart store
- TypeScript compiles with zero errors

**Key files:** `apps/web/src/lib/api/*.ts` (13 files), `apps/web/src/lib/hooks/*.ts` (11 files)

---

## Branch 19: `feature/fe-shadcn-components` — UI Component Library Completion

**Date:** 2026-03-27 | **Commits:** 1

- Installed 13 new npm packages: Radix UI primitives (accordion, alert-dialog, aspect-ratio, hover-card, progress, radio-group, scroll-area, slider, switch), @tanstack/react-table, cmdk, date-fns, react-day-picker v9
- Created 28 shadcn/ui components: table, textarea, skeleton, separator, switch, progress, scroll-area, select, checkbox, radio-group, slider, calendar, command, alert, dialog, alert-dialog, sheet, popover, tooltip, dropdown-menu, hover-card, tabs, accordion, avatar, aspect-ratio, pagination, breadcrumb, toast
- All components use forwardRef + displayName + cn() utility
- Calendar uses react-day-picker v9 API (Chevron component)
- Toast re-exports Sonner (project's existing toast system)
- TypeScript compiles with zero errors

**Key files:** `apps/web/src/components/ui/*.tsx` (28 new files), `apps/web/package.json`

---

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
