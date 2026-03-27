# Branch 49: `feature/analytics-settings-apis` -- Analytics & Platform Settings APIs

**Date:** 2026-03-27 | **Commits:** 1

## What Was Built

Backend analytics service with revenue, order, seller, and category reporting endpoints, plus a platform settings service with key-value CRUD. Frontend API functions, React Query hooks, and query keys for both features.

## New Backend Files

| File | Purpose |
|------|---------|
| `apps/api/src/modules/analytics/analytics.service.ts` | Analytics service with `getRevenueAnalytics`, `getOrderAnalytics`, `getSellerAnalytics`, `getCategoryAnalytics` methods using Prisma aggregations and raw SQL |
| `apps/api/src/modules/settings/settings.service.ts` | Platform settings CRUD service with `getSetting`, `getAllSettings`, `updateSetting` and automatic default seeding |

## Database Changes

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Added `PlatformSetting` model (id, key unique, value JsonB, updatedAt) mapped to `platform_settings` table |

## API Endpoints Added

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/admin/analytics/revenue?period=monthly&startDate=...&endDate=...` | Revenue grouped by day/week/month |
| GET | `/api/v1/admin/analytics/orders?startDate=...&endDate=...` | Order volume, avg value, status distribution |
| GET | `/api/v1/admin/analytics/sellers?limit=10` | Top sellers by revenue |
| GET | `/api/v1/admin/analytics/categories?limit=10` | Top categories by revenue |
| GET | `/api/v1/admin/settings` | Get all platform settings |
| PUT | `/api/v1/admin/settings` | Upsert a setting (body: `{ key, value }`) |

All routes require admin authentication.

## Frontend Changes

| File | Change |
|------|--------|
| `apps/web/src/lib/api/admin.ts` | Added `getRevenueAnalytics`, `getOrderAnalytics`, `getSellerAnalytics`, `getCategoryAnalytics`, `getSettings`, `updateSetting` API functions with TypeScript interfaces |
| `apps/web/src/lib/hooks/use-admin.ts` | Added `useRevenueAnalytics`, `useOrderAnalytics`, `useSellerAnalytics`, `useCategoryAnalytics`, `useSettings`, `useUpdateSetting` React Query hooks |
| `apps/web/src/lib/api/query-keys.ts` | Added `revenueAnalytics`, `orderAnalytics`, `sellerAnalytics`, `categoryAnalytics`, `settings` query key factories |

## Default Platform Settings

| Key | Default Value | Description |
|-----|---------------|-------------|
| `commissionRate` | 1500 | Basis points (15.00%) |
| `returnWindowDays` | 7 | Days allowed for returns |
| `minimumPayoutCents` | 50000 | Minimum payout threshold (INR 500) |
| `payoutCycleFrequency` | `"monthly"` | How often payouts are generated |
| `slaThresholds` | JSON object | Quote response, dispatch, delivery, dispute resolution hours |

## Tests

| File | Coverage |
|------|----------|
| `apps/web/tests/e2e/analytics-settings.spec.ts` | Revenue analytics (array shape, date range), order analytics (volume + distribution), seller analytics (ranked list), category analytics (ranked list), settings CRUD (read all, update, persistence, upsert new key) |

## Route File Updated

| File | Change |
|------|--------|
| `apps/api/src/routes/admin.routes.ts` | Imported `analyticsService` and `settingsService`; added 6 route handlers for analytics and settings endpoints |
