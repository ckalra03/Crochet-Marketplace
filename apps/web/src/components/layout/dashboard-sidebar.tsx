'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, Package, ShoppingBag, CreditCard, Star, UserCircle, Users, ClipboardCheck, Truck, AlertTriangle, FileText, BarChart3, Tag } from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  title: string;
  variant?: 'light' | 'dark';
}

export function DashboardSidebar({ items, title, variant = 'light' }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isDark = variant === 'dark';

  return (
    <aside className={cn(
      'w-64 min-h-screen p-5 hidden lg:block border-r',
      isDark ? 'bg-[#292524] border-[#3a3533]' : 'bg-white/50 border-[#e7e5e4]'
    )}>
      <h2 className={cn('font-black text-lg mb-8 px-3 tracking-tight', isDark ? 'text-white' : 'text-primary-600')}>
        {title}
      </h2>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                isDark
                  ? isActive
                    ? 'bg-primary-600/20 text-primary-400 font-semibold border-l-2 border-primary-500 ml-[-1px]'
                    : 'text-[#a8a29e] hover:text-white hover:bg-white/5'
                  : isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold border-l-2 border-primary-600 ml-[-1px]'
                    : 'text-[#78716c] hover:bg-[#f5f5f4] hover:text-[#1c1b1b]',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
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
  { label: 'Coupons', href: '/admin/coupons', icon: <Tag className="h-4 w-4" /> },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: <BarChart3 className="h-4 w-4" /> },
];
