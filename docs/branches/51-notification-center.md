# Branch 51: Notification Center (Backend + Frontend)

## Overview

Full notification center with persistent storage, real-time delivery via Socket.io, paginated API, and a frontend bell icon with dropdown and full history page.

## Backend Changes

### Prisma Schema (`apps/api/prisma/schema.prisma`)
- Added `Notification` model with fields: `id`, `userId`, `type`, `title`, `body`, `data` (JSONB), `readAt`, `createdAt`
- Added indexes on `(userId, readAt)` and `(createdAt)` for efficient queries
- Added `notifications Notification[]` relation to `User` model

### Notification Persistence Service (`apps/api/src/modules/notifications/notification-persistence.service.ts`)
- `createNotification(data)` — saves to DB and emits via Socket.io `emitToUser`
- `getNotifications(userId, params?)` — paginated list, newest first
- `getUnreadCount(userId)` — count of unread (readAt is null)
- `markAsRead(id, userId)` — sets readAt, ownership-checked via `updateMany`
- `markAllAsRead(userId)` — bulk update all unread for user

### Routes (`apps/api/src/routes/notification.routes.ts`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/notifications` | Paginated list (auth required) |
| GET | `/api/v1/notifications/unread-count` | Unread count |
| POST | `/api/v1/notifications/:id/read` | Mark one as read |
| POST | `/api/v1/notifications/read-all` | Mark all as read |

All routes require authentication via the `authenticate` middleware.

## Frontend Changes

### API Layer (`apps/web/src/lib/api/notifications.ts`)
- `getNotifications(params?)` — fetch paginated notifications
- `getUnreadCount()` — fetch unread count
- `markAsRead(id)` — mark single notification read
- `markAllAsRead()` — mark all notifications read

### React Query Hooks (`apps/web/src/lib/hooks/use-notifications.ts`)
- `useNotifications(params?)` — paginated notification list query
- `useUnreadCount()` — unread count query with 30s polling fallback
- `useMarkAsRead()` — mutation with cache invalidation
- `useMarkAllAsRead()` — mutation with cache invalidation

### Query Keys (`apps/web/src/lib/api/query-keys.ts`)
- Added `notifications.all`, `notifications.list(params)`, `notifications.unreadCount()` keys

### Notification Bell (`apps/web/src/components/layout/notification-bell.tsx`)
- Bell icon with unread count badge (caps at 99+)
- Dropdown showing last 5 notifications with title, body preview, relative time, read/unread dot
- "Mark all as read" link in header
- "View all notifications" link in footer
- Socket.io listener for real-time `notification` events — invalidates cache and shows toast
- Click-outside to close dropdown

### Notifications Page (`apps/web/src/app/(buyer)/notifications/page.tsx`)
- Full history page at `/notifications`
- Paginated with Previous/Next controls
- Notification cards with type-based icons, title, body, relative time
- Unread notifications highlighted with dot and background color
- Clicking marks as read
- Empty state and loading skeletons

### Storefront Nav Update (`apps/web/src/components/layout/storefront-nav.tsx`)
- Added `NotificationBell` component next to cart icon (only visible when authenticated)

## Testing

### Playwright E2E (`apps/web/tests/e2e/notifications.spec.ts`)
- Tests notifications list API (returns paginated)
- Tests unread count API
- Tests mark as read API
- Tests mark all as read API
- Tests 401 without auth

## Key Files

- `apps/api/prisma/schema.prisma` — Notification model
- `apps/api/src/modules/notifications/notification-persistence.service.ts` — DB persistence + Socket.io emit
- `apps/api/src/routes/notification.routes.ts` — REST endpoints
- `apps/api/src/routes/index.ts` — Route registration
- `apps/web/src/lib/api/notifications.ts` — API functions
- `apps/web/src/lib/hooks/use-notifications.ts` — React Query hooks
- `apps/web/src/lib/api/query-keys.ts` — Query key factory
- `apps/web/src/components/layout/notification-bell.tsx` — Bell + dropdown
- `apps/web/src/app/(buyer)/notifications/page.tsx` — Full history page
- `apps/web/src/components/layout/storefront-nav.tsx` — Nav integration
