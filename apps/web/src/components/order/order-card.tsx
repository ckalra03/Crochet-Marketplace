'use client';

/**
 * OrderCard -- Compact order summary card for the orders list view.
 *
 * Shows order number, formatted date, status badge, item count,
 * total price, and a preview of the first item. Clicking navigates
 * to the order detail page.
 */

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/feedback/status-badge';
import { formatDate, formatMoney } from '@/lib/utils/format';

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    totalInCents: number;
    items?: {
      id: string;
      productName: string;
      quantity: number;
      thumbnailUrl?: string;
    }[];
  };
}

function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items?.length ?? 0;
  const firstItem = order.items?.[0];

  return (
    <Link href={`/orders/${order.orderNumber}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail or fallback icon */}
            <div className="flex-shrink-0 h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
              {firstItem?.thumbnailUrl ? (
                <img
                  src={firstItem.thumbnailUrl}
                  alt={firstItem.productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground/40" />
              )}
            </div>

            {/* Order info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">{order.orderNumber}</p>
                <StatusBadge status={order.status} type="order" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDate(order.createdAt)} &middot; {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
              {/* First item name preview */}
              {firstItem && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {firstItem.productName}
                  {itemCount > 1 && ` + ${itemCount - 1} more`}
                </p>
              )}
            </div>

            {/* Total price */}
            <div className="flex-shrink-0 text-right">
              <p className="font-bold text-sm">{formatMoney(order.totalInCents)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { OrderCard };
