'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingBag, CreditCard, Star } from 'lucide-react';
import api from '@/lib/api/client';

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/seller/dashboard').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return <div className="py-20 text-center">Loading dashboard...</div>;

  const kpis = [
    { label: 'Total Orders', value: stats.overview.totalOrders, icon: <ShoppingBag className="h-5 w-5" />, color: 'text-blue-600' },
    { label: 'Active Products', value: stats.overview.activeProducts, icon: <Package className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Revenue', value: `₹${(stats.overview.totalRevenueInCents / 100).toLocaleString('en-IN')}`, icon: <CreditCard className="h-5 w-5" />, color: 'text-primary-600' },
    { label: 'Avg Rating', value: stats.overview.avgRating ? stats.overview.avgRating.toFixed(1) : 'N/A', icon: <Star className="h-5 w-5" />, color: 'text-amber-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${kpi.color}`}>{kpi.icon}</div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.recentOrders?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">Order</th><th className="text-left py-2">Product</th><th className="text-left py-2">Status</th><th className="text-left py-2">Date</th>
                </tr></thead>
                <tbody>
                  {stats.recentOrders.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.order?.orderNumber}</td>
                      <td className="py-2">{item.product?.name}</td>
                      <td className="py-2"><span className="text-xs bg-muted px-2 py-1 rounded">{item.order?.status?.replace(/_/g, ' ')}</span></td>
                      <td className="py-2 text-muted-foreground">{item.order?.placedAt ? new Date(item.order.placedAt).toLocaleDateString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
