'use client';

/**
 * Admin Payout Detail Page -- Full view of a single payout.
 *
 * Shows summary card (seller, period, amounts), status info,
 * line items DataTable, penalties, and context-sensitive actions.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/feedback/status-badge';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAdminPayoutDetail,
  useApprovePayout,
  useMarkPayoutPaid,
} from '@/lib/hooks/use-admin';
import { formatMoney, formatDate, formatDateTime } from '@/lib/utils/format';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, CreditCard, Loader2 } from 'lucide-react';

/** Shape of a payout line item. */
interface PayoutLineItem {
  id: string;
  orderNumber?: string;
  itemAmountCents?: number;
  commissionCents?: number;
  adjustmentCents?: number;
  netCents?: number;
}

/** Shape of a penalty record. */
interface Penalty {
  id: string;
  reason: string;
  amountCents: number;
  createdAt?: string;
}

export default function AdminPayoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const payoutId = params.id as string;

  // Mark Paid dialog state
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  const { data, isLoading, refetch } = useAdminPayoutDetail(payoutId);
  const payout = data?.payout ?? data;

  const approvePayout = useApprovePayout();
  const markPaid = useMarkPayoutPaid();

  function handleApprove() {
    approvePayout.mutate(payoutId, {
      onSuccess: () => {
        toast.success('Payout approved');
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Failed to approve payout');
      },
    });
  }

  function handleMarkPaid() {
    if (!paymentRef.trim()) {
      toast.error('Please enter a payment reference');
      return;
    }

    markPaid.mutate(
      { id: payoutId, paymentReference: paymentRef.trim() },
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

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Loading payout details...</p>;
  }

  if (!payout) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Payout not found.</p>
        <Button variant="ghost" onClick={() => router.push('/admin/payouts')}>
          Back to Payouts
        </Button>
      </div>
    );
  }

  const lineItems: PayoutLineItem[] = payout.lineItems ?? payout.items ?? [];
  const penalties: Penalty[] = payout.penalties ?? [];

  /** Line items column definitions. */
  const lineItemColumns: ColumnDef<PayoutLineItem, any>[] = [
    {
      accessorKey: 'orderNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order Number" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.orderNumber ?? 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'itemAmountCents',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Item Amount" />,
      cell: ({ row }) => (
        <span className="text-sm">{formatMoney(row.original.itemAmountCents ?? 0)}</span>
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
      accessorKey: 'adjustmentCents',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Adjustments" />,
      cell: ({ row }) => (
        <span className="text-sm">{formatMoney(row.original.adjustmentCents ?? 0)}</span>
      ),
    },
    {
      accessorKey: 'netCents',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Net" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{formatMoney(row.original.netCents ?? 0)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin/payouts')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Payouts
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Payout {payout.payoutNumber ?? payoutId.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Seller: {payout.sellerProfile?.businessName ?? payout.seller?.businessName ?? 'N/A'}
          </p>
        </div>
        <StatusBadge status={payout.status} type="payout" />
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payout Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Seller</span>
              <p className="font-medium">
                {payout.sellerProfile?.businessName ?? payout.seller?.businessName ?? 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Period</span>
              <p className="font-medium">
                {payout.cycleStart && payout.cycleEnd
                  ? `${formatDate(payout.cycleStart)} - ${formatDate(payout.cycleEnd)}`
                  : formatDate(payout.createdAt)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Order Value</span>
              <p className="font-medium">{formatMoney(payout.grossAmountCents ?? 0)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Commission</span>
              <p className="font-medium">{formatMoney(payout.commissionCents ?? 0)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Adjustments</span>
              <p className="font-medium">{formatMoney(payout.adjustmentCents ?? 0)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Net Payout</span>
              <p className="font-medium text-green-700">{formatMoney(payout.netAmountCents ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <StatusBadge status={payout.status} type="payout" />
            </div>
            {payout.approvedBy && (
              <p>
                <span className="text-muted-foreground">Approved by:</span>{' '}
                {payout.approvedBy.name ?? payout.approvedBy}
              </p>
            )}
            {payout.approvedAt && (
              <p>
                <span className="text-muted-foreground">Approved at:</span>{' '}
                {formatDateTime(payout.approvedAt)}
              </p>
            )}
            {payout.paidAt && (
              <p>
                <span className="text-muted-foreground">Paid at:</span>{' '}
                {formatDateTime(payout.paidAt)}
              </p>
            )}
            {payout.paymentReference && (
              <p>
                <span className="text-muted-foreground">Payment reference:</span>{' '}
                <span className="font-mono">{payout.paymentReference}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      {lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={lineItemColumns}
              data={lineItems}
              searchPlaceholder="Search by order number..."
              searchColumn="orderNumber"
            />
          </CardContent>
        </Card>
      )}

      {/* Penalties */}
      {penalties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Penalties Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {penalties.map((penalty) => (
                <div key={penalty.id} className="flex justify-between items-center border rounded p-3 text-sm">
                  <div>
                    <p className="font-medium">{penalty.reason}</p>
                    {penalty.createdAt && (
                      <p className="text-xs text-muted-foreground">{formatDate(penalty.createdAt)}</p>
                    )}
                  </div>
                  <span className="font-medium text-red-600">-{formatMoney(penalty.amountCents)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {(payout.status === 'DRAFT' || payout.status === 'APPROVED') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            {payout.status === 'DRAFT' && (
              <Button onClick={handleApprove} disabled={approvePayout.isPending}>
                {approvePayout.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Payout
                  </>
                )}
              </Button>
            )}

            {payout.status === 'APPROVED' && (
              <Button onClick={() => { setPaymentRef(''); setMarkPaidOpen(true); }}>
                <CreditCard className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </CardContent>
        </Card>
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
            <Label htmlFor="paymentRefDetail">Payment Reference</Label>
            <Input
              id="paymentRefDetail"
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
