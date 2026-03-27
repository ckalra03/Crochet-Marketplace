# Branch 38: `feature/fe-admin-dashboard` -- Enhanced Admin Dashboard

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Rebuilt the admin dashboard page using reusable KpiCard/KpiCardGrid components, extracted pending-count badges, quick-action shortcuts, and audit-log activity feed into dedicated components. All data is fetched via React Query hooks (`useAdminDashboard`, `useAdminAuditLogs`). Loading skeletons are shown while data loads.

## New Components

| Component | File | Purpose |
|-----------|------|---------|
| `PendingCountBadges` | `components/admin/pending-count-badges.tsx` | Grid of linked cards showing counts needing attention (Pending Sellers, Pending Products, Open Disputes, Pending Returns, QC Queue) |
| `QuickActionShortcuts` | `components/admin/quick-action-shortcuts.tsx` | Grid of icon button cards linking to key admin pages (Review Sellers, Approve Products, QC Dashboard, Process Payouts, View Audit Logs) |
| `ActivityFeed` | `components/admin/activity-feed.tsx` | Recent audit log entries (limit 10) with action name, entity type, user name, and relative timestamp |

## Updated Pages

| Route | File | Changes |
|-------|------|---------|
| `/admin` | `app/admin/page.tsx` | Replaced inline KPI cards and quick actions with KpiCardGrid (5 KPIs: Orders Today, Revenue This Month, Active Sellers, Active Products, Open Disputes), PendingCountBadges, QuickActionShortcuts, ActivityFeed. Uses `useAdminDashboard()` hook instead of raw `api.get`. Loading skeletons while data loads. |

## Reusable Components Used

- `KpiCard` / `KpiCardGrid` -- dashboard metric cards
- `Skeleton` -- loading placeholders
- `Card` / `CardContent` -- shadcn/ui card wrappers
- `Separator` -- divider between activity feed items

## Key Design Decisions

- **React Query over raw useEffect**: Replaced `useState`+`useEffect`+`api.get` with `useAdminDashboard()` hook for proper caching, refetching, and loading states
- **5-column KPI grid**: Uses `lg:grid-cols-5` override on KpiCardGrid for the top-level metrics
- **Pending badges are separate**: PendingCountBadges is its own component to keep the page clean and allow reuse
- **Activity feed limit=10**: Fetches only 10 most recent audit log entries for a quick glance
- **Graceful fallbacks**: All data access uses `data?.field ?? 0` to avoid crashes when API returns unexpected shapes

## Key Files

- `apps/web/src/components/admin/pending-count-badges.tsx`
- `apps/web/src/components/admin/quick-action-shortcuts.tsx`
- `apps/web/src/components/admin/activity-feed.tsx`
- `apps/web/src/app/admin/page.tsx`
