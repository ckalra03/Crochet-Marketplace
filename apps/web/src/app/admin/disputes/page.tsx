'use client';

/**
 * Admin Disputes Page -- DataTable-based dispute management list.
 *
 * Features:
 * - Sortable columns: Dispute Number, Order Number, Type, Status, Raised By, Date
 * - Status filter tabs: All, Open, Investigating, Resolved, Closed
 * - Search by dispute number
 * - Click to navigate to /admin/disputes/{id}
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useAdminDisputes } from '@/lib/hooks/use-admin';
import { formatDate } from '@/lib/utils/format';
import { Eye } from 'lucide-react';

const STATUS_TABS = ['', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

interface DisputeRow {
  id: string;
  disputeNumber: string;
  type: string;
  status: string;
  createdAt: string;
  order?: { orderNumber: string };
  orderNumber?: string;
  user?: { name: string };
  raisedByName?: string;
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useAdminDisputes(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const disputes: DisputeRow[] = data?.disputes ?? data ?? [];

  const columns = useMemo<ColumnDef<DisputeRow, any>[]>(
    () => [
      {
        accessorKey: 'disputeNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dispute Number" />,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.disputeNumber}</span>
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
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.type?.replace(/_/g, ' ') ?? 'N/A'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} type="dispute" />,
      },
      {
        accessorKey: 'raisedBy',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Raised By" />,
        accessorFn: (row) => row.user?.name ?? row.raisedByName ?? 'N/A',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.user?.name ?? row.original.raisedByName ?? 'N/A'}
          </span>
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
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/disputes/${row.original.id}`)}
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
      <h1 className="text-2xl font-bold">Disputes Management</h1>

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
        <p className="text-center py-10 text-muted-foreground">Loading disputes...</p>
      )}

      {!isLoading && (
        <DataTable
          columns={columns}
          data={disputes}
          searchPlaceholder="Search by dispute number..."
          searchColumn="disputeNumber"
        />
      )}
    </div>
  );
}
