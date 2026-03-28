'use client';

/**
 * Admin Sellers List Page
 * DataTable with status filter tabs, search, and row click navigation.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSellers } from '@/lib/hooks/use-admin';
import { createSeller } from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' });

  const { data, isLoading } = useAdminSellers(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const sellers: SellerRow[] = data?.sellers ?? [];

  function handleRowClick(id: string) {
    router.push(`/admin/sellers/${id}`);
  }

  async function handleCreateSeller() {
    if (!form.name || !form.email || !form.password || !form.businessName) {
      toast.error('All fields are required');
      return;
    }
    setCreating(true);
    try {
      await createSeller(form);
      toast.success('Seller created successfully');
      setDialogOpen(false);
      setForm({ name: '', email: '', password: '', businessName: '' });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.sellers() });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create seller');
    } finally {
      setCreating(false);
    }
  }

  const columns = getColumns(handleRowClick);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Seller Applications"
          description="Review and manage seller applications"
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Register Seller
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Seller</DialogTitle>
              <DialogDescription>
                Create a new seller account with an approved profile. The seller can log in immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="seller-name">Full Name</Label>
                <Input
                  id="seller-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-email">Email</Label>
                <Input
                  id="seller-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="seller@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-password">Password</Label>
                <Input
                  id="seller-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-business">Business Name</Label>
                <Input
                  id="seller-business"
                  value={form.businessName}
                  onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                  placeholder="Craft Studio"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSeller} disabled={creating}>
                {creating ? 'Creating...' : 'Create Seller'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
