'use client';

/**
 * PendingActionsWidget -- Shows cards for items needing seller attention.
 * Displays counts of draft products and allocated orders with links to act on them.
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FileEdit, ShoppingBag } from 'lucide-react';

interface PendingActionsWidgetProps {
  /** Number of products currently in DRAFT status */
  draftProducts: number;
  /** Number of orders allocated to the seller (pending fulfillment) */
  allocatedOrders: number;
}

function PendingActionsWidget({ draftProducts, allocatedOrders }: PendingActionsWidgetProps) {
  // Don't render if there are no pending actions
  if (draftProducts === 0 && allocatedOrders === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Draft products card */}
      {draftProducts > 0 && (
        <Link href="/seller/products">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-700">
                <FileEdit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftProducts}</p>
                <p className="text-sm text-muted-foreground">
                  product{draftProducts !== 1 ? 's' : ''} in draft
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Allocated orders card */}
      {allocatedOrders > 0 && (
        <Link href="/seller/orders">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allocatedOrders}</p>
                <p className="text-sm text-muted-foreground">
                  order{allocatedOrders !== 1 ? 's' : ''} allocated
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}

export { PendingActionsWidget };
export type { PendingActionsWidgetProps };
