'use client';

/**
 * StatusBadge — Maps status strings to appropriately colored badges.
 * Supports order, seller, product, return, dispute, and payout status types.
 */

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

/* ─────────────────── Color mapping ─────────────────── */

type BadgeColor = 'yellow' | 'blue' | 'purple' | 'amber' | 'red' | 'green' | 'indigo' | 'gray';

const colorClasses: Record<BadgeColor, string> = {
  yellow: 'border-yellow-200 bg-yellow-100 text-yellow-800',
  blue: 'border-blue-200 bg-blue-100 text-blue-800',
  purple: 'border-purple-200 bg-purple-100 text-purple-800',
  amber: 'border-amber-200 bg-amber-100 text-amber-800',
  red: 'border-red-200 bg-red-100 text-red-800',
  green: 'border-green-200 bg-green-100 text-green-800',
  indigo: 'border-indigo-200 bg-indigo-100 text-indigo-800',
  gray: 'border-gray-200 bg-gray-100 text-gray-800',
};

/* Status-to-color maps for each entity type */

const orderColors: Record<string, BadgeColor> = {
  PENDING_PAYMENT: 'yellow',
  CONFIRMED: 'blue',
  PROCESSING: 'blue',
  IN_PRODUCTION: 'purple',
  WAREHOUSE_RECEIVED: 'blue',
  QC_IN_PROGRESS: 'amber',
  QC_FAILED: 'red',
  PACKING: 'blue',
  DISPATCHED: 'indigo',
  DELIVERED: 'green',
  COMPLETED: 'green',
  CANCELLED: 'gray',
  FAILED: 'red',
};

const sellerColors: Record<string, BadgeColor> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  SUSPENDED: 'red',
  REJECTED: 'red',
};

const productColors: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  DISABLED: 'gray',
};

const returnColors: Record<string, BadgeColor> = {
  REQUESTED: 'yellow',
  UNDER_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  RECEIVED: 'blue',
  REFUNDED: 'green',
  CANCELLED: 'gray',
};

const disputeColors: Record<string, BadgeColor> = {
  OPEN: 'yellow',
  UNDER_REVIEW: 'blue',
  INVESTIGATING: 'purple',
  RESOLVED: 'green',
  CLOSED: 'gray',
  ESCALATED: 'red',
};

const payoutColors: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  APPROVED: 'blue',
  PAID: 'green',
  FAILED: 'red',
};

const warehouseColors: Record<string, BadgeColor> = {
  AWAITING_ARRIVAL: 'yellow',
  RECEIVED: 'blue',
  QC_PENDING: 'amber',
  QC_PASSED: 'green',
  QC_FAILED: 'red',
  PACKED: 'indigo',
  DISPATCHED: 'green',
};

const onDemandColors: Record<string, BadgeColor> = {
  SUBMITTED: 'yellow',
  UNDER_REVIEW: 'blue',
  QUOTED: 'purple',
  ACCEPTED: 'green',
  IN_PRODUCTION: 'indigo',
  COMPLETED: 'green',
  CANCELLED: 'gray',
  EXPIRED: 'red',
};

const colorMaps: Record<string, Record<string, BadgeColor>> = {
  order: orderColors,
  seller: sellerColors,
  product: productColors,
  return: returnColors,
  dispute: disputeColors,
  payout: payoutColors,
  warehouse: warehouseColors,
  onDemand: onDemandColors,
};

/* ─────────────────── Component ─────────────────── */

type StatusType = 'order' | 'seller' | 'product' | 'return' | 'dispute' | 'payout' | 'warehouse' | 'onDemand';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  /** The raw status string (e.g. "PENDING_PAYMENT") */
  status: string;
  /** Entity type — determines which color map to use. Defaults to auto-detect. */
  type?: StatusType;
}

/** Convert SNAKE_CASE to Title Case */
function formatLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/** Try all color maps to find a match */
function resolveColor(status: string, type?: StatusType): BadgeColor {
  if (type && colorMaps[type]) {
    return colorMaps[type][status] ?? 'gray';
  }
  // Auto-detect: try each map until we find a match
  for (const map of Object.values(colorMaps)) {
    if (map[status]) return map[status];
  }
  return 'gray';
}

function StatusBadge({ status, type, className, ...props }: StatusBadgeProps) {
  const color = resolveColor(status, type);

  return (
    <Badge
      variant="outline"
      className={cn(colorClasses[color], className)}
      {...props}
    >
      {formatLabel(status)}
    </Badge>
  );
}

export { StatusBadge };
export type { StatusBadgeProps, StatusType };
