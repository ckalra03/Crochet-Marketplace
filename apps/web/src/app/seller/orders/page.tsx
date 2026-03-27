'use client';

/**
 * Seller Orders List Page
 *
 * Displays order items allocated to the seller in a DataTable with:
 * - Columns: Order Number, Product Name, Quantity, Unit Price, Status, Order Date
 * - Status filter via tabs (All / Processing / Completed / Cancelled)
 * - Socket.io live updates for new order allocations
 * - Loading skeletons and empty state
 */

import { useState, useCallback, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';

import { useSellerOrders } from '@/lib/hooks/use-seller';
import { useSocketEvent } from '@/lib/socket/use-socket-event';
import { queryKeys } from '@/lib/api/query-keys';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ─── Status filter tabs ─── */

type OrderTab = 'all' | 'active' | 'completed' | 'cancelled';

const TAB_LABELS: Record<OrderTab, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Statuses considered "active" (in progress). */
const ACTIVE_STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'IN_PRODUCTION',
  'WAREHOUSE_RECEIVED',
  'QC_IN_PROGRESS',
  'PACKING',
  'DISPATCHED',
];

const COMPLETED_STATUSES = ['DELIVERED', 'COMPLETED'];
const CANCELLED_STATUSES = ['CANCELLED', 'FAILED', 'QC_FAILED'];

/** Filter orders by tab value. */
function filterByTab(orders: any[], tab: OrderTab): any[] {
  if (tab === 'all') return orders;
  if (tab === 'active') return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  if (tab === 'completed') return orders.filter((o) => COMPLETED_STATUSES.includes(o.status));
  return orders.filter((o) => CANCELLED_STATUSES.includes(o.status));
}

/* ─── Column definitions ─── */

const columns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order Number" />,
    cell: ({ row }) => (
      <a
        href={`/seller/orders/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue('orderNumber')}
      </a>
    ),
  },
  {
    accessorKey: 'productName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
  },
  {
    accessorKey: 'unitPriceInCents',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unit Price" />,
    cell: ({ row }) => formatMoney(row.getValue('unitPriceInCents') ?? 0),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} type="order" />,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
];

/* ─── Page component ─── */

export default function SellerOrdersPage() {
  const [tab, setTab] = useState<OrderTab>('all');
  const queryClient = useQueryClient();

  // Fetch seller orders
  const { data, isLoading } = useSellerOrders();
  const allOrders: any[] = data?.orders ?? data ?? [];

  // Filter by selected tab
  const filteredOrders = useMemo(() => filterByTab(allOrders, tab), [allOrders, tab]);

  // Socket.io: live update when a new order is allocated to this seller
  const handleNewAllocation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.seller.orders() });
  }, [queryClient]);
  useSocketEvent('seller:order_allocated', handleNewAllocation);

  // Loading state
  if (isLoading) return <OrdersLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {/* Status filter tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as OrderTab)}>
        <TabsList>
          {(Object.keys(TAB_LABELS) as OrderTab[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {TAB_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Orders table or empty state */}
      {filteredOrders.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          searchPlaceholder="Search orders..."
          searchColumn="orderNumber"
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

/** Loading skeleton for the orders page. */
function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  );
}

/** Empty state when no orders match the current filter. */
function EmptyState({ tab }: { tab: OrderTab }) {
  const messages: Record<OrderTab, { title: string; description: string }> = {
    all: { title: 'No orders yet', description: 'Orders allocated to you will appear here.' },
    active: { title: 'No active orders', description: 'No orders are currently being processed.' },
    completed: { title: 'No completed orders', description: 'Completed orders will show up here.' },
    cancelled: { title: 'No cancelled orders', description: 'No cancelled or failed orders.' },
  };
  const msg = messages[tab];

  return (
    <div className="text-center py-20">
      <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">{msg.title}</h2>
      <p className="text-muted-foreground">{msg.description}</p>
    </div>
  );
}
