'use client';

/**
 * OrderActions -- Context-aware action buttons based on order status.
 *
 * - Pre-dispatch (CONFIRMED, PROCESSING, etc.): "Cancel Order" with confirmation dialog
 * - DELIVERED: "Request Return" link and "Rate & Review" link
 * - Uses the useCancelOrder() mutation hook for cancellation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import { useCancelOrder } from '@/lib/hooks/use-orders';
import { toast } from 'sonner';
import { RotateCcw, Star, XCircle } from 'lucide-react';

/** Statuses where cancellation is allowed (before dispatch) */
const CANCELLABLE_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PROCESSING',
  'WAREHOUSE_RECEIVED',
  'QC_IN_PROGRESS',
  'PACKING',
];

interface OrderActionsProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
  };
}

function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();
  const cancelMutation = useCancelOrder();
  const [cancelReason] = useState('Buyer requested cancellation');

  const isCancellable = CANCELLABLE_STATUSES.includes(order.status);
  const isDelivered = order.status === 'DELIVERED';

  // Nothing to show for COMPLETED, CANCELLED, or FAILED orders
  if (!isCancellable && !isDelivered) return null;

  /** Handle order cancellation after user confirms */
  const handleCancel = () => {
    cancelMutation.mutate(
      { orderNumber: order.orderNumber, data: { reason: cancelReason } },
      {
        onSuccess: () => {
          toast.success(`Order ${order.orderNumber} has been cancelled.`);
          router.refresh();
        },
        onError: () => {
          toast.error('Could not cancel the order. Please try again.');
        },
      },
    );
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Cancel order button (pre-dispatch only) */}
      {isCancellable && (
        <ConfirmationDialog
          title="Cancel Order"
          description={`Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`}
          confirmLabel="Cancel Order"
          variant="destructive"
          onConfirm={handleCancel}
        >
          <Button variant="destructive" size="sm" disabled={cancelMutation.isPending}>
            <XCircle className="h-4 w-4 mr-1.5" />
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </ConfirmationDialog>
      )}

      {/* Return and review buttons (delivered only) */}
      {isDelivered && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/returns/new?orderId=${order.id}`)}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Request Return
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/orders/${order.orderNumber}/rate`)}
          >
            <Star className="h-4 w-4 mr-1.5" />
            Rate &amp; Review
          </Button>
        </>
      )}
    </div>
  );
}

export { OrderActions };
