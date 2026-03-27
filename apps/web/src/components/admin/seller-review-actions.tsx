'use client';

/**
 * SellerReviewActions -- Action panel for admin seller review.
 * Provides Approve, Reject, and Suspend buttons with confirmation dialogs.
 * Reject and Suspend require a reason via textarea.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import { useApproveSeller, useRejectSeller, useSuspendSeller } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';

interface SellerReviewActionsProps {
  sellerId: string;
  status: string;
}

function SellerReviewActions({ sellerId, status }: SellerReviewActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState('');

  const approveMutation = useApproveSeller();
  const rejectMutation = useRejectSeller();
  const suspendMutation = useSuspendSeller();

  const isLoading =
    approveMutation.isPending || rejectMutation.isPending || suspendMutation.isPending;

  function handleApprove() {
    approveMutation.mutate(sellerId, {
      onSuccess: () => toast.success('Seller approved successfully'),
      onError: (err: any) =>
        toast.error(err?.response?.data?.error || 'Failed to approve seller'),
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate(
      { id: sellerId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Seller rejected');
          setRejectOpen(false);
          setReason('');
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error || 'Failed to reject seller'),
      },
    );
  }

  function handleSuspend() {
    if (!reason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }
    suspendMutation.mutate(
      { id: sellerId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Seller suspended');
          setSuspendOpen(false);
          setReason('');
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error || 'Failed to suspend seller'),
      },
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Approve -- only for PENDING */}
      {status === 'PENDING' && (
        <ConfirmationDialog
          title="Approve Seller"
          description="Are you sure you want to approve this seller application? They will be able to list products immediately."
          onConfirm={handleApprove}
          confirmLabel="Approve"
        >
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading}
          >
            Approve
          </Button>
        </ConfirmationDialog>
      )}

      {/* Reject -- only for PENDING */}
      {status === 'PENDING' && (
        <>
          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={() => {
              setReason('');
              setRejectOpen(true);
            }}
          >
            Reject
          </Button>
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Seller Application</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this seller application. The seller will be
                  notified.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Rejection reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                >
                  Reject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Suspend -- only for APPROVED */}
      {status === 'APPROVED' && (
        <>
          <Button
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            disabled={isLoading}
            onClick={() => {
              setReason('');
              setSuspendOpen(true);
            }}
          >
            Suspend
          </Button>
          <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suspend Seller</DialogTitle>
                <DialogDescription>
                  Please provide a reason for suspending this seller. Their products will be hidden
                  from the storefront.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Suspension reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setSuspendOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={handleSuspend}
                  disabled={suspendMutation.isPending}
                >
                  Suspend
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

export { SellerReviewActions };
