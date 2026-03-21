# Branch 16: Notifications & Real-time

**Branch:** `feature/notifications` (merged to `main`)
**Date:** 2026-03-22
**Commits:** 2

## What was built

Socket.io real-time notification system with JWT auth and role-based rooms.

## Architecture

```
Express Server (HTTP)
    └── Socket.io Server
        ├── Auth middleware (JWT verification)
        └── Rooms:
            ├── user:{userId}         → personal buyer notifications
            ├── seller:{sellerProfileId} → seller-specific events
            └── admin                 → admin-wide alerts
```

## Socket.io Setup (`apps/api/src/socket/socket.ts`)

- JWT auth middleware: verifies token from `handshake.auth.token` or `Authorization` header
- Auto-joins rooms based on user role
- Helper functions: `emitToUser()`, `emitToSeller()`, `emitToAdmins()`

## Notification Service (`apps/api/src/modules/notifications/notification.service.ts`)

| Method | Target | Event |
|--------|--------|-------|
| `notifyBuyerOrderConfirmed` | user:{id} | order.confirmed |
| `notifyBuyerOrderDispatched` | user:{id} | order.dispatched |
| `notifyBuyerOrderDelivered` | user:{id} | order.delivered |
| `notifyBuyerQuoteIssued` | user:{id} | quote.issued |
| `notifyBuyerReturnResolved` | user:{id} | return.resolved |
| `notifySellerApproved` | user:{id} | seller.approved |
| `notifySellerProductApproved` | seller:{id} | product.approved |
| `notifySellerNewOrder` | seller:{id} | new_order |
| `notifySellerPayoutProcessed` | seller:{id} | payout.processed |
| `notifyAdminNewSellerApplication` | admin | notification |
| `notifyAdminNewDispute` | admin | notification |

## Event Payload Shape

```json
{
  "type": "order.confirmed",
  "title": "Order Confirmed",
  "message": "Your order CH-20260321-ABCD has been confirmed.",
  "data": { "orderNumber": "CH-20260321-ABCD" }
}
```

## Frontend Integration (planned)

```typescript
// Socket.io client connects with JWT
const socket = io('http://localhost:4000', {
  auth: { token: accessToken }
});

socket.on('notification', (payload) => {
  toast(payload.title, { description: payload.message });
});
```
