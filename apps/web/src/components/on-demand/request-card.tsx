'use client';

/**
 * RequestCard -- Compact card for displaying an on-demand request in a list.
 * Shows request number, status, category, budget range, and date.
 * Clicking navigates to the request detail page.
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/feedback/status-badge';
import { formatMoney, formatDate } from '@/lib/utils/format';

interface RequestCardProps {
  request: {
    id: string;
    requestNumber?: string;
    status: string;
    description: string;
    category?: { name: string } | null;
    categoryName?: string;
    budgetMinCents?: number | null;
    budgetMaxCents?: number | null;
    createdAt: string;
  };
}

export function RequestCard({ request }: RequestCardProps) {
  const categoryName = request.category?.name ?? request.categoryName ?? 'Uncategorized';

  // Build a budget range string
  const budgetLabel =
    request.budgetMinCents != null || request.budgetMaxCents != null
      ? [
          request.budgetMinCents != null ? formatMoney(request.budgetMinCents) : '---',
          request.budgetMaxCents != null ? formatMoney(request.budgetMaxCents) : '---',
        ].join(' - ')
      : 'Open budget';

  return (
    <Link href={`/on-demand/${request.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          {/* Left side: number, category, description excerpt */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">
                {request.requestNumber ?? `#${request.id.slice(0, 8)}`}
              </p>
              <StatusBadge status={request.status} type="order" />
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {categoryName} &middot; {request.description.slice(0, 80)}
              {request.description.length > 80 ? '...' : ''}
            </p>
          </div>

          {/* Right side: budget + date */}
          <div className="ml-4 shrink-0 text-right">
            <p className="text-sm font-medium">{budgetLabel}</p>
            <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
