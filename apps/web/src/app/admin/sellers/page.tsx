'use client';

/**
 * Admin Sellers List Page
 * DataTable with status filter tabs, search, and row click navigation.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSellers } from '@/lib/hooks/use-admin';
import { formatDate } from '@/lib/utils/format';

/* ─── Status filter tabs ─── */

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Rejected', value: 'REJECTED' },
] as const;

/* ─── Column definitions ─── */

interface SellerRow {
  id: string;
  businessName: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

function getColumns(onRowClick: (id: string) => void): ColumnDef<SellerRow, any>[] {
  return [
    {
      accessorKey: 'businessName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Business Name" />
      ),
      cell: ({ row }) => (
        <button
          className="text-left font-medium hover:underline"
          onClick={() => onRowClick(row.original.id)}
        >
          {row.original.businessName}
        </button>
      ),
    },
    {
      id: 'applicantName',
      accessorFn: (row) => row.user?.name ?? '-',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Applicant Name" />
      ),
    },
    {
      id: 'email',
      accessorFn: (row) => row.user?.email ?? '-',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} type="seller" />,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Applied Date" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRowClick(row.original.id)}
        >
          View
        </Button>
      ),
    },
  ];
}

/* ─── Page component ─── */

export default function AdminSellersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useAdminSellers(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const sellers: SellerRow[] = data?.sellers ?? [];

  function handleRowClick(id: string) {
    router.push(`/admin/sellers/${id}`);
  }

  const columns = getColumns(handleRowClick);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Applications"
        description="Review and manage seller applications"
      />

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sellers}
          searchPlaceholder="Search by business name..."
          searchColumn="businessName"
        />
      )}
    </div>
  );
}
