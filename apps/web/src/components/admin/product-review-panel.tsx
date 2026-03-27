'use client';

/**
 * ProductReviewPanel -- Action panel for admin product approval/rejection.
 * Shows Approve (green) and Reject (red) buttons.
 * Approve triggers a confirmation dialog; Reject opens a dialog with a required reason textarea.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApproveProduct, useRejectProduct } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

interface ProductReviewPanelProps {
  productId: string;
  productName: string;
  /** Called after a successful approve or reject action. */
  onActionComplete?: () => void;
}

export function ProductReviewPanel({
  productId,
  productName,
  onActionComplete,
}: ProductReviewPanelProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useApproveProduct();
  const rejectMutation = useRejectProduct();

  async function handleApprove() {
    try {
      await approveMutation.mutateAsync(productId);
      toast.success(`"${productName}" has been approved`);
      setApproveOpen(false);
      onActionComplete?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to approve product');
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: productId, reason: rejectReason.trim() });
      toast.success(`"${productName}" has been rejected`);
      setRejectOpen(false);
      setRejectReason('');
      onActionComplete?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reject product');
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => setApproveOpen(true)}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="destructive"
          onClick={() => setRejectOpen(true)}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve &quot;{productName}&quot;? It will become visible to
              buyers on the marketplace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Confirm Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog with Reason */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting &quot;{productName}&quot;. The seller will see this
              reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this product is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectOpen(false); setRejectReason(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
