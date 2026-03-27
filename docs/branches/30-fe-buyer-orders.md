# Branch 30: `feature/fe-buyer-orders` -- Enhanced Buyer Order Pages

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Rebuilt the buyer orders list page and order detail page from basic inline implementations into a fully componentized, feature-rich experience. Extracted all visual sections into dedicated, reusable components under `components/order/`. Added tab-based filtering, real-time socket updates, status timelines, shipping info, and context-aware order actions.

## New Components (`components/order/`)

| Component | File | Purpose |
|-----------|------|---------|
| `OrderTabs` | `order-tabs.tsx` | Tab navigation (All / Active / Completed / Cancelled) with per-tab order counts; groups statuses into logical categories |
| `OrderCard` | `order-card.tsx` | Compact order summary card for list view: order number, formatted date, StatusBadge, item count, total (formatMoney), first item thumbnail/name preview |
| `OrderTimeline` | `order-timeline.tsx` | Specialized timeline mapping order status progression to the generic Timeline component, with timestamps for key events |
| `ShippingInfo` | `shipping-info.tsx` | Tracking number, carrier name, estimated delivery date, and external tracking link; only visible for DISPATCHED+ orders |
| `OrderActions` | `order-actions.tsx` | Context-aware action buttons: Cancel Order (with ConfirmationDialog) pre-dispatch, Request Return + Rate & Review for delivered orders |

## Updated Pages

### `app/(buyer)/orders/page.tsx` -- Orders List
- Replaced manual `api.get()` + `useState` with `useOrders()` React Query hook
- Added `OrderTabs` component for tab-based filtering (All / Active / Completed / Cancelled)
- Replaced inline order rendering with `OrderCard` components
- Added client-side pagination with Previous/Next controls
- Added loading skeleton state with fake tab bar and card placeholders
- Added per-tab empty states with contextual messaging

### `app/(buyer)/orders/[orderNumber]/page.tsx` -- Order Detail
- Replaced manual `api.get()` + `useState` with `useOrder(orderNumber)` React Query hook
- Added breadcrumb navigation using shadcn Breadcrumb (Home > Orders > {orderNumber})
- Replaced inline timeline with `OrderTimeline` component (uses generic Timeline from feedback)
- Added `ShippingInfo` component for dispatched+ orders
- Added `OrderActions` component for cancel/return/review actions
- Added Socket.io live updates via `useSocketEvent('order:status_updated', ...)` to auto-refetch on status changes
- Uses `formatMoney()` and `formatDate()` utilities throughout
- Added loading skeleton and 404 fallback states

## Key Design Decisions

- **Client-side tab filtering**: All orders are fetched once; tabs filter in-memory for instant switching without API round-trips
- **Socket.io integration**: The detail page listens for `order:status_updated` events and invalidates the React Query cache, triggering an automatic refetch for real-time updates
- **Sonner toasts**: Uses the existing `sonner` toast library (not shadcn toast) consistent with the rest of the app
- **Reusable timeline**: `OrderTimeline` wraps the generic `Timeline` component from `feedback/timeline.tsx`, mapping order-specific statuses and timestamps
- **Carrier tracking**: Placeholder URLs for major Indian carriers (India Post, DTDC, Blue Dart, Delhivery, Ekart)

## Key Files

- `apps/web/src/components/order/order-tabs.tsx`
- `apps/web/src/components/order/order-card.tsx`
- `apps/web/src/components/order/order-timeline.tsx`
- `apps/web/src/components/order/shipping-info.tsx`
- `apps/web/src/components/order/order-actions.tsx`
- `apps/web/src/app/(buyer)/orders/page.tsx`
- `apps/web/src/app/(buyer)/orders/[orderNumber]/page.tsx`
- `apps/web/tests/e2e/buyer-orders.spec.ts`
