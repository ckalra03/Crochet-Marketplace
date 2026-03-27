'use client';

/**
 * Admin SLA Monitoring Page (A-15)
 *
 * Comprehensive SLA monitoring dashboard for platform administrators.
 * Displays:
 * - KPI cards: Total Breaches, Breaches This Week, Top Offender Seller, Open Penalties
 * - Bar chart: Breaches grouped by type (QUOTE_RESPONSE, DISPATCH, DELIVERY, DISPUTE_RESOLUTION)
 * - DataTable of recent breaches with seller, type, target date, status, order number
 * - Filters: by SLA type and date range
 *
 * Data is fetched via useSlaDashboard() and useSlaBreaches().
 */

import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Calendar, UserX, Ban } from 'lucide-react';
import { useSlaDashboard, useSlaBreaches } from '@/lib/hooks/use-admin';
import { formatDate, getStatusLabel } from '@/lib/utils/format';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── SLA type options for the filter ─── */

const SLA_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'QUOTE_RESPONSE', label: 'Quote Response' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'DISPUTE_RESOLUTION', label: 'Dispute Resolution' },
];

/* ─── SLA breach row type ─── */

interface SlaBreach {
  id: string;
  sellerName?: string;
  sellerBusinessName?: string;
  slaType: string;
  targetDate: string;
  status: string;
  orderNumber?: string;
  createdAt: string;
}

/* ─── Table column definitions ─── */

const columns: ColumnDef<SlaBreach, unknown>[] = [
  {
    accessorKey: 'sellerBusinessName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Seller" />,
    cell: ({ row }) =>
      row.original.sellerBusinessName || row.original.sellerName || 'Unknown',
  },
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
      // Use StatusBadge for consistent styling
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
    cell: ({ row }) => row.getValue('orderNumber') || '--',
  },
];

/* ─── Date helper ─── */

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/* ─── Page component ─── */

export default function AdminSlaPage() {
  // Filter state
  const [slaType, setSlaType] = useState('ALL');
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(daysAgo(0));

  // Build query params — pass undefined for "ALL" type
  const breachParams = useMemo(
    () => ({
      slaType: slaType === 'ALL' ? undefined : slaType,
    }),
    [slaType],
  );

  // Fetch SLA dashboard summary and breach list
  const { data: dashData, isLoading: dashLoading } = useSlaDashboard();
  const { data: breachData, isLoading: breachLoading } = useSlaBreaches(breachParams);

  const isLoading = dashLoading || breachLoading;

  // Extract breaches array
  const breaches: SlaBreach[] = useMemo(() => {
    if (!breachData) return [];
    return breachData.data ?? breachData ?? [];
  }, [breachData]);

  // Derive KPI values from the dashboard summary
  const totalBreaches: number = dashData?.totalBreaches ?? 0;
  const breachesThisWeek: number = dashData?.breachesThisWeek ?? dashData?.weeklyBreaches ?? 0;
  const topOffender: string =
    dashData?.topOffendingSellers?.[0]?.businessName ??
    dashData?.topOffendingSellers?.[0]?.sellerName ??
    dashData?.topOffender ??
    'None';
  const openPenalties: number = dashData?.openPenalties ?? dashData?.pendingPenalties ?? 0;

  // Build bar chart data from breachesByType
  const breachByTypeChart: Record<string, unknown>[] = useMemo(() => {
    const byType = dashData?.breachesByType;
    if (Array.isArray(byType) && byType.length > 0) {
      // API returns [{ slaType, count }, ...]
      return byType.map((item: any) => ({
        type: getStatusLabel(item.slaType ?? item.type ?? ''),
        count: item.count ?? item.total ?? 0,
      }));
    }
    // Fallback: empty chart
    return [];
  }, [dashData]);

  // Show loading skeleton
  if (isLoading) return <SlaSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold">SLA Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Track SLA compliance across all sellers and identify offenders.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Breaches"
          value={totalBreaches.toString()}
          icon={AlertTriangle}
        />
        <KpiCard
          title="Breaches This Week"
          value={breachesThisWeek.toString()}
          icon={Calendar}
        />
        <KpiCard
          title="Top Offender"
          value={topOffender}
          icon={UserX}
        />
        <KpiCard
          title="Open Penalties"
          value={openPenalties.toString()}
          icon={Ban}
        />
      </div>

      {/* Breaches by type bar chart */}
      {breachByTypeChart.length > 0 && (
        <BarChartCard
          title="Breaches by SLA Type"
          data={breachByTypeChart}
          xKey="type"
          yKey="count"
          color="#ef4444"
        />
      )}

      {/* Filters row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* SLA type filter */}
        <div className="space-y-1">
          <label className="text-sm font-medium">SLA Type</label>
          <Select value={slaType} onValueChange={setSlaType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLA_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start date */}
        <div className="space-y-1">
          <label htmlFor="sla-start" className="text-sm font-medium">
            Start Date
          </label>
          <input
            id="sla-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* End date */}
        <div className="space-y-1">
          <label htmlFor="sla-end" className="text-sm font-medium">
            End Date
          </label>
          <input
            id="sla-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Recent breaches table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SLA Breaches</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={breaches}
            searchPlaceholder="Search by seller..."
            searchColumn="sellerBusinessName"
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Loading skeleton ─── */

function SlaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
