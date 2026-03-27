# Branch 41: `feature/fe-admin-orders-warehouse` -- Admin Orders + Warehouse/QC

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Admin-facing order management and warehouse/QC dashboard pages with supporting components. All pages use `'use client'` components, React Query hooks from `use-admin.ts`, and reusable components (DataTable, StatusBadge, Timeline, ConfirmationDialog).

## New Components

| Component | File | Purpose |
|-----------|------|---------|
| `FulfillmentTimeline` | `components/admin/fulfillment-timeline.tsx` | Maps warehouse item status through the fulfillment flow using Timeline component. Steps: Awaiting Arrival -> Received -> QC Pending -> QC Passed/Failed -> Packed -> Dispatched. Shows timestamps per step. |
| `QCChecklistForm` | `components/admin/qc-checklist-form.tsx` | Crochet-specific QC inspection form with 6 checkboxes (loose ends, finishing, dimensions, color, stitch, packaging), pass/fail radio, defect notes on fail. Uses `useSubmitQC()`. |
| `DispatchForm` | `components/admin/dispatch-form.tsx` | Tracking number + shipping carrier (India Post, DTDC, Blue Dart, Delhivery, Other) form. Uses `useDispatchItem()`. |
| `OrderStatusAdvance` | `components/admin/order-status-advance.tsx` | Shows current status, dropdown of valid transitions, ConfirmationDialog before advancing. Uses `useUpdateOrderStatus()`. |

## Updated Components

| Component | File | Change |
|-----------|------|--------|
| `StatusBadge` | `components/feedback/status-badge.tsx` | Added `warehouse` color map (AWAITING_ARRIVAL, RECEIVED, QC_PENDING, QC_PASSED, QC_FAILED, PACKED, DISPATCHED) and `'warehouse'` to `StatusType` union. |

## New / Updated Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin/orders` | `app/admin/orders/page.tsx` | **Updated**: DataTable with columns (Order Number, Buyer, Status, Total, Date, Items, Actions), status filter tabs, search by order number, click-through to detail. Replaced inline card layout. |
| `/admin/orders/[orderNumber]` | `app/admin/orders/[orderNumber]/page.tsx` | **New**: Full order detail -- order info header, FulfillmentTimeline, line items table, shipping address, payment info, OrderStatusAdvance actions, notes section. |
| `/admin/warehouse` | `app/admin/warehouse/page.tsx` | **Updated**: DataTable with columns (Order Number, Product, Seller, Status, Received Date, Actions), status filter tabs (7 statuses), context-sensitive action buttons per row. Replaced inline card layout. |
| `/admin/warehouse/[id]` | `app/admin/warehouse/[id]/page.tsx` | **New**: Warehouse item detail with fulfillment timeline, item info, QC history, and context-sensitive forms (Mark Received / QCChecklistForm / DispatchForm). |

## Hooks Used (from `use-admin.ts`)

| Hook | Purpose |
|------|---------|
| `useAdminOrders(params?)` | Fetch paginated order list |
| `useAdminOrder(orderNumber)` | Fetch single order detail |
| `useUpdateOrderStatus()` | Mutation to advance order status |
| `useAdminWarehouse(params?)` | Fetch warehouse items list |
| `useReceiveWarehouseItem()` | Mutation to mark item received |
| `useSubmitQC()` | Mutation to submit QC results |
| `useDispatchItem()` | Mutation to dispatch with tracking info |

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/orders` | List orders with optional status filter |
| GET | `/admin/orders/:orderNumber` | Get single order detail |
| POST | `/admin/orders/:orderNumber/update-status` | Advance order status |
| GET | `/admin/warehouse` | List warehouse items with optional status filter |
| POST | `/admin/warehouse/:id/receive` | Mark item as received |
| POST | `/admin/warehouse/:id/qc` | Submit QC pass/fail with checklist |
| POST | `/admin/warehouse/:id/dispatch` | Dispatch item with tracking info |

## Tests

- `apps/web/tests/e2e/admin-orders-warehouse.spec.ts` -- 7 test cases covering admin orders list, order detail, status update, warehouse list, receive item, QC pass, and QC fail.

## Key Decisions

1. **DataTable over Cards**: Replaced the original card-based layouts with DataTable for consistent sorting, pagination, and search across admin pages.
2. **Context-sensitive actions**: Warehouse row actions change based on item status (Mark Received / Perform QC / Dispatch).
3. **Crochet-specific QC**: The 6-point checklist covers hand-crochet quality aspects rather than generic product checks.
4. **Indian carriers**: Dispatch form includes India Post, DTDC, Blue Dart, and Delhivery as carrier options.
