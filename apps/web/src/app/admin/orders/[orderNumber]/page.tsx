'use client';

/**
 * Admin Order Detail Page -- Full view of a single order.
 *
 * Shows: order info, fulfillment timeline, line items table,
 * shipping address, payment info, status advance controls, and notes.
 */

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/feedback/status-badge';
import { FulfillmentTimeline } from '@/components/admin/fulfillment-timeline';
import { OrderStatusAdvance } from '@/components/admin/order-status-advance';
import { useAdminOrder } from '@/lib/hooks/use-admin';
import { formatMoney, formatDate, formatDateTime } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;

  const { data, isLoading, refetch } = useAdminOrder(orderNumber);
  const order = data?.order ?? data;

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Loading order...</p>;
  }

  if (!order) {
    return <p className="text-center py-10 text-muted-foreground">Order not found.</p>;
  }

  // Build timestamp map from order history if available
  const timestamps: Record<string, string> = {};
  if (order.statusHistory) {
    for (const entry of order.statusHistory) {
      timestamps[entry.status] = entry.createdAt;
    }
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </Button>

      {/* Order header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed by {order.user?.name ?? 'Unknown'} ({order.user?.email ?? ''})
          </p>
          <p className="text-sm text-muted-foreground">
            Created: {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={order.status} type="order" />
          <p className="text-xl font-bold mt-2">{formatMoney(order.totalInCents)}</p>
        </div>
      </div>

      {/* Fulfillment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fulfillment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <FulfillmentTimeline currentStatus={order.status} timestamps={timestamps} />
        </CardContent>
      </Card>

      {/* Line items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Item Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.orderItems ?? []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name ?? item.productName ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.sellerProfile?.businessName ?? item.sellerName ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.priceInCents ?? item.unitPriceInCents ?? 0)}
                    </TableCell>
                    <TableCell>
                      {item.status ? (
                        <StatusBadge status={item.status} type="order" />
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!order.orderItems || order.orderItems.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No line items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address */}
      {order.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.name ?? order.user?.name}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              {order.shippingAddress.phone && (
                <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Payment Status:</span>{' '}
              <span className="font-medium">
                {order.paymentStatus ?? order.payment?.status ?? 'N/A'}
              </span>
            </p>
            {order.paymentMethod && (
              <p>
                <span className="text-muted-foreground">Method:</span>{' '}
                {order.paymentMethod}
              </p>
            )}
            {(order.razorpayOrderId || order.payment?.razorpayOrderId) && (
              <p>
                <span className="text-muted-foreground">Razorpay ID:</span>{' '}
                <span className="font-mono text-xs">
                  {order.razorpayOrderId ?? order.payment?.razorpayOrderId}
                </span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Total:</span>{' '}
              <span className="font-bold">{formatMoney(order.totalInCents)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order status advance actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusAdvance
            orderNumber={order.orderNumber}
            currentStatus={order.status}
            onSuccess={() => refetch()}
          />
        </CardContent>
      </Card>

      {/* Notes section */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
