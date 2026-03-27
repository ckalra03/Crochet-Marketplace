# Branch 22: `feature/fe-socket-provider` — Socket.io Client Provider

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Real-time communication layer for the frontend using Socket.io. The provider connects when the user is authenticated, disconnects on logout, and passes the JWT token during the handshake. A query invalidator component listens to server-sent events and keeps React Query caches fresh, with toast notifications for important updates.

## Files Created

| File | Purpose |
|------|---------|
| `lib/socket/socket-provider.tsx` | React context provider that manages the Socket.io client lifecycle (connect/disconnect based on auth state) |
| `lib/socket/use-socket.ts` | `useSocket()` hook — returns the socket instance or `null` |
| `lib/socket/use-socket-event.ts` | `useSocketEvent(event, callback)` hook — subscribes to a socket event with auto-cleanup |
| `lib/socket/socket-query-invalidator.tsx` | Listens to 10 socket events and invalidates React Query caches + shows toast notifications |

## Files Modified

| File | Change |
|------|--------|
| `components/providers.tsx` | Wrapped children with `<SocketProvider>` and added `<SocketQueryInvalidator />` |

## Socket Event to Query Invalidation Mapping

| Event | Invalidated Query Keys | Toast |
|-------|----------------------|-------|
| `order:status_updated` | `['orders']` | Order {orderNumber} status updated to {status} |
| `order:allocated` | `['seller', 'orders']` | New order allocated |
| `quote:issued` | `['on-demand']` | New quote received for your request |
| `product:reviewed` | `['seller', 'products']` | Product {name} has been {status} |
| `seller:application_reviewed` | `['seller']` | Seller application {status} |
| `return:resolved` | `['returns']` | Return {returnNumber} resolved |
| `payout:processed` | `['seller', 'payouts']` | Payout processed |
| `warehouse:item_received` | `['admin', 'warehouse']` | (silent) |
| `dispute:created` | `['admin', 'disputes']` | New dispute filed |
| `dashboard:counts_updated` | `['admin', 'dashboard']` | (silent) |

## Configuration

- Socket URL: `NEXT_PUBLIC_SOCKET_URL` env var (default `http://localhost:4000`)
- Auth: JWT token passed via `auth: { token }` on handshake
- Transports: WebSocket with polling fallback
- Reconnection: Enabled with exponential backoff (1s to 10s)

## Dependencies

- `socket.io-client` (already installed)
- `@tanstack/react-query` (for cache invalidation)
- `sonner` (for toast notifications)
- `zustand` auth store (for auth state)
