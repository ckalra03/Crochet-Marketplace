'use client';

/**
 * Admin Returns Page -- DataTable-based return request management.
 *
 * Features:
 * - Sortable columns: Return Number, Order Number, Buyer, Reason, Status, Date, Actions
 * - Status filter tabs
 * - Search by return number
 * - Click to navigate to /admin/returns/{id}
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useAdminReturns } from '@/lib/hooks/use-admin';
import { formatDate } from '@/lib/utils/format';
import { Eye } from 'lucide-react';

const STATUS_TABS = ['', 'REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CANCELLED'];

interface ReturnRow {
  id: string;
  returnNumber: string;
  reason: string;
  status: string;
  createdAt: string;
  order?: { orderNumber: string };
  orderNumber?: string;
  user?: { name: string; email: string };
  buyerName?: string;
}

export default function AdminReturnsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useAdminReturns(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const returns: ReturnRow[] = data?.returns ?? data ?? [];

  const columns = useMemo<ColumnDef<ReturnRow, any>[]>(
    () => [
      {
        accessorKey: 'returnNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Return Number" />,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.returnNumber}</span>
        ),
      },
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order Number" />,
        accessorFn: (row) => row.order?.orderNumber ?? row.orderNumber ?? 'N/A',
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.order?.orderNumber ?? row.original.orderNumber ?? 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'buyerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Buyer" />,
        accessorFn: (row) => row.user?.name ?? row.buyerName ?? 'N/A',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.user?.name ?? row.original.buyerName ?? 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'reason',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reason" />,
        cell: ({ row }) => (
          <span className="text-sm truncate max-w-[200px] block">
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} type="return" />,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/returns/${row.original.id}`)}
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
      <h1 className="text-2xl font-bold">Returns Management</h1>

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

      {isLoading && (
        <p className="text-center py-10 text-muted-foreground">Loading returns...</p>
      )}

      {!isLoading && (
        <DataTable
          columns={columns}
          data={returns}
          searchPlaceholder="Search by return number..."
          searchColumn="returnNumber"
        />
      )}
    </div>
  );
}
