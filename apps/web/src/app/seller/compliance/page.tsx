'use client';

/**
 * Seller SLA Compliance Page (S-12)
 *
 * Displays the seller's SLA compliance overview including:
 * - KPI cards: On-Time Delivery Rate, QC Pass Rate, Total Breaches, Penalty Count
 * - DataTable of SLA breaches with Type, Target Date, Status, Created Date
 * - Static tips/recommendations section for improving compliance
 * - Empty state when the seller has zero breaches
 *
 * Data is fetched via useSellerSlaBreaches() and useSellerPerformance().
 */

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, Lightbulb } from 'lucide-react';
import { useSellerSlaBreaches, useSellerPerformance } from '@/lib/hooks/use-seller';
import { formatDate, getStatusLabel } from '@/lib/utils/format';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/* ─── SLA breach row type ─── */

interface SlaBreach {
  id: string;
  slaType: string;
  targetDate: string;
  status: string;
  createdAt: string;
  orderNumber?: string;
}

/* ─── Table column definitions ─── */

const columns: ColumnDef<SlaBreach, unknown>[] = [
  {
    accessorKey: 'slaType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => getStatusLabel(row.getValue('slaType')),
  },
  {
    accessorKey: 'targetDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Target Date" />,
    cell: ({ row }) => formatDate(row.getValue('targetDate')),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status: string = row.getValue('status');
      // Map common statuses to user-friendly display
      const isMet = status === 'MET' || status === 'RESOLVED';
      return (
        <span className={`inline-flex items-center gap-1 text-sm font-medium ${isMet ? 'text-green-600' : 'text-red-600'}`}>
          {isMet ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {isMet ? 'Met' : 'Breached'}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
];

/* ─── Static tips for compliance improvement ─── */

const COMPLIANCE_TIPS = [
  {
    title: 'Ship Early, Not Just On Time',
    description:
      'Aim to dispatch orders 1-2 days before the deadline. This buffer accounts for unexpected delays and improves your on-time delivery rate.',
  },
  {
    title: 'Quality Check Before Sending',
    description:
      'Inspect every piece against the QC checklist before shipping to the warehouse. Consistent quality reduces QC failures and penalties.',
  },
  {
    title: 'Respond to Quotes Promptly',
    description:
      'Answer on-demand quote requests within 24 hours. Quick responses improve your quote response SLA and attract more buyers.',
  },
  {
    title: 'Monitor Your Dashboard Regularly',
    description:
      'Check this compliance page weekly. Catching trends early lets you correct course before small issues become recurring penalties.',
  },
];

/* ─── Page component ─── */

export default function SellerCompliancePage() {
  // Fetch SLA breaches and performance metrics
  const { data: breachData, isLoading: breachLoading } = useSellerSlaBreaches();
  const { data: perfData, isLoading: perfLoading } = useSellerPerformance();

  const isLoading = breachLoading || perfLoading;

  // Extract breaches array from paginated response
  const breaches: SlaBreach[] = useMemo(() => {
    if (!breachData) return [];
    return breachData.data ?? breachData ?? [];
  }, [breachData]);

  // Derive KPI values from performance data
  const onTimeRate: number = perfData?.onTimeDeliveryRate ?? perfData?.onTimeRate ?? 0;
  const qcPassRate: number = perfData?.qcPassRate ?? 0;
  const totalBreaches: number = breachData?.total ?? breaches.length;
  const penaltyCount: number = perfData?.penaltyCount ?? perfData?.totalPenalties ?? 0;

  // Show loading skeleton while data is fetching
  if (isLoading) return <ComplianceSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold">SLA Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your delivery and quality compliance metrics.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="On-Time Delivery Rate"
          value={onTimeRate ? `${onTimeRate}%` : '--'}
          icon={Clock}
        />
        <KpiCard
          title="QC Pass Rate"
          value={qcPassRate ? `${qcPassRate}%` : '--'}
          icon={ShieldCheck}
        />
        <KpiCard
          title="Total Breaches"
          value={totalBreaches.toString()}
          icon={AlertTriangle}
        />
        <KpiCard
          title="Penalty Count"
          value={penaltyCount.toString()}
          icon={XCircle}
        />
      </div>

      {/* SLA breaches table or empty state */}
      {breaches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">No SLA Breaches</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Great job! You have no SLA breaches on record. Keep up the excellent
              work by following the compliance tips below.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>SLA Breaches</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={breaches}
              searchPlaceholder="Search by type..."
              searchColumn="slaType"
            />
          </CardContent>
        </Card>
      )}

      {/* Tips and recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Tips for Staying Compliant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLIANCE_TIPS.map((tip) => (
              <div key={tip.title} className="rounded-lg border p-4 space-y-1">
                <h4 className="font-medium text-sm">{tip.title}</h4>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Loading skeleton ─── */

function ComplianceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
