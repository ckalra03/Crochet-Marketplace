'use client';

/**
 * OrderTimeline -- Specialized timeline for order status progression.
 *
 * Maps the order's current status to the generic Timeline component,
 * marking past steps as completed, highlighting the current step,
 * and dimming future steps.  Shows timestamps for key events when
 * the order object provides them (placedAt, shippedAt, deliveredAt).
 */

import { Timeline, type TimelineStep } from '@/components/feedback/timeline';
import { formatDateTime } from '@/lib/utils/format';

/** Ordered list of statuses a normal order progresses through */
const ORDER_STEPS = [
  'CONFIRMED',
  'PROCESSING',
  'WAREHOUSE_RECEIVED',
  'QC_IN_PROGRESS',
  'PACKING',
  'DISPATCHED',
  'DELIVERED',
  'COMPLETED',
] as const;

/** Human-readable labels for each status step */
const STEP_LABELS: Record<string, string> = {
  CONFIRMED: 'Order Confirmed',
  PROCESSING: 'Processing',
  WAREHOUSE_RECEIVED: 'Warehouse Received',
  QC_IN_PROGRESS: 'Quality Check',
  PACKING: 'Packing',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
};

/** Map status steps to known timestamp fields on the order object */
const TIMESTAMP_FIELDS: Record<string, string> = {
  CONFIRMED: 'placedAt',
  DISPATCHED: 'shippedAt',
  DELIVERED: 'deliveredAt',
  COMPLETED: 'completedAt',
};

interface OrderTimelineProps {
  /** The full order object */
  order: {
    status: string;
    placedAt?: string;
    createdAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    completedAt?: string;
    [key: string]: any;
  };
  className?: string;
}

function OrderTimeline({ order, className }: OrderTimelineProps) {
  const currentIndex = ORDER_STEPS.indexOf(order.status as typeof ORDER_STEPS[number]);

  // Build timeline steps from the ordered status list
  const steps: TimelineStep[] = ORDER_STEPS.map((step, i) => {
    // Determine step state relative to the current order status
    let status: TimelineStep['status'] = 'upcoming';
    if (currentIndex >= 0 && i < currentIndex) status = 'completed';
    if (i === currentIndex) status = 'current';

    // Resolve timestamp for this step if available
    const tsField = TIMESTAMP_FIELDS[step];
    const tsValue = tsField ? order[tsField] : undefined;
    // For the first step, fall back to createdAt if placedAt is absent
    const dateStr =
      step === 'CONFIRMED'
        ? tsValue || order.createdAt
        : tsValue;

    return {
      label: STEP_LABELS[step] ?? step.replace(/_/g, ' '),
      date: dateStr && status !== 'upcoming' ? formatDateTime(dateStr) : undefined,
      status,
    };
  });

  return <Timeline steps={steps} className={className} />;
}

export { OrderTimeline };
