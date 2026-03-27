'use client';

/**
 * Admin Warehouse / QC Dashboard -- DataTable-based warehouse item management.
 *
 * Features:
 * - Sortable columns: Order Number, Product, Seller, Status, Received Date, Actions
 * - Status filter tabs: All, Awaiting, Received, QC Pending, QC Passed, QC Failed, Packed
 * - Context-sensitive actions per row based on item status
 * - Click through to /admin/warehouse/{id} for QC and dispatch forms
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useAdminWarehouse, useReceiveWarehouseItem } from '@/lib/hooks/use-admin';
import { formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';
import { Eye, PackageCheck } from 'lucide-react';

/** Status filter tabs. */
const STATUS_TABS = [
  '',                   // All
  'AWAITING_ARRIVAL',
  'RECEIVED',
  'QC_PENDING',
  'QC_PASSED',
  'QC_FAILED',
  'PACKED',
];

/** Shape of a warehouse item row from the API. */
interface WarehouseRow {
  id: string;
  status: string;
  receivedAt?: string;
  createdAt: string;
  orderItem?: {
    order?: { orderNumber: string };
    product?: { name: string };
  };
  sellerProfile?: { businessName: string };
}

export default function AdminWarehousePage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch } = useAdminWarehouse(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const items: WarehouseRow[] = data?.items ?? [];

  const receiveItem = useReceiveWarehouseItem();

  /** Mark a warehouse item as received. */
  function handleReceive(id: string) {
    receiveItem.mutate(id, {
      onSuccess: () => {
        toast.success('Item marked as received');
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Failed to receive item');
      },
    });
  }

  /** Column definitions. */
  const columns = useMemo<ColumnDef<WarehouseRow, any>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order Number" />,
        accessorFn: (row) => row.orderItem?.order?.orderNumber ?? 'N/A',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
        accessorFn: (row) => row.orderItem?.product?.name ?? 'N/A',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'seller',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Seller" />,
        accessorFn: (row) => row.sellerProfile?.businessName ?? 'N/A',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'receivedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Received Date" />,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.receivedAt ? formatDate(row.original.receivedAt) : '--'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex gap-2">
              {/* Awaiting -> Mark Received */}
              {item.status === 'AWAITING_ARRIVAL' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReceive(item.id)}
                  disabled={receiveItem.isPending}
                >
                  <PackageCheck className="h-4 w-4 mr-1" />
                  Mark Received
                </Button>
              )}

              {/* QC Pending -> Perform QC (opens detail page) */}
              {item.status === 'QC_PENDING' && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/admin/warehouse/${item.id}`)}
                >
                  Perform QC
                </Button>
              )}

              {/* QC Passed -> Dispatch (opens detail page) */}
              {(item.status === 'QC_PASSED' || item.status === 'PACKED') && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/admin/warehouse/${item.id}`)}
                >
                  Dispatch
                </Button>
              )}

              {/* Always allow viewing detail */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/warehouse/${item.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, receiveItem.isPending],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Warehouse / QC Dashboard</h1>

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
        <p className="text-center py-10 text-muted-foreground">Loading warehouse items...</p>
      )}

      {/* Warehouse items table */}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={items}
          searchPlaceholder="Search by order number..."
          searchColumn="orderNumber"
        />
      )}
    </div>
  );
}
