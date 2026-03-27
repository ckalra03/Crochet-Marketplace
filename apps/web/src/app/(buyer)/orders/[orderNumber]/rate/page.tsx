'use client';

/**
 * Rate Order Items page -- Allows buyers to rate delivered items from an order.
 *
 * Fetches order detail via useOrder(), shows list of delivered items that
 * haven't been rated, and renders a ReviewForm for each.
 * Breadcrumb: Orders > {orderNumber} > Rate
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrder } from '@/lib/hooks/use-orders';
import { ReviewForm } from '@/components/ratings/review-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ChevronRight, Star } from 'lucide-react';

/* ───────────── Loading skeleton ───────────── */

function RatingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <div className="h-20 w-full rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

/* ───────────── Page ───────────── */

export default function RateOrderPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const { data: order, isLoading, isError } = useOrder(orderNumber);

  // Filter to delivered items that haven't been rated yet
  const ratableItems = (order?.items ?? []).filter((item: any) => {
    // An item is ratable if the order is DELIVERED/COMPLETED and item has no rating
    const orderDelivered = ['DELIVERED', 'COMPLETED'].includes(order?.status);
    return orderDelivered && !item.rating;
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground">
          Orders
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/orders/${orderNumber}`} className="hover:text-foreground">
          {orderNumber}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Rate</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">Rate Your Items</h1>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <RatingSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load order details. Please try again later.
        </div>
      )}

      {/* Order not delivered */}
      {!isLoading && !isError && order && !['DELIVERED', 'COMPLETED'].includes(order.status) && (
        <EmptyState
          icon={Star}
          title="Order not delivered yet"
          description="You can rate items once your order has been delivered."
          action={
            <Link href={`/orders/${orderNumber}`}>
              <button className="text-sm text-primary-600 hover:underline">
                View Order Details
              </button>
            </Link>
          }
        />
      )}

      {/* No ratable items (all already rated) */}
      {!isLoading && !isError && ratableItems.length === 0 && ['DELIVERED', 'COMPLETED'].includes(order?.status) && (
        <EmptyState
          icon={Star}
          title="All items rated"
          description="You have already rated all items in this order. Thank you for your feedback!"
          action={
            <Link href={`/orders/${orderNumber}`}>
              <button className="text-sm text-primary-600 hover:underline">
                View Order Details
              </button>
            </Link>
          }
        />
      )}

      {/* Ratable items */}
      {!isLoading && ratableItems.length > 0 && (
        <div className="space-y-6">
          {ratableItems.map((item: any) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.productName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity} · {item.productType?.replace(/_/g, ' ')}
                </p>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  orderNumber={orderNumber}
                  orderItemId={item.id}
                  productName={item.productName}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
