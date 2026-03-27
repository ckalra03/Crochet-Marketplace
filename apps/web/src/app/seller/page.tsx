'use client';

/**
 * Enhanced Seller Dashboard page.
 *
 * Displays KPI cards (Total Orders, Monthly Revenue, Avg Rating, Active Products),
 * a PendingActionsWidget for items needing attention, a recent orders table,
 * and the seller's commission rate.
 */

import Link from 'next/link';
import { ShoppingBag, CreditCard, Star, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PendingActionsWidget } from '@/components/seller/pending-actions-widget';
import { useSellerDashboard } from '@/lib/hooks/use-seller';
import { formatMoney, formatDate } from '@/lib/utils/format';

export default function SellerDashboardPage() {
  const { data: stats, isLoading } = useSellerDashboard();

  if (isLoading) {
    return <div className="py-20 text-center">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="py-20 text-center text-muted-foreground">Unable to load dashboard.</div>;
  }

  const overview = stats.overview ?? {};

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Orders"
          value={String(overview.totalOrders ?? 0)}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatMoney(overview.monthlyRevenueInCents ?? overview.totalRevenueInCents ?? 0)}
          icon={CreditCard}
        />
        <KpiCard
          title="Avg Rating"
          value={overview.avgRating ? overview.avgRating.toFixed(1) : 'N/A'}
          icon={Star}
        />
        <KpiCard
          title="Active Products"
          value={String(overview.activeProducts ?? 0)}
          icon={Package}
        />
      </div>

      {/* ── Pending Actions ── */}
      <div className="mb-8">
        <PendingActionsWidget
          draftProducts={overview.draftProducts ?? 0}
          allocatedOrders={overview.allocatedOrders ?? 0}
        />
      </div>

      {/* ── Commission Rate ── */}
      {stats.commissionRate != null && (
        <Card className="mb-8">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Platform Commission Rate:</span>
            <span className="text-lg font-bold text-primary">
              {(stats.commissionRate * 100).toFixed(1)}%
            </span>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Orders Table (last 5) ── */}
      {stats.recentOrders?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/seller/orders" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">Order</th>
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.slice(0, 5).map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.order?.orderNumber ?? '-'}</td>
                      <td className="py-2">{item.product?.name ?? '-'}</td>
                      <td className="py-2">
                        <StatusBadge status={item.order?.status ?? 'UNKNOWN'} type="order" />
                      </td>
                      <td className="py-2">
                        {item.priceInCents ? formatMoney(item.priceInCents) : '-'}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {item.order?.placedAt ? formatDate(item.order.placedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
