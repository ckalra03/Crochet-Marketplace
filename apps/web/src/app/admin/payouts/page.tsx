'use client';

/**
 * Admin Payouts Page -- Payout cycle generation and payout management.
 *
 * Features:
 * - PayoutCycleSelector at top for generating new payout cycles
 * - DataTable with sortable columns: Payout Number, Seller, Period, Gross, Commission, Net, Status, Actions
 * - Status filter tabs: All, Draft, Approved, Paid
 * - Actions: Approve (DRAFT), Mark Paid (APPROVED), View detail
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PayoutCycleSelector } from '@/components/admin/payout-cycle-selector';
import { BulkApproveDialog } from '@/components/admin/bulk-approve-dialog';
import {
  useAdminPayouts,
  useApprovePayout,
  useMarkPayoutPaid,
} from '@/lib/hooks/use-admin';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, CreditCard, Eye, Loader2 } from 'lucide-react';

/** Status filter tabs. */
const STATUS_TABS = ['', 'DRAFT', 'APPROVED', 'PAID'];

/** Shape of a payout row from the API. */
interface PayoutRow {
  id: string;
  payoutNumber?: string;
  status: string;
  cycleStart?: string;
  cycleEnd?: string;
  grossAmountCents?: number;
  commissionCents?: number;
  netAmountCents?: number;
  paymentReference?: string;
  paidAt?: string;
  createdAt: string;
  sellerProfile?: { businessName: string };
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  // Mark Paid dialog state
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidId, setMarkPaidId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const { data, isLoading, refetch } = useAdminPayouts(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const payouts: PayoutRow[] = data?.payouts ?? data?.items ?? [];

  const approvePayout = useApprovePayout();
  const markPaid = useMarkPayoutPaid();

  /** Approve a single payout. */
  function handleApprove(id: string) {
    approvePayout.mutate(id, {
      onSuccess: () => {
        toast.success('Payout approved');
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Failed to approve payout');
      },
    });
  }

  /** Open the Mark Paid dialog. */
  function openMarkPaid(id: string) {
    setMarkPaidId(id);
    setPaymentRef('');
    setMarkPaidOpen(true);
  }

  /** Submit Mark Paid with payment reference. */
  function handleMarkPaid() {
    if (!paymentRef.trim()) {
      toast.error('Please enter a payment reference');
      return;
    }

    markPaid.mutate(
      { id: markPaidId, paymentReference: paymentRef.trim() },
      {
        onSuccess: () => {
          toast.success('Payout marked as paid');
          setMarkPaidOpen(false);
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Failed to mark payout as paid');
        },
      },
    );
  }

  /** Get draft payouts for bulk approve. */
  const draftPayouts = payouts.filter((p) => p.status === 'DRAFT');

  /** Column definitions. */
  const columns = useMemo<ColumnDef<PayoutRow, any>[]>(
    () => [
      {
        accessorKey: 'payoutNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Payout #" />,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.payoutNumber ?? row.original.id.slice(0, 8)}
          </span>
        ),
      },
      {
        accessorKey: 'seller',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Seller" />,
        accessorFn: (row) => row.sellerProfile?.businessName ?? 'N/A',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'period',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
        accessorFn: (row) => {
          if (row.cycleStart && row.cycleEnd) {
            return `${formatDate(row.cycleStart)} - ${formatDate(row.cycleEnd)}`;
          }
          return formatDate(row.createdAt);
        },
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'grossAmountCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Gross" />,
        cell: ({ row }) => (
          <span className="text-sm">{formatMoney(row.original.grossAmountCents ?? 0)}</span>
        ),
      },
      {
        accessorKey: 'commissionCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Commission" />,
        cell: ({ row }) => (
          <span className="text-sm">{formatMoney(row.original.commissionCents ?? 0)}</span>
        ),
      },
      {
        accessorKey: 'netAmountCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Net" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatMoney(row.original.netAmountCents ?? 0)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} type="payout" />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const payout = row.original;

          return (
            <div className="flex gap-2">
              {payout.status === 'DRAFT' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(payout.id)}
                  disabled={approvePayout.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}

              {payout.status === 'APPROVED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openMarkPaid(payout.id)}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Mark Paid
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/payouts/${payout.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, approvePayout.isPending],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payout Management</h1>

      {/* Payout cycle generator */}
      <PayoutCycleSelector />

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {STATUS_TABS.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </Button>
        ))}

        {/* Bulk approve button for draft payouts */}
        {draftPayouts.length > 0 && (
          <BulkApproveDialog payouts={draftPayouts} onComplete={() => refetch()}>
            <Button size="sm" variant="secondary" className="ml-4">
              Bulk Approve ({draftPayouts.length})
            </Button>
          </BulkApproveDialog>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <p className="text-center py-10 text-muted-foreground">Loading payouts...</p>
      )}

      {/* Empty state */}
      {!isLoading && payouts.length === 0 && (
        <p className="text-center py-10 text-muted-foreground">
          No payouts found. Generate a payout cycle to get started.
        </p>
      )}

      {/* Payouts table */}
      {!isLoading && payouts.length > 0 && (
        <DataTable
          columns={columns}
          data={payouts}
          searchPlaceholder="Search by seller..."
          searchColumn="seller"
        />
      )}

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              Enter the payment reference (e.g. bank transfer ID, UPI reference).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="paymentRef">Payment Reference</Label>
            <Input
              id="paymentRef"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. TXN123456789"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)} disabled={markPaid.isPending}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={markPaid.isPending}>
              {markPaid.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
