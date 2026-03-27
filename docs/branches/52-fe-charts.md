# Branch 52: `feature/fe-charts` -- Recharts Chart Dashboards (Frontend)

**Date:** 2026-03-27 | **Commits:** 1

## What Was Built

Recharts-based chart dashboards for the Crochet Hub frontend. Three reusable chart wrapper components (line, bar, donut) plus two new dashboard pages: the seller performance dashboard (S-10) and the admin analytics & reporting page (A-17). Also enhanced the existing seller payout detail page with a donut breakdown chart (S-11).

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | latest | Composable charting library built on D3 + React |

## New Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/charts/line-chart-card.tsx` | Reusable line chart component wrapped in a Card with ResponsiveContainer, tooltip, and configurable color/height/formatter |
| `apps/web/src/components/charts/bar-chart-card.tsx` | Reusable bar chart component wrapped in a Card with ResponsiveContainer, rounded bars, tooltip |
| `apps/web/src/components/charts/donut-chart-card.tsx` | Reusable donut (ring) chart with legend, tooltip, and an 8-color default palette |
| `apps/web/src/app/seller/performance/page.tsx` | Seller Performance Dashboard (S-10) with KPI cards, revenue trend line chart, orders-by-status bar chart, rating distribution donut |
| `apps/web/src/app/admin/analytics/page.tsx` | Admin Analytics & Reporting (A-17) with date range picker, period selector, KPIs, revenue line chart, order/seller/category bar charts |

## Modified Files

| File | Change |
|------|--------|
| `apps/web/src/app/seller/payouts/[id]/page.tsx` | Added donut chart import and payout breakdown visualization (S-11) showing Commission vs Net vs Adjustments |

## Chart Component API

All three chart wrappers share a consistent pattern:
- Wrapped in `Card` + `CardHeader` + `CardContent`
- Use `ResponsiveContainer` (100% width, configurable height)
- Accept optional `valueFormatter` for tooltip display
- Styled to match the existing card/border/muted CSS variables

### LineChartCard Props
- `title`, `data`, `xKey`, `yKey`, `color?`, `height?`, `valueFormatter?`

### BarChartCard Props
- `title`, `data`, `xKey`, `yKey`, `color?`, `height?`, `valueFormatter?`

### DonutChartCard Props
- `title`, `data` (array of `{name, value, color?}`), `height?`, `valueFormatter?`

## Pages Overview

### Seller Performance (/seller/performance)
- KPI row: Total Orders, Average Rating, QC Pass Rate, On-Time Delivery
- Line chart: Monthly revenue trend (mock data until seller analytics API is available)
- Bar chart: Orders by status (from dashboard API)
- Donut chart: Rating distribution (from ratings API)
- Full loading skeleton

### Admin Analytics (/admin/analytics)
- Date range inputs (start/end) and period selector (daily/weekly/monthly)
- KPI row: Total Revenue, Total Orders, Avg Order Value, Active Sellers
- Line chart: Revenue over time (from `useRevenueAnalytics`)
- Bar chart: Orders by status (from `useOrderAnalytics`)
- Bar chart: Top sellers by revenue (from `useSellerAnalytics`)
- Bar chart: Top categories by revenue (from `useCategoryAnalytics`)
- Full loading skeleton with skeletons per KPI and chart

### Seller Payout Detail Enhancement (/seller/payouts/[id])
- Donut chart inserted between summary card and payment reference
- Shows Commission (red), Net Payout (green), Adjustments (amber) segments
- Only displayed when gross amount is greater than zero

## Key Design Decisions

1. **Reusable wrappers** -- Chart components are generic enough to be used across any page, not tied to specific data shapes.
2. **detectKey helper** -- Admin analytics uses a `detectKey()` utility to automatically find the correct data key from the API response, making it resilient to different backend response shapes.
3. **Mock data for seller revenue** -- Since the analytics API doesn't yet provide seller-specific time-series data, the performance page uses mock monthly revenue to demonstrate the chart. It can be swapped with real data when the endpoint is built.
4. **Consistent styling** -- All charts use CSS variable-based colors for borders and backgrounds, matching the project's existing shadcn/ui theme.
