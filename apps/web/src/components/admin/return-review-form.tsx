'use client';

/**
 * ReturnReviewForm -- Admin form to review and decide on a return request.
 * Resolution types: FULL_REFUND, PARTIAL_REFUND, REPLACEMENT, REJECTED.
 * Shows refund amount input (in INR, converted to cents) for PARTIAL_REFUND.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useReviewReturn } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';

const RESOLUTION_TYPES = [
  { value: 'FULL_REFUND', label: 'Full Refund' },
  { value: 'PARTIAL_REFUND', label: 'Partial Refund' },
  { value: 'REPLACEMENT', label: 'Replacement' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

interface ReturnReviewFormProps {
  returnId: string;
  onSuccess?: () => void;
}

function ReturnReviewForm({ returnId, onSuccess }: ReturnReviewFormProps) {
  const [decision, setDecision] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const reviewReturn = useReviewReturn();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!decision) {
      toast.error('Please select a resolution type.');
      return;
    }

    if (decision === 'PARTIAL_REFUND' && (!refundAmount || Number(refundAmount) <= 0)) {
      toast.error('Please enter a valid refund amount.');
      return;
    }

    const data: { decision: string; adminNotes?: string; refundAmountCents?: number } = {
      decision,
    };

    if (adminNotes.trim()) {
      data.adminNotes = adminNotes.trim();
    }

    if (decision === 'PARTIAL_REFUND') {
      // Convert INR to cents (paise)
      data.refundAmountCents = Math.round(Number(refundAmount) * 100);
    }

    reviewReturn.mutate(
      { id: returnId, data },
      {
        onSuccess: () => {
          toast.success('Return reviewed successfully.');
          setDecision('');
          setRefundAmount('');
          setAdminNotes('');
          onSuccess?.();
        },
        onError: () => {
          toast.error('Failed to submit review. Please try again.');
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Label>Resolution Type *</Label>
        <RadioGroup value={decision} onValueChange={setDecision}>
          {RESOLUTION_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <RadioGroupItem value={type.value} id={`decision-${type.value}`} />
              <Label htmlFor={`decision-${type.value}`} className="font-normal cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {decision === 'PARTIAL_REFUND' && (
        <div className="space-y-2">
          <Label htmlFor="refund-amount">Refund Amount (INR) *</Label>
          <Input
            id="refund-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="e.g. 500.00"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter amount in Rupees. It will be stored as paise internally.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="admin-notes">Admin Notes</Label>
        <Textarea
          id="admin-notes"
          placeholder="Optional notes about the decision..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={reviewReturn.isPending || !decision}>
        {reviewReturn.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}

export { ReturnReviewForm };
