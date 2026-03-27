'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { getOrderByNumber } from '@/lib/api/orders';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * Order confirmation page shown after a successful checkout.
 * Displays the order number, estimated delivery, line items,
 * and CTAs for tracking the order or continuing to shop.
 */
export default function OrderConfirmationPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;

  const { data: order, isLoading, isError } = useQuery({
    queryKey: queryKeys.orders.detail(orderNumber),
    queryFn: () => getOrderByNumber(orderNumber),
  });

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
        <p className="text-muted-foreground mt-3">Loading order details...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">
          Could not load order details. The order may still have been placed successfully.
        </p>
        <Link href="/orders">
          <Button>View All Orders</Button>
        </Link>
      </div>
    );
  }

  // Estimated delivery: 7 days from order date (placeholder logic)
  const orderDate = new Date(order.createdAt || Date.now());
  const estimatedDelivery = new Date(orderDate);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Success animation — CSS checkmark */}
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              className="animate-in slide-in-from-left duration-700"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-green-700 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground">
          Thank you for your order. Your order number is:
        </p>
        <p className="text-xl font-mono font-bold text-primary-600 mt-1">
          {order.orderNumber || orderNumber}
        </p>
      </div>

      {/* Order details card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDate(orderDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estimated Delivery</p>
              <p className="font-medium">{formatDate(estimatedDelivery)}</p>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Line items summary */}
          <h3 className="font-semibold text-sm mb-3">Items Ordered</h3>
          <div className="space-y-3">
            {(order.items || order.orderItems || []).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {item.product?.name || item.productName || 'Product'}
                  </p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">
                  {formatMoney((item.priceInCents || item.product?.priceInCents || 0) * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Total */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total Paid</span>
            <span className="text-primary-600">
              {formatMoney(order.totalInCents || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address (if available) */}
      {order.shippingAddress && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" /> Shipping To
            </h3>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/orders/${orderNumber}`} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Package className="h-4 w-4" /> Track Order
          </Button>
        </Link>
        <Link href="/products" className="flex-1">
          <Button className="w-full gap-2">
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
