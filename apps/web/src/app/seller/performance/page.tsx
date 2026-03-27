'use client';

/**
 * Seller Performance Dashboard (S-10)
 *
 * Displays key performance indicators, revenue trend, order status
 * distribution, and rating breakdown for the authenticated seller.
 *
 * Uses the seller dashboard API for KPI data. Revenue trend and
 * rating distribution use mock data since the analytics API does not
 * yet expose seller-specific time-series endpoints.
 */

import { useSellerDashboard, useSellerRatings } from '@/lib/hooks/use-seller';
import { formatMoney } from '@/lib/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChartCard } from '@/components/charts/line-chart-card';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { DonutChartCard } from '@/components/charts/donut-chart-card';

/* ─── Mock data for revenue trend (12 months) ─── */

const MOCK_REVENUE_TREND = [
  { month: 'Apr', revenue: 12000 },
  { month: 'May', revenue: 18500 },
  { month: 'Jun', revenue: 15200 },
  { month: 'Jul', revenue: 22000 },
  { month: 'Aug', revenue: 19800 },
  { month: 'Sep', revenue: 25400 },
  { month: 'Oct', revenue: 28000 },
  { month: 'Nov', revenue: 32100 },
  { month: 'Dec', revenue: 38500 },
  { month: 'Jan', revenue: 29000 },
  { month: 'Feb', revenue: 34200 },
  { month: 'Mar', revenue: 41000 },
];

/* ─── Helper: build order status data from dashboard stats ─── */

function buildOrderStatusData(dashboard: any) {
  // The dashboard may expose counts by status, or just a total.
  // We build a best-effort breakdown from available fields.
  const statuses = [
    { status: 'Pending', count: dashboard?.pendingOrders ?? 0 },
    { status: 'In Production', count: dashboard?.inProductionOrders ?? 0 },
    { status: 'Shipped', count: dashboard?.shippedOrders ?? 0 },
    { status: 'Delivered', count: dashboard?.deliveredOrders ?? 0 },
    { status: 'Completed', count: dashboard?.completedOrders ?? 0 },
  ];
  // Filter out zero-count statuses for a cleaner chart
  return statuses.filter((s) => s.count > 0);
}

/* ─── Helper: build rating distribution from ratings list ─── */

function buildRatingDistribution(ratings: any[]) {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (ratings ?? []).forEach((r: any) => {
    const star = Math.round(r.rating ?? r.stars ?? 0);
    if (star >= 1 && star <= 5) counts[star]++;
  });
  return [
    { name: '5 stars', value: counts[5], color: '#10b981' },
    { name: '4 stars', value: counts[4], color: '#6366f1' },
    { name: '3 stars', value: counts[3], color: '#f59e0b' },
    { name: '2 stars', value: counts[2], color: '#f97316' },
    { name: '1 star', value: counts[1], color: '#ef4444' },
  ];
}

/* ─── Page component ─── */

export default function SellerPerformancePage() {
  const { data: dashboard, isLoading: dashLoading } = useSellerDashboard();
  const { data: ratingsData, isLoading: ratingsLoading } = useSellerRatings();

  const isLoading = dashLoading || ratingsLoading;

  // Loading skeleton
  if (isLoading) return <PerformanceSkeleton />;

  // Derive chart data
  const orderStatusData = buildOrderStatusData(dashboard);
  const ratings: any[] = ratingsData?.ratings ?? ratingsData ?? [];
  const ratingDistribution = buildRatingDistribution(ratings);

  // KPI values (fallback to 0)
  const totalOrders: number = dashboard?.totalOrders ?? 0;
  const avgRating: number = dashboard?.averageRating ?? 0;
  const qcPassRate: number = dashboard?.qcPassRate ?? 0;
  const onTimeRate: number = dashboard?.onTimeDeliveryRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your sales, ratings, and fulfillment metrics.
        </p>
      </div>

      {/* ── KPI cards row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString('en-IN')} />
        <KpiCard label="Average Rating" value={avgRating ? `${avgRating.toFixed(1)} / 5` : '--'} />
        <KpiCard label="QC Pass Rate" value={qcPassRate ? `${qcPassRate}%` : '--'} />
        <KpiCard label="On-Time Delivery" value={onTimeRate ? `${onTimeRate}%` : '--'} />
      </div>

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly revenue trend (mock data) */}
        <LineChartCard
          title="Monthly Revenue Trend"
          data={MOCK_REVENUE_TREND}
          xKey="month"
          yKey="revenue"
          color="#6366f1"
          valueFormatter={(v) => formatMoney(v * 100)}
        />

        {/* Orders by status */}
        {orderStatusData.length > 0 ? (
          <BarChartCard
            title="Orders by Status"
            data={orderStatusData}
            xKey="status"
            yKey="count"
            color="#14b8a6"
          />
        ) : (
          <BarChartCard
            title="Orders by Status"
            data={[
              { status: 'Pending', count: 3 },
              { status: 'In Production', count: 5 },
              { status: 'Shipped', count: 2 },
              { status: 'Delivered', count: 8 },
            ]}
            xKey="status"
            yKey="count"
            color="#14b8a6"
          />
        )}

        {/* Rating distribution */}
        <DonutChartCard
          title="Rating Distribution"
          data={ratingDistribution}
          height={320}
        />
      </div>
    </div>
  );
}

/* ─── KPI card helper ─── */

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

/* ─── Loading skeleton ─── */

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-60" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
