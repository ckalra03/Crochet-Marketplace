'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Circle, Clock, Package, Truck } from 'lucide-react';
import api from '@/lib/api/client';

const ORDER_STEPS = ['CONFIRMED', 'PROCESSING', 'WAREHOUSE_RECEIVED', 'QC_IN_PROGRESS', 'PACKING', 'DISPATCHED', 'DELIVERED', 'COMPLETED'];

const stepIcons: Record<string, React.ReactNode> = {
  CONFIRMED: <CheckCircle2 className="h-5 w-5" />,
  PROCESSING: <Clock className="h-5 w-5" />,
  WAREHOUSE_RECEIVED: <Package className="h-5 w-5" />,
  QC_IN_PROGRESS: <Package className="h-5 w-5" />,
  PACKING: <Package className="h-5 w-5" />,
  DISPATCHED: <Truck className="h-5 w-5" />,
  DELIVERED: <CheckCircle2 className="h-5 w-5" />,
  COMPLETED: <CheckCircle2 className="h-5 w-5" />,
};

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${params.orderNumber}`).then(({ data }) => {
      setOrder(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.orderNumber]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading...</div>;
  if (!order) return <div className="container mx-auto px-4 py-20 text-center">Order not found</div>;

  const currentIndex = ORDER_STEPS.indexOf(order.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.placedAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Badge variant={order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'success' : order.status === 'CANCELLED' ? 'destructive' : 'info'} className="text-sm">
          {order.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Timeline */}
      {order.status !== 'CANCELLED' && order.status !== 'FAILED' && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Order Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ORDER_STEPS.map((step, i) => {
                const isCompleted = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`${isCompleted ? 'text-green-600' : 'text-muted-foreground/30'} ${isCurrent ? 'animate-pulse' : ''}`}>
                      {isCompleted ? stepIcons[step] : <Circle className="h-5 w-5" />}
                    </div>
                    <span className={`text-sm ${isCompleted ? 'font-medium' : 'text-muted-foreground'}`}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {item.productType.replace(/_/g, ' ')}</p>
                </div>
                <p className="font-bold text-sm">₹{(item.totalPriceInCents / 100).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{(order.subtotalInCents / 100).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingFeeInCents === 0 ? 'Free' : `₹${order.shippingFeeInCents / 100}`}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-primary-600">₹{(order.totalInCents / 100).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
