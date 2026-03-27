'use client';

/**
 * Seller Payouts List Page
 *
 * Displays payout summary KPI cards and a DataTable of the seller's payout history.
 * - KPI Cards: Current Cycle Earnings, Commission Rate, Last Payout
 * - DataTable columns: Payout Number, Period, Gross, Commission, Net, Status
 * - Loading skeleton state
 */

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { IndianRupee, Percent, Calendar } from 'lucide-react';

import { useSellerPayouts, useSellerDashboard } from '@/lib/hooks/use-seller';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';

/* ─── Column definitions ─── */

const columns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'payoutNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payout #" />,
    cell: ({ row }) => (
      <a
        href={`/seller/payouts/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue('payoutNumber')}
      </a>
    ),
  },
  {
    accessorKey: 'periodLabel',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
    cell: ({ row }) => {
      const p = row.original;
      // Show period start-end if available, otherwise fall back to periodLabel
      if (p.periodStart && p.periodEnd) {
        return `${formatDate(p.periodStart)} - ${formatDate(p.periodEnd)}`;
      }
      return p.periodLabel ?? '-';
    },
  },
  {
    accessorKey: 'grossAmountInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gross" />,
    cell: ({ row }) => formatMoney(row.getValue('grossAmountInCents') ?? 0),
  },
  {
    accessorKey: 'commissionInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Commission" />,
    cell: ({ row }) => formatMoney(row.getValue('commissionInCents') ?? 0),
  },
  {
    accessorKey: 'netAmountInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Net" />,
    cell: ({ row }) => (
      <span className="font-semibold">{formatMoney(row.getValue('netAmountInCents') ?? 0)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} type="payout" />,
  },
];

/* ─── Page component ─── */

export default function SellerPayoutsPage() {
  const { data: payoutsData, isLoading: payoutsLoading } = useSellerPayouts();
  const { data: dashboardData, isLoading: dashboardLoading } = useSellerDashboard();

  const payouts: any[] = payoutsData?.payouts ?? payoutsData ?? [];
  const isLoading = payoutsLoading || dashboardLoading;

  // Compute KPI values from dashboard data or payouts
  const kpi = useMemo(() => {
    const currentEarnings = dashboardData?.currentCycleEarningsInCents ?? 0;
    const commissionRate = dashboardData?.commissionRatePercent ?? 15;
    const lastPayout = payouts.find((p: any) => p.status === 'PAID');
    return {
      currentEarnings: formatMoney(currentEarnings),
      commissionRate: `${commissionRate}%`,
      lastPayout: lastPayout ? formatMoney(lastPayout.netAmountInCents ?? 0) : 'N/A',
      lastPayoutDate: lastPayout ? formatDate(lastPayout.paidAt ?? lastPayout.createdAt) : '',
    };
  }, [dashboardData, payouts]);

  if (isLoading) return <PayoutsLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payouts</h1>

      {/* KPI summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Current Cycle Earnings"
          value={kpi.currentEarnings}
          icon={IndianRupee}
          description="Earnings this payout cycle"
        />
        <KpiCard
          title="Commission Rate"
          value={kpi.commissionRate}
          icon={Percent}
          description="Platform commission"
        />
        <KpiCard
          title="Last Payout"
          value={kpi.lastPayout}
          icon={Calendar}
          description={kpi.lastPayoutDate}
        />
      </div>

      {/* Payouts table */}
      {payouts.length === 0 ? (
        <div className="text-center py-20">
          <IndianRupee className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No payouts yet</h2>
          <p className="text-muted-foreground">Your payout history will appear here once processed.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={payouts}
          searchPlaceholder="Search payouts..."
          searchColumn="payoutNumber"
        />
      )}
    </div>
  );
}

/* ─── Loading skeleton ─── */

function PayoutsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}
