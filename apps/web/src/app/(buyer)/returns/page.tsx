'use client';

/**
 * Returns list page -- Shows all return requests for the current buyer.
 *
 * Uses useReturns() hook with ReturnCard for each item,
 * loading skeletons, and empty state.
 */

import Link from 'next/link';
import { useReturns } from '@/lib/hooks/use-returns';
import { ReturnCard } from '@/components/returns/return-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, Plus } from 'lucide-react';

/* ───────────── Loading skeleton ───────────── */

function ReturnSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-3 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

/* ───────────── Page ───────────── */

export default function ReturnsPage() {
  const { data, isLoading, isError } = useReturns();

  // The API may return { returns: [...] } or an array directly
  const returns: any[] = Array.isArray(data) ? data : data?.returns ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Returns</h1>
        <Link href="/returns/new">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Return
          </Button>
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReturnSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load returns. Please try again later.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && returns.length === 0 && (
        <EmptyState
          icon={RotateCcw}
          title="No returns yet"
          description="You haven't submitted any return requests. If you need to return an item, start from your order details."
          action={
            <Link href="/orders">
              <Button variant="outline">View Orders</Button>
            </Link>
          }
        />
      )}

      {/* Return list */}
      {!isLoading && returns.length > 0 && (
        <div className="space-y-3">
          {returns.map((item: any) => (
            <ReturnCard key={item.id} returnItem={item} />
          ))}
        </div>
      )}
    </div>
  );
}
