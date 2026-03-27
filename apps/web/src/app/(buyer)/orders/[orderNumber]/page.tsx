'use client';

/**
 * Order Detail Page
 *
 * Shows full order information:
 *  - Breadcrumb navigation (Home > Orders > {orderNumber})
 *  - Order status badge + placement date
 *  - OrderTimeline (step-by-step status progression)
 *  - Line items with product name, quantity, unit price, total
 *  - ShippingInfo (for dispatched+ orders)
 *  - OrderActions (cancel, return, review buttons)
 *  - Live socket updates for real-time status changes
 *  - Price summary (subtotal, shipping, total)
 */

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useOrder } from '@/lib/hooks/use-orders';
import { useSocketEvent } from '@/lib/socket/use-socket-event';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { OrderTimeline } from '@/components/order/order-timeline';
import { ShippingInfo } from '@/components/order/shipping-info';
import { OrderActions } from '@/components/order/order-actions';

export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const queryClient = useQueryClient();

  // Fetch order via React Query
  const { data: order, isLoading } = useOrder(orderNumber);

  // Live socket updates: when the order status changes, refetch from server
  const handleStatusUpdate = useCallback(
    (payload: { orderNumber: string }) => {
      if (payload.orderNumber === orderNumber) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderNumber) });
      }
    },
    [orderNumber, queryClient],
  );
  useSocketEvent('order:status_updated', handleStatusUpdate);

  // ─── Loading state ───
  if (isLoading) return <OrderDetailSkeleton />;

  // ─── Not found ───
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <p className="text-muted-foreground">The order you are looking for does not exist.</p>
        <Link href="/orders" className="text-primary-600 hover:underline mt-4 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const isCancelledOrFailed = order.status === 'CANCELLED' || order.status === 'FAILED';

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/orders">Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order.orderNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header: order number, date, status */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.placedAt || order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} type="order" className="text-sm" />
      </div>

      {/* Order Timeline (hidden for cancelled/failed) */}
      {!isCancelledOrFailed && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline order={order} />
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                    {item.unitPriceInCents != null && (
                      <> &middot; {formatMoney(item.unitPriceInCents)} each</>
                    )}
                  </p>
                </div>
                <p className="font-bold text-sm flex-shrink-0 ml-4">
                  {formatMoney(item.totalPriceInCents)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Info (dispatched+ only) */}
      <div className="mb-6">
        <ShippingInfo order={order} />
      </div>

      {/* Price Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(order.subtotalInCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {order.shippingFeeInCents === 0 ? 'Free' : formatMoney(order.shippingFeeInCents)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary-600">{formatMoney(order.totalInCents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context-aware order actions */}
      <OrderActions order={order} />
    </div>
  );
}

/* ─────────────────── Loading skeleton ─────────────────── */

function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-48 mb-6" />
      {/* Header skeleton */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      {/* Timeline skeleton */}
      <Skeleton className="h-64 w-full rounded-lg mb-6" />
      {/* Items skeleton */}
      <Skeleton className="h-40 w-full rounded-lg mb-6" />
      {/* Summary skeleton */}
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
