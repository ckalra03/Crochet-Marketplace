'use client';

/**
 * Admin Penalty Management Page (A-16)
 *
 * Full penalty management interface for administrators:
 * - DataTable of all penalties with ID, Seller, Type (StatusBadge), Amount, Status, Date, Actions
 * - Status filter tabs: All / Pending / Applied / Waived
 * - "Create Penalty" button opens a dialog with seller selector, type, amount, reason
 * - "Waive" action on PENDING penalties with ConfirmationDialog
 *
 * Data is managed via useAdminPenalties(), useCreatePenalty(), useWaivePenalty().
 */

import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Ban } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminPenalties,
  useCreatePenalty,
  useWaivePenalty,
  useAdminSellers,
} from '@/lib/hooks/use-admin';
import { formatMoney, formatDate, getStatusLabel } from '@/lib/utils/format';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── Penalty type options ─── */

const PENALTY_TYPES = ['QC_FAILURE', 'SLA_BREACH', 'RETURN_LIABILITY', 'OTHER'] as const;

/* ─── Status filter options ─── */

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'WAIVED', label: 'Waived' },
];

/* ─── Penalty row type ─── */

interface Penalty {
  id: string;
  sellerBusinessName?: string;
  sellerName?: string;
  type: string;
  amountInCents: number;
  status: string;
  reason?: string;
  createdAt: string;
}

/* ─── Page component ─── */

export default function AdminPenaltiesPage() {
  // Filter and dialog state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for the create penalty dialog
  const [formSeller, setFormSeller] = useState('');
  const [formType, setFormType] = useState<string>('');
  const [formAmountInr, setFormAmountInr] = useState('');
  const [formReason, setFormReason] = useState('');

  // Build query params
  const queryParams = useMemo(
    () => ({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
    [statusFilter],
  );

  // Fetch penalties and sellers (for the create form dropdown)
  const { data: penaltyData, isLoading } = useAdminPenalties(queryParams);
  const { data: sellerData } = useAdminSellers({ status: 'APPROVED', limit: 100 });
  const createPenalty = useCreatePenalty();
  const waivePenalty = useWaivePenalty();

  // Extract arrays
  const penalties: Penalty[] = useMemo(() => {
    if (!penaltyData) return [];
    return penaltyData.data ?? penaltyData ?? [];
  }, [penaltyData]);

  const sellers: any[] = useMemo(() => {
    if (!sellerData) return [];
    return sellerData.data ?? sellerData ?? [];
  }, [sellerData]);

  /** Handle penalty creation form submission. */
  function handleCreatePenalty() {
    // Validate required fields
    if (!formSeller || !formType || !formAmountInr || !formReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Convert INR to cents (e.g., 150.50 => 15050)
    const amountInCents = Math.round(parseFloat(formAmountInr) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    createPenalty.mutate(
      {
        sellerProfileId: formSeller,
        type: formType as any,
        amountInCents,
        reason: formReason,
      },
      {
        onSuccess: () => {
          toast.success('Penalty created successfully');
          // Reset form and close dialog
          setFormSeller('');
          setFormType('');
          setFormAmountInr('');
          setFormReason('');
          setDialogOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Failed to create penalty');
        },
      },
    );
  }

  /** Handle waiving a penalty. */
  function handleWaivePenalty(id: string) {
    waivePenalty.mutate(id, {
      onSuccess: () => {
        toast.success('Penalty waived successfully');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Failed to waive penalty');
      },
    });
  }

  /* ─── Table column definitions (defined inside component for access to handleWaive) ─── */

  const columns: ColumnDef<Penalty, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Penalty ID" />,
        cell: ({ row }) => {
          const id: string = row.getValue('id');
          // Show first 8 chars for readability
          return <span className="font-mono text-xs">{id.slice(0, 8)}...</span>;
        },
      },
      {
        accessorKey: 'sellerBusinessName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Seller" />,
        cell: ({ row }) =>
          row.original.sellerBusinessName || row.original.sellerName || 'Unknown',
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => <StatusBadge status={row.getValue('type')} />,
      },
      {
        accessorKey: 'amountInCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => formatMoney(row.getValue('amountInCents')),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => formatDate(row.getValue('createdAt')),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const penalty = row.original;
          // Only show Waive for PENDING penalties
          if (penalty.status !== 'PENDING') return null;

          return (
            <ConfirmationDialog
              title="Waive Penalty"
              description={`Are you sure you want to waive this ${getStatusLabel(penalty.type)} penalty of ${formatMoney(penalty.amountInCents)}? This action cannot be undone.`}
              confirmLabel="Waive"
              variant="destructive"
              onConfirm={() => handleWaivePenalty(penalty.id)}
            >
              <Button variant="outline" size="sm">
                <Ban className="h-4 w-4 mr-1" />
                Waive
              </Button>
            </ConfirmationDialog>
          );
        },
      },
    ],
    [],
  );

  // Loading skeleton
  if (isLoading) return <PenaltiesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Penalty Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, view, and manage seller penalties across the platform.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Penalty
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Penalties table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Penalties
            {statusFilter !== 'ALL' && ` (${statusFilter})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={penalties}
            searchPlaceholder="Search by seller..."
            searchColumn="sellerBusinessName"
          />
        </CardContent>
      </Card>

      {/* Create Penalty Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Penalty</DialogTitle>
            <DialogDescription>
              Issue a new penalty to a seller. The amount is entered in INR and
              automatically converted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Seller selector */}
            <div className="space-y-2">
              <Label htmlFor="penalty-seller">Seller</Label>
              <Select value={formSeller} onValueChange={setFormSeller}>
                <SelectTrigger id="penalty-seller">
                  <SelectValue placeholder="Select a seller" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller: any) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.businessName || seller.user?.name || seller.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Penalty type */}
            <div className="space-y-2">
              <Label htmlFor="penalty-type">Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger id="penalty-type">
                  <SelectValue placeholder="Select penalty type" />
                </SelectTrigger>
                <SelectContent>
                  {PENALTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getStatusLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount in INR */}
            <div className="space-y-2">
              <Label htmlFor="penalty-amount">Amount (INR)</Label>
              <Input
                id="penalty-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 500.00"
                value={formAmountInr}
                onChange={(e) => setFormAmountInr(e.target.value)}
              />
              {formAmountInr && !isNaN(parseFloat(formAmountInr)) && (
                <p className="text-xs text-muted-foreground">
                  = {Math.round(parseFloat(formAmountInr) * 100)} cents
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="penalty-reason">Reason</Label>
              <Textarea
                id="penalty-reason"
                placeholder="Describe the reason for this penalty..."
                rows={3}
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePenalty}
              disabled={createPenalty.isPending}
            >
              {createPenalty.isPending ? 'Creating...' : 'Create Penalty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Loading skeleton ─── */

function PenaltiesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
