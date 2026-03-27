'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, AlertTriangle, Truck, ClipboardCheck } from 'lucide-react';
import { useAdminDashboard } from '@/lib/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';

interface BadgeItem {
  label: string;
  key: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const badges: BadgeItem[] = [
  {
    label: 'Pending Sellers',
    key: 'pendingSellerApprovals',
    href: '/admin/sellers',
    icon: <Users className="h-4 w-4" />,
    color: 'text-amber-600',
  },
  {
    label: 'Pending Products',
    key: 'pendingProductApprovals',
    href: '/admin/products',
    icon: <Package className="h-4 w-4" />,
    color: 'text-green-600',
  },
  {
    label: 'Open Disputes',
    key: 'openDisputes',
    href: '/admin/disputes',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-600',
  },
  {
    label: 'Pending Returns',
    key: 'pendingReturns',
    href: '/admin/returns',
    icon: <Truck className="h-4 w-4" />,
    color: 'text-purple-600',
  },
  {
    label: 'QC Queue',
    key: 'qcQueue',
    href: '/admin/warehouse',
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: 'text-teal-600',
  },
];

function PendingCountBadgesSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}

function PendingCountBadges() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) return <PendingCountBadgesSkeleton />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {badges.map((badge) => {
        const count = data?.[badge.key] ?? 0;
        return (
          <Link key={badge.key} href={badge.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`${badge.color}`}>{badge.icon}</div>
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{badge.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export { PendingCountBadges };
