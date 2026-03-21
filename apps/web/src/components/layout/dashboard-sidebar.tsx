'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, Package, ShoppingBag, CreditCard, Star, UserCircle, Settings, Users, ClipboardCheck, Truck, AlertTriangle, FileText, BarChart3 } from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  title: string;
}

export function DashboardSidebar({ items, title }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen border-r bg-muted/30 p-4 hidden lg:block">
      <h2 className="font-bold text-lg mb-6 px-3 text-primary-600">{title}</h2>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              pathname === item.href
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export const sellerSidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/seller', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Products', href: '/seller/products', icon: <Package className="h-4 w-4" /> },
  { label: 'Orders', href: '/seller/orders', icon: <ShoppingBag className="h-4 w-4" /> },
  { label: 'Payouts', href: '/seller/payouts', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Ratings', href: '/seller/ratings', icon: <Star className="h-4 w-4" /> },
  { label: 'Profile', href: '/seller/profile', icon: <UserCircle className="h-4 w-4" /> },
];

export const adminSidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Sellers', href: '/admin/sellers', icon: <Users className="h-4 w-4" /> },
  { label: 'Products', href: '/admin/products', icon: <Package className="h-4 w-4" /> },
  { label: 'Orders', href: '/admin/orders', icon: <ShoppingBag className="h-4 w-4" /> },
  { label: 'Warehouse / QC', href: '/admin/warehouse', icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'On-Demand', href: '/admin/on-demand', icon: <FileText className="h-4 w-4" /> },
  { label: 'Returns', href: '/admin/returns', icon: <Truck className="h-4 w-4" /> },
  { label: 'Disputes', href: '/admin/disputes', icon: <AlertTriangle className="h-4 w-4" /> },
  { label: 'Payouts', href: '/admin/payouts', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: <BarChart3 className="h-4 w-4" /> },
];
