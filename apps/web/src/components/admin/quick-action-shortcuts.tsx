'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Package,
  ClipboardCheck,
  CreditCard,
  FileText,
} from 'lucide-react';

interface ActionItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const actions: ActionItem[] = [
  {
    label: 'Review Sellers',
    href: '/admin/sellers',
    icon: <Users className="h-6 w-6" />,
  },
  {
    label: 'Approve Products',
    href: '/admin/products',
    icon: <Package className="h-6 w-6" />,
  },
  {
    label: 'QC Dashboard',
    href: '/admin/warehouse',
    icon: <ClipboardCheck className="h-6 w-6" />,
  },
  {
    label: 'Process Payouts',
    href: '/admin/payouts',
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    label: 'View Audit Logs',
    href: '/admin/audit-logs',
    icon: <FileText className="h-6 w-6" />,
  },
];

function QuickActionShortcuts() {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="border rounded-lg p-4 text-center hover:bg-muted transition-colors"
            >
              <div className="mx-auto mb-2 text-muted-foreground flex justify-center">
                {action.icon}
              </div>
              <p className="text-sm font-medium">{action.label}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { QuickActionShortcuts };
