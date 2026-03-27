'use client';

/**
 * Admin Analytics & Reporting Page (A-17)
 *
 * A comprehensive analytics dashboard for platform administrators.
 * Displays revenue trends, order distribution, top sellers, top
 * categories, and summary KPIs. Supports date-range and period
 * (daily/weekly/monthly) filtering.
 *
 * Data is fetched via admin analytics hooks which call the backend
 * analytics endpoints (Branch 49).
 */

import { useState, useMemo } from 'react';
import {
  useRevenueAnalytics,
  useOrderAnalytics,
  useSellerAnalytics,
  useCategoryAnalytics,
} from '@/lib/hooks/use-admin';
import { formatMoney } from '@/lib/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChartCard } from '@/components/charts/line-chart-card';
import { BarChartCard } from '@/components/charts/bar-chart-card';

/* ─── Date helpers ─── */

/** Return a date string N days ago in YYYY-MM-DD format. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/* ─── Page component ─── */

export default function AdminAnalyticsPage() {
  // Filter state
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(daysAgo(0));
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Build shared params for analytics queries
  const params = useMemo(
    () => ({ startDate, endDate, period }),
    [startDate, endDate, period],
  );

  // Fetch analytics data
  const { data: revenueData, isLoading: revLoading } = useRevenueAnalytics(params);
  const { data: orderData, isLoading: ordLoading } = useOrderAnalytics(params);
  const { data: sellerData, isLoading: selLoading } = useSellerAnalytics({ limit: 10 });
  const { data: categoryData, isLoading: catLoading } = useCategoryAnalytics({ limit: 10 });

  const isLoading = revLoading || ordLoading || selLoading || catLoading;

  // ── Derive chart-friendly arrays ──
  // Revenue over time
  const revenueSeries: Record<string, unknown>[] = revenueData?.series ?? revenueData ?? [];

  // Order status distribution
  const orderStatusDist: Record<string, unknown>[] = useMemo(() => {
    const dist = orderData?.statusDistribution ?? orderData?.statuses ?? [];
    if (Array.isArray(dist) && dist.length > 0) return dist;
    // Fallback: if the API returns counts on the top-level object
    if (orderData && typeof orderData === 'object') {
      const entries = Object.entries(orderData as Record<string, unknown>).filter(
        ([k, v]) => typeof v === 'number' && k !== 'totalOrders' && k !== 'averageValue',
      );
      if (entries.length > 0) {
        return entries.map(([status, count]) => ({ status, count }));
      }
    }
    return [];
  }, [orderData]);

  // Top sellers by revenue
  const topSellers: Record<string, unknown>[] = sellerData?.sellers ?? sellerData ?? [];

  // Top categories by revenue
  const topCategories: Record<string, unknown>[] = categoryData?.categories ?? categoryData ?? [];

  // KPI values
  const totalRevenue: number = revenueData?.totalRevenue ?? revenueData?.total ?? 0;
  const totalOrders: number = orderData?.totalOrders ?? orderData?.total ?? 0;
  const avgOrderValue: number = orderData?.averageValue ?? orderData?.averageOrderValue ?? 0;
  const activeSellers: number = sellerData?.activeSellers ?? sellerData?.total ?? topSellers.length;

  return (
    <div className="space-y-6">
      {/* ── Page heading ── */}
      <div>
        <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide performance metrics and trends.
        </p>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Start date */}
        <div className="space-y-1">
          <label htmlFor="start-date" className="text-sm font-medium">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* End date */}
        <div className="space-y-1">
          <label htmlFor="end-date" className="text-sm font-medium">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Period selector */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Period</label>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── KPI summary cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={formatMoney(totalRevenue)} />
          <KpiCard label="Total Orders" value={totalOrders.toLocaleString('en-IN')} />
          <KpiCard
            label="Avg Order Value"
            value={avgOrderValue ? formatMoney(avgOrderValue) : '--'}
          />
          <KpiCard
            label="Active Sellers"
            value={activeSellers.toLocaleString('en-IN')}
          />
        </div>
      )}

      {/* ── Charts ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue over time */}
          <LineChartCard
            title="Revenue Over Time"
            data={revenueSeries}
            xKey={detectKey(revenueSeries, ['date', 'period', 'label', 'day', 'week', 'month'])}
            yKey={detectKey(revenueSeries, ['revenue', 'totalRevenue', 'amount', 'value'])}
            color="#6366f1"
            valueFormatter={(v) => formatMoney(v)}
          />

          {/* Orders by status */}
          <BarChartCard
            title="Orders by Status"
            data={orderStatusDist}
            xKey={detectKey(orderStatusDist, ['status', 'name', 'label'])}
            yKey={detectKey(orderStatusDist, ['count', 'total', 'orders', 'value'])}
            color="#14b8a6"
          />

          {/* Top sellers */}
          <BarChartCard
            title="Top Sellers by Revenue"
            data={topSellers.slice(0, 10)}
            xKey={detectKey(topSellers, ['sellerName', 'name', 'businessName', 'seller'])}
            yKey={detectKey(topSellers, ['revenue', 'totalRevenue', 'amount', 'value'])}
            color="#8b5cf6"
            valueFormatter={(v) => formatMoney(v)}
          />

          {/* Top categories */}
          <BarChartCard
            title="Top Categories by Revenue"
            data={topCategories.slice(0, 10)}
            xKey={detectKey(topCategories, ['category', 'name', 'categoryName', 'label'])}
            yKey={detectKey(topCategories, ['revenue', 'totalRevenue', 'amount', 'value'])}
            color="#f59e0b"
            valueFormatter={(v) => formatMoney(v)}
          />
        </div>
      )}
    </div>
  );
}

/* ─── KPI Card helper ─── */

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Detect which key exists in the first element of a data array.
 * Tries candidates in order and returns the first match.
 * Falls back to the first candidate if nothing matches.
 */
function detectKey(data: Record<string, unknown>[], candidates: string[]): string {
  if (!data || data.length === 0) return candidates[0];
  const firstItem = data[0];
  for (const key of candidates) {
    if (key in firstItem) return key;
  }
  return candidates[0];
}
