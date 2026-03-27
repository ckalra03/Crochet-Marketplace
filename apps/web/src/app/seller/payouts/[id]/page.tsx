'use client';

/**
 * Seller Payout Detail Page
 *
 * Shows a summary card for the payout (total, commission, adjustments, net)
 * and a DataTable of line items (order number, item amount, commission,
 * adjustments, net). Includes status badge and payment reference if paid.
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';

import { useSellerPayout } from '@/lib/hooks/use-seller';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { DonutChartCard } from '@/components/charts/donut-chart-card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

/* ─── Line item column definitions ─── */

const lineItemColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order #" />,
  },
  {
    accessorKey: 'itemAmountInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => formatMoney(row.getValue('itemAmountInCents') ?? 0),
  },
  {
    accessorKey: 'commissionInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Commission" />,
    cell: ({ row }) => formatMoney(row.getValue('commissionInCents') ?? 0),
  },
  {
    accessorKey: 'adjustmentsInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Adjustments" />,
    cell: ({ row }) => formatMoney(row.getValue('adjustmentsInCents') ?? 0),
  },
  {
    accessorKey: 'netAmountInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Net" />,
    cell: ({ row }) => (
      <span className="font-semibold">{formatMoney(row.getValue('netAmountInCents') ?? 0)}</span>
    ),
  },
];

/* ─── Page component ─── */

export default function SellerPayoutDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: payout, isLoading } = useSellerPayout(id);

  // Loading state
  if (isLoading) return <PayoutDetailSkeleton />;

  // Not found
  if (!payout) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Payout not found</h2>
        <p className="text-muted-foreground">This payout does not exist.</p>
        <Link href="/seller/payouts" className="text-primary hover:underline mt-4 inline-block">
          Back to payouts
        </Link>
      </div>
    );
  }

  const lineItems: any[] = payout.lineItems ?? payout.items ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/seller">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/seller/payouts">Payouts</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{payout.payoutNumber ?? id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{payout.payoutNumber}</h1>
          {payout.periodStart && payout.periodEnd && (
            <p className="text-sm text-muted-foreground">
              Period: {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
            </p>
          )}
        </div>
        <StatusBadge status={payout.status} type="payout" className="text-sm" />
      </div>

      {/* Summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payout Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SummaryRow label="Gross Total" value={formatMoney(payout.grossAmountInCents ?? 0)} />
          <SummaryRow label="Commission" value={`-${formatMoney(payout.commissionInCents ?? 0)}`} />
          <SummaryRow label="Adjustments" value={formatMoney(payout.adjustmentsInCents ?? 0)} />
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Net Payout</span>
            <span className="text-primary">{formatMoney(payout.netAmountInCents ?? 0)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payout breakdown donut chart (S-11) */}
      {(payout.grossAmountInCents ?? 0) > 0 && (
        <DonutChartCard
          title="Payout Breakdown"
          data={[
            {
              name: 'Commission',
              value: payout.commissionInCents ?? 0,
              color: '#ef4444',
            },
            {
              name: 'Net Payout',
              value: payout.netAmountInCents ?? 0,
              color: '#10b981',
            },
            ...(payout.adjustmentsInCents
              ? [
                  {
                    name: 'Adjustments',
                    value: Math.abs(payout.adjustmentsInCents),
                    color: '#f59e0b',
                  },
                ]
              : []),
          ]}
          height={280}
          valueFormatter={(v) => formatMoney(v)}
        />
      )}

      {/* Payment reference (shown when paid) */}
      {payout.status === 'PAID' && payout.paymentReference && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Payment Reference: </span>
              <span className="font-mono font-medium">{payout.paymentReference}</span>
            </p>
            {payout.paidAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Paid on {formatDate(payout.paidAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Line items table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Line Items</h2>
        {lineItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items available.</p>
        ) : (
          <DataTable
            columns={lineItemColumns}
            data={lineItems}
            searchPlaceholder="Search by order number..."
            searchColumn="orderNumber"
          />
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PayoutDetailSkeleton() {
  return (
    <div className="max-w-4xl space-y-6">
      <Skeleton className="h-5 w-64" />
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-44 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
