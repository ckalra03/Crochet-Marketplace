'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/client';
import { toast } from 'sonner';

const TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['WAREHOUSE_RECEIVED', 'IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['WAREHOUSE_RECEIVED'],
  WAREHOUSE_RECEIVED: ['QC_IN_PROGRESS'],
  QC_IN_PROGRESS: ['PACKING', 'QC_FAILED'],
  QC_FAILED: ['WAREHOUSE_RECEIVED', 'CANCELLED'],
  PACKING: ['DISPATCHED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
};

const statusColors: Record<string, any> = {
  CONFIRMED: 'info', PROCESSING: 'info', DISPATCHED: 'info',
  DELIVERED: 'success', COMPLETED: 'success',
  CANCELLED: 'destructive', FAILED: 'destructive',
  QC_FAILED: 'destructive', PENDING_PAYMENT: 'warning',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  async function fetchOrders() {
    const params = filter ? `?status=${filter}` : '';
    const { data } = await api.get(`/admin/orders${params}`);
    setOrders(data.orders);
  }

  useEffect(() => { fetchOrders(); }, [filter]);

  async function updateStatus(orderNumber: string, status: string) {
    try {
      await api.post(`/admin/orders/${orderNumber}/update-status`, { status });
      toast.success(`Order updated to ${status.replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED'].map((s) => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>
            {s?.replace(/_/g, ' ') || 'All'}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {orders.map((order: any) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.user?.name} · {order.user?.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant={statusColors[order.status] || 'default'}>{order.status.replace(/_/g, ' ')}</Badge>
                  <p className="font-bold mt-1">₹{(order.totalInCents / 100).toLocaleString('en-IN')}</p>
                </div>
              </div>
              {TRANSITIONS[order.status] && (
                <div className="flex gap-2 mt-3">
                  {TRANSITIONS[order.status].map((next) => (
                    <Button key={next} size="sm" variant={next === 'CANCELLED' ? 'destructive' : 'outline'}
                      onClick={() => updateStatus(order.orderNumber, next)}>
                      {next.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-center py-10 text-muted-foreground">No orders found</p>}
      </div>
    </div>
  );
}
