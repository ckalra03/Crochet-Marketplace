'use client';

/**
 * Admin On-Demand Requests Page -- DataTable-based request management list.
 *
 * Features:
 * - Sortable columns: Request Number, Buyer Name, Category, Budget Range, Status, Date, Actions
 * - Status filter tabs: All, Submitted, Under Review, Quoted, Accepted
 * - Search by request number
 * - Click to navigate to /admin/on-demand/{id}
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useAdminOnDemandRequests } from '@/lib/hooks/use-admin';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Eye } from 'lucide-react';

/** Status filter options shown as tabs. */
const STATUS_TABS = [
  '',              // All
  'SUBMITTED',
  'UNDER_REVIEW',
  'QUOTED',
  'ACCEPTED',
];

/** Shape of a request row coming from the API. */
interface RequestRow {
  id: string;
  requestNumber?: string;
  status: string;
  description: string;
  budgetMinCents?: number;
  budgetMaxCents?: number;
  categoryId?: string;
  category?: { name: string };
  createdAt: string;
  user?: { name: string; email: string };
}

export default function AdminOnDemandPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useAdminOnDemandRequests(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const requests: RequestRow[] = data?.requests ?? data ?? [];

  /** Column definitions for the DataTable. */
  const columns = useMemo<ColumnDef<RequestRow, any>[]>(
    () => [
      {
        accessorKey: 'requestNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Request #" />,
        accessorFn: (row) => row.requestNumber ?? row.id.slice(0, 8),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.requestNumber ?? row.original.id.slice(0, 8)}
          </span>
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
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        accessorFn: (row) => row.category?.name ?? 'N/A',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.category?.name ?? 'N/A'}</span>
        ),
      },
      {
        accessorKey: 'budgetRange',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Budget Range" />,
        accessorFn: (row) => row.budgetMinCents ?? 0,
        cell: ({ row }) => {
          const min = row.original.budgetMinCents;
          const max = row.original.budgetMaxCents;
          if (!min && !max) return <span className="text-sm text-muted-foreground">--</span>;
          if (min && max) return <span className="text-sm">{formatMoney(min)} - {formatMoney(max)}</span>;
          if (min) return <span className="text-sm">From {formatMoney(min)}</span>;
          return <span className="text-sm">Up to {formatMoney(max!)}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} type="onDemand" />,
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
            onClick={() => router.push(`/admin/on-demand/${row.original.id}`)}
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
      <h1 className="text-2xl font-bold">On-Demand Requests</h1>

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
        <p className="text-center py-10 text-muted-foreground">Loading requests...</p>
      )}

      {/* Requests table */}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={requests}
          searchPlaceholder="Search by request number..."
          searchColumn="requestNumber"
        />
      )}
    </div>
  );
}
