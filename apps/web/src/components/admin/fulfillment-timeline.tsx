'use client';

/**
 * FulfillmentTimeline -- Visualizes warehouse item progression through
 * the fulfillment pipeline using the Timeline component.
 *
 * Steps: Awaiting Arrival -> Received -> QC Pending -> QC Passed/Failed -> Packed -> Dispatched
 */

import { Timeline, type TimelineStep } from '@/components/feedback/timeline';
import { formatDateTime } from '@/lib/utils/format';

/** Ordered list of fulfillment statuses with human-readable labels. */
const FULFILLMENT_STEPS = [
  { key: 'AWAITING_ARRIVAL', label: 'Awaiting Arrival' },
  { key: 'RECEIVED', label: 'Received' },
  { key: 'QC_PENDING', label: 'QC Pending' },
  { key: 'QC_PASSED', label: 'QC Passed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'DISPATCHED', label: 'Dispatched' },
] as const;

/** Alternate branch for QC failure. */
const QC_FAILED_KEY = 'QC_FAILED';

interface FulfillmentTimelineProps {
  /** Current warehouse item status (e.g. "QC_PENDING"). */
  currentStatus: string;
  /** Optional map of status -> ISO timestamp for when each step occurred. */
  timestamps?: Record<string, string>;
  /** Additional CSS classes on the wrapper. */
  className?: string;
}

/**
 * Maps the current warehouse item status to Timeline steps, marking each
 * as completed, current, or upcoming based on position in the flow.
 */
function FulfillmentTimeline({ currentStatus, timestamps = {}, className }: FulfillmentTimelineProps) {
  // Determine the index of the current status in the ordered list.
  // QC_FAILED maps to the QC_PASSED slot (same position, different label).
  const isQcFailed = currentStatus === QC_FAILED_KEY;
  const currentIndex = isQcFailed
    ? FULFILLMENT_STEPS.findIndex((s) => s.key === 'QC_PASSED')
    : FULFILLMENT_STEPS.findIndex((s) => s.key === currentStatus);

  const steps: TimelineStep[] = FULFILLMENT_STEPS.map((step, index) => {
    // Override label when QC failed
    const label = isQcFailed && step.key === 'QC_PASSED' ? 'QC Failed' : step.label;

    // Determine step state
    let status: TimelineStep['status'];
    if (index < currentIndex) {
      status = 'completed';
    } else if (index === currentIndex) {
      status = 'current';
    } else {
      status = 'upcoming';
    }

    // Attach timestamp if available
    const ts = timestamps[step.key] || (isQcFailed && step.key === 'QC_PASSED' ? timestamps[QC_FAILED_KEY] : undefined);

    return {
      label,
      status,
      date: ts ? formatDateTime(ts) : undefined,
    };
  });

  return <Timeline steps={steps} className={className} />;
}

export { FulfillmentTimeline };
export type { FulfillmentTimelineProps };
