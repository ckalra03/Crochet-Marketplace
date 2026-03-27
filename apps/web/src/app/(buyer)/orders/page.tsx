'use client';

/**
 * Buyer Orders List Page
 *
 * Displays all buyer orders with tab filtering (All / Active / Completed / Cancelled),
 * compact order cards, pagination, loading skeletons, and empty states per tab.
 * Uses React Query via useOrders() hook for data fetching.
 */

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useOrders } from '@/lib/hooks/use-orders';
import { OrderTabs, filterOrdersByTab, type OrderTab } from '@/components/order/order-tabs';
import { OrderCard } from '@/components/order/order-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

/** Number of orders to display per page */
const PAGE_SIZE = 10;

/** Empty state messages per tab */
const EMPTY_MESSAGES: Record<OrderTab, { title: string; description: string }> = {
  all: {
    title: 'No orders yet',
    description: 'Start shopping to see your orders here!',
  },
  active: {
    title: 'No active orders',
    description: 'You have no orders currently being processed.',
  },
  completed: {
    title: 'No completed orders',
    description: 'Orders you have received will show up here.',
  },
  cancelled: {
    title: 'No cancelled orders',
    description: 'You have no cancelled or failed orders.',
  },
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [page, setPage] = useState(1);

  // Fetch all orders (the API returns them all; we filter client-side by tab)
  const { data, isLoading } = useOrders();
  const allOrders: any[] = data?.orders ?? [];

  // Filter by selected tab
  const filteredOrders = filterOrdersByTab(allOrders, activeTab);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when tab changes
  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {/* Loading skeleton */}
      {isLoading && <OrdersLoadingSkeleton />}

      {/* Content (after loading) */}
      {!isLoading && (
        <>
          {/* Tab navigation with counts */}
          <OrderTabs orders={allOrders} activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Order cards or empty state */}
          {paginatedOrders.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-3">
              {paginatedOrders.map((order: any) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────── Sub-components ─────────────────── */

/** Skeleton placeholder while orders are loading */
function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {/* Fake tab bar */}
      <div className="flex gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded" />
        ))}
      </div>
      {/* Fake order cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Empty state shown when a tab has no matching orders */
function EmptyState({ tab }: { tab: OrderTab }) {
  const msg = EMPTY_MESSAGES[tab];

  return (
    <div className="text-center py-20">
      <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">{msg.title}</h2>
      <p className="text-muted-foreground">{msg.description}</p>
    </div>
  );
}
