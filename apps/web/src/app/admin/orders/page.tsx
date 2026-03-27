'use client';

/**
 * Admin Orders Page -- DataTable-based order management list.
 *
 * Features:
 * - Sortable columns: Order Number, Buyer, Status, Total, Date, Items
 * - Status filter tabs across the top
 * - Search by order number
 * - Click a row to navigate to /admin/orders/{orderNumber}
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useAdminOrders } from '@/lib/hooks/use-admin';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Eye } from 'lucide-react';

/** Status filter options shown as tabs. */
const STATUS_TABS = [
  '',             // All
  'CONFIRMED',
  'PROCESSING',
  'WAREHOUSE_RECEIVED',
  'QC_IN_PROGRESS',
  'PACKING',
  'DISPATCHED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

/** Shape of an order row coming from the API. */
interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalInCents: number;
  createdAt: string;
  user?: { name: string; email: string };
  _count?: { orderItems: number };
  orderItems?: any[];
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch orders with optional status filter
  const { data, isLoading } = useAdminOrders(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const orders: OrderRow[] = data?.orders ?? [];

  /** Column definitions for the DataTable. */
  const columns = useMemo<ColumnDef<OrderRow, any>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order Number" />,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.orderNumber}</span>
        ),
      },
      {
        accessorKey: 'buyerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Buyer" />,
        accessorFn: (row) => row.user?.name ?? 'N/A',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.user?.name ?? 'N/A'}</p>
            <p className="text-xs text-muted-foreground">{row.original.user?.email ?? ''}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} type="order" />,
      },
      {
        accessorKey: 'totalInCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
        cell: ({ row }) => (
          <span className="font-semibold">{formatMoney(row.original.totalInCents)}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: 'itemsCount',
        header: 'Items',
        accessorFn: (row) =>
          row._count?.orderItems ?? row.orderItems?.length ?? 0,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as number}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/orders/${row.original.orderNumber}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order Management</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <p className="text-center py-10 text-muted-foreground">Loading orders...</p>
      )}

      {/* Orders table */}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search by order number..."
          searchColumn="orderNumber"
        />
      )}
    </div>
  );
}
