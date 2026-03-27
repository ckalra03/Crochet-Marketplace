'use client';

/**
 * ReturnCard -- Compact card for displaying a return request in a list.
 *
 * Shows return number, order number, status badge, reason, and date.
 * Clicking navigates to the return detail page.
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/feedback/status-badge';
import { formatDate, getStatusLabel } from '@/lib/utils/format';
import { RotateCcw } from 'lucide-react';

interface ReturnCardProps {
  /** The return object from the API */
  returnItem: {
    id: string;
    returnNumber: string;
    orderNumber?: string;
    status: string;
    reason: string;
    createdAt: string;
  };
}

function ReturnCard({ returnItem }: ReturnCardProps) {
  return (
    <Link href={`/returns/${returnItem.returnNumber}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{returnItem.returnNumber}</p>
              <StatusBadge status={returnItem.status} type="return" />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {getStatusLabel(returnItem.reason)}
              {returnItem.orderNumber && ` · Order ${returnItem.orderNumber}`}
            </p>
          </div>

          {/* Date */}
          <p className="text-xs text-muted-foreground shrink-0">
            {formatDate(returnItem.createdAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export { ReturnCard };
export type { ReturnCardProps };
