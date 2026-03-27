'use client';

/**
 * Seller Order Detail Page
 *
 * Read-only view of a single order item allocated to the seller.
 * Shows order number, buyer requirements, product name, quantity, status,
 * and QC status indicator. Sellers cannot change order status.
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';

import { useSellerOrder } from '@/lib/hooks/use-seller';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

/* ─── QC status colors ─── */

const QC_INDICATOR: Record<string, { label: string; className: string }> = {
  QC_IN_PROGRESS: { label: 'QC In Progress', className: 'bg-amber-500' },
  QC_FAILED: { label: 'QC Failed', className: 'bg-red-500' },
  QC_PASSED: { label: 'QC Passed', className: 'bg-green-500' },
};

export default function SellerOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: order, isLoading } = useSellerOrder(id);

  // Loading state
  if (isLoading) return <OrderDetailSkeleton />;

  // Not found
  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <p className="text-muted-foreground">This order item does not exist or is not allocated to you.</p>
        <Link href="/seller/orders" className="text-primary hover:underline mt-4 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  // Determine QC indicator (if the order has a QC-related status)
  const qcInfo = QC_INDICATOR[order.qcStatus] ?? QC_INDICATOR[order.status] ?? null;

  return (
    <div className="max-w-3xl space-y-6">
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
              <Link href="/seller/orders">Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order.orderNumber ?? id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} type="order" className="text-sm" />
      </div>

      {/* QC Status Indicator */}
      {qcInfo && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-block h-3 w-3 rounded-full ${qcInfo.className}`} />
          <span className="font-medium">{qcInfo.label}</span>
        </div>
      )}

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow label="Product" value={order.productName} />
          <DetailRow label="Quantity" value={String(order.quantity)} />
          <DetailRow
            label="Unit Price"
            value={order.unitPriceInCents != null ? formatMoney(order.unitPriceInCents) : '-'}
          />
          <DetailRow
            label="Total"
            value={order.totalPriceInCents != null ? formatMoney(order.totalPriceInCents) : '-'}
          />
          <DetailRow label="Status" value={order.status} />
        </CardContent>
      </Card>

      {/* Buyer Requirements (if provided) */}
      {order.buyerRequirements && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyer Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {order.buyerRequirements}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Read-only note */}
      <p className="text-xs text-muted-foreground italic">
        Order status is managed by the warehouse and admin team. This is a read-only view.
      </p>
    </div>
  );
}

/* ─── Helpers ─── */

/** Simple label-value row for the detail card. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/** Loading skeleton for the detail page. */
function OrderDetailSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <Skeleton className="h-5 w-64" />
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
