'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Users, Package, AlertTriangle, CreditCard, Truck, FileText } from 'lucide-react';
import api from '@/lib/api/client';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return <div className="py-20 text-center">Loading dashboard...</div>;

  const kpis = [
    { label: 'Orders Today', value: stats.ordersToday, icon: <ShoppingBag className="h-5 w-5" />, color: 'text-blue-600', href: '/admin/orders' },
    { label: 'Pending Sellers', value: stats.pendingSellerApprovals, icon: <Users className="h-5 w-5" />, color: 'text-amber-600', href: '/admin/sellers' },
    { label: 'Pending Products', value: stats.pendingProductApprovals, icon: <Package className="h-5 w-5" />, color: 'text-green-600', href: '/admin/products' },
    { label: 'Open Disputes', value: stats.openDisputes, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-red-600', href: '/admin/disputes' },
    { label: 'Pending Returns', value: stats.pendingReturns, icon: <Truck className="h-5 w-5" />, color: 'text-purple-600', href: '/admin/returns' },
    { label: 'Pending Payouts', value: stats.pendingPayouts, icon: <CreditCard className="h-5 w-5" />, color: 'text-teal-600', href: '/admin/payouts' },
    { label: 'Active Products', value: stats.activeProducts, icon: <Package className="h-5 w-5" />, color: 'text-green-600' },
    { label: 'Active Sellers', value: stats.activeSellers, icon: <Users className="h-5 w-5" />, color: 'text-blue-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const content = (
            <Card className={kpi.href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-muted ${kpi.color}`}>{kpi.icon}</div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
          return kpi.href ? <Link key={kpi.label} href={kpi.href}>{content}</Link> : <div key={kpi.label}>{content}</div>;
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/sellers" className="border rounded-lg p-4 text-center hover:bg-muted transition-colors">
              <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-sm">Review Sellers</p>
            </Link>
            <Link href="/admin/products" className="border rounded-lg p-4 text-center hover:bg-muted transition-colors">
              <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-sm">Approve Products</p>
            </Link>
            <Link href="/admin/orders" className="border rounded-lg p-4 text-center hover:bg-muted transition-colors">
              <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-sm">Manage Orders</p>
            </Link>
            <Link href="/admin/warehouse" className="border rounded-lg p-4 text-center hover:bg-muted transition-colors">
              <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-sm">Warehouse QC</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
