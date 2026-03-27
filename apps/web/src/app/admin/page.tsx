'use client';

import {
  ShoppingBag,
  IndianRupee,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { KpiCardGrid } from '@/components/dashboard/kpi-card-grid';
import { PendingCountBadges } from '@/components/admin/pending-count-badges';
import { QuickActionShortcuts } from '@/components/admin/quick-action-shortcuts';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { useAdminDashboard } from '@/lib/hooks/use-admin';
import { formatMoney } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';

function KpiSkeleton() {
  return (
    <KpiCardGrid>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </KpiCardGrid>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* KPI Cards */}
      {isLoading ? (
        <KpiSkeleton />
      ) : (
        <KpiCardGrid className="lg:grid-cols-5">
          <KpiCard
            title="Orders Today"
            value={String(data?.ordersToday ?? 0)}
            icon={ShoppingBag}
          />
          <KpiCard
            title="Revenue This Month"
            value={formatMoney(data?.revenueThisMonth ?? 0)}
            icon={IndianRupee}
          />
          <KpiCard
            title="Active Sellers"
            value={String(data?.activeSellers ?? 0)}
            icon={Users}
          />
          <KpiCard
            title="Active Products"
            value={String(data?.activeProducts ?? 0)}
            icon={Package}
          />
          <KpiCard
            title="Open Disputes"
            value={String(data?.openDisputes ?? 0)}
            icon={AlertTriangle}
          />
        </KpiCardGrid>
      )}

      {/* Pending counts needing attention */}
      <PendingCountBadges />

      {/* Quick action buttons */}
      <QuickActionShortcuts />

      {/* Recent activity feed */}
      <ActivityFeed />
    </div>
  );
}
