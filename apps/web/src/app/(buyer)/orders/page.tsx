'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import api from '@/lib/api/client';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  DISPATCHED: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then(({ data }) => {
      setOrders(data.orders);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground">Start shopping to see your orders here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.orderNumber}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[order.status] || 'default'}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                    <p className="font-bold mt-1">₹{(order.totalInCents / 100).toLocaleString('en-IN')}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
