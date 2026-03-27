'use client';

/**
 * OrderStatusAdvance -- Button + confirmation dialog to advance an order
 * to the next valid status in the fulfillment pipeline.
 *
 * Shows current status, allows selecting the target status from allowed
 * transitions, and requires confirmation before executing.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/feedback/status-badge';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import { useUpdateOrderStatus } from '@/lib/hooks/use-admin';
import { getStatusLabel } from '@/lib/utils/format';
import { toast } from 'sonner';

/** Valid order status transitions map. */
const TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['WAREHOUSE_RECEIVED', 'IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['WAREHOUSE_RECEIVED'],
  WAREHOUSE_RECEIVED: ['QC_IN_PROGRESS'],
  QC_IN_PROGRESS: ['PACKING', 'QC_FAILED'],
  QC_FAILED: ['WAREHOUSE_RECEIVED', 'CANCELLED'],
  PACKING: ['DISPATCHED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
};

interface OrderStatusAdvanceProps {
  /** The order number to update. */
  orderNumber: string;
  /** Current order status. */
  currentStatus: string;
  /** Optional callback after successful status change. */
  onSuccess?: () => void;
}

function OrderStatusAdvance({ orderNumber, currentStatus, onSuccess }: OrderStatusAdvanceProps) {
  const allowedTransitions = TRANSITIONS[currentStatus] ?? [];
  const [targetStatus, setTargetStatus] = useState(allowedTransitions[0] ?? '');

  const updateStatus = useUpdateOrderStatus();

  // No transitions available -- order is in a terminal state
  if (allowedTransitions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Current:</span>
        <StatusBadge status={currentStatus} type="order" />
        <span>(No further transitions)</span>
      </div>
    );
  }

  /** Execute the status advancement. */
  function handleAdvance() {
    if (!targetStatus) return;

    updateStatus.mutate(
      { orderNumber, data: { status: targetStatus } },
      {
        onSuccess: () => {
          toast.success(`Order advanced to ${getStatusLabel(targetStatus)}`);
          onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Failed to update status');
        },
      },
    );
  }

  const isDestructive = targetStatus === 'CANCELLED' || targetStatus === 'QC_FAILED';

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Current status */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Current:</span>
        <StatusBadge status={currentStatus} type="order" />
      </div>

      {/* Target status selector */}
      <Select value={targetStatus} onValueChange={setTargetStatus}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select next status" />
        </SelectTrigger>
        <SelectContent>
          {allowedTransitions.map((status) => (
            <SelectItem key={status} value={status}>
              {getStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Advance button with confirmation */}
      <ConfirmationDialog
        title="Advance Order Status"
        description={`Are you sure you want to change order ${orderNumber} from "${getStatusLabel(currentStatus)}" to "${getStatusLabel(targetStatus)}"?`}
        confirmLabel="Advance"
        variant={isDestructive ? 'destructive' : 'default'}
        onConfirm={handleAdvance}
      >
        <Button
          variant={isDestructive ? 'destructive' : 'default'}
          size="sm"
          disabled={updateStatus.isPending || !targetStatus}
        >
          {updateStatus.isPending ? 'Updating...' : 'Advance Status'}
        </Button>
      </ConfirmationDialog>
    </div>
  );
}

export { OrderStatusAdvance };
export type { OrderStatusAdvanceProps };
