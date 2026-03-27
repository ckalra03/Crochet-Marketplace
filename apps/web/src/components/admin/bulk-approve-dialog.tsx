'use client';

/**
 * BulkApproveDialog -- Dialog to confirm bulk approving selected payouts.
 * Shows count and total amount, then sequentially approves each payout.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApprovePayout } from '@/lib/hooks/use-admin';
import { formatMoney } from '@/lib/utils/format';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface BulkApproveDialogProps {
  /** Trigger element (e.g. a Button) */
  children: React.ReactNode;
  /** List of payout objects to approve */
  payouts: Array<{ id: string; netAmountCents?: number }>;
  /** Called after all payouts are approved */
  onComplete?: () => void;
}

export function BulkApproveDialog({ children, payouts, onComplete }: BulkApproveDialogProps) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const approvePayout = useApprovePayout();

  const totalAmount = payouts.reduce((sum, p) => sum + (p.netAmountCents ?? 0), 0);

  async function handleBulkApprove() {
    setProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const payout of payouts) {
      try {
        await approvePayout.mutateAsync(payout.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setProcessing(false);
    setOpen(false);

    if (failCount === 0) {
      toast.success(`All ${successCount} payouts approved successfully`);
    } else {
      toast.warning(`${successCount} approved, ${failCount} failed`);
    }

    onComplete?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Approve Payouts</DialogTitle>
          <DialogDescription>
            You are about to approve {payouts.length} payout{payouts.length === 1 ? '' : 's'} for
            a total of {formatMoney(totalAmount)}.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. Each payout will be approved sequentially.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleBulkApprove} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              `Approve ${payouts.length} Payout${payouts.length === 1 ? '' : 's'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
