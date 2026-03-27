'use client';

/**
 * OrderTabs -- Tab navigation for filtering orders by status group.
 *
 * Groups:
 *   All      = every order
 *   Active   = CONFIRMED, PROCESSING, WAREHOUSE_RECEIVED, QC_IN_PROGRESS, PACKING, DISPATCHED
 *   Completed = DELIVERED, COMPLETED
 *   Cancelled = CANCELLED, FAILED
 *
 * Each tab shows the count of matching orders and switches the filter in the parent.
 */

import { cn } from '@/lib/utils/cn';

/** All possible tab values */
export type OrderTab = 'all' | 'active' | 'completed' | 'cancelled';

/** Status strings grouped by tab */
const ACTIVE_STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'WAREHOUSE_RECEIVED',
  'QC_IN_PROGRESS',
  'PACKING',
  'DISPATCHED',
];
const COMPLETED_STATUSES = ['DELIVERED', 'COMPLETED'];
const CANCELLED_STATUSES = ['CANCELLED', 'FAILED'];

/** Determine which tab an order status belongs to */
export function getTabForStatus(status: string): OrderTab {
  if (ACTIVE_STATUSES.includes(status)) return 'active';
  if (COMPLETED_STATUSES.includes(status)) return 'completed';
  if (CANCELLED_STATUSES.includes(status)) return 'cancelled';
  return 'all'; // fallback (e.g. PENDING_PAYMENT)
}

/** Filter orders array by selected tab */
export function filterOrdersByTab(orders: any[], tab: OrderTab): any[] {
  if (tab === 'all') return orders;
  return orders.filter((o) => getTabForStatus(o.status) === tab);
}

/** Count orders per tab */
function countByTab(orders: any[]): Record<OrderTab, number> {
  const counts: Record<OrderTab, number> = { all: orders.length, active: 0, completed: 0, cancelled: 0 };
  for (const o of orders) {
    const t = getTabForStatus(o.status);
    if (t !== 'all') counts[t]++;
  }
  return counts;
}

interface OrderTabsProps {
  /** All orders (unfiltered) to compute counts */
  orders: any[];
  /** Currently selected tab */
  activeTab: OrderTab;
  /** Callback when user clicks a tab */
  onTabChange: (tab: OrderTab) => void;
}

const TAB_LABELS: { key: OrderTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function OrderTabs({ orders, activeTab, onTabChange }: OrderTabsProps) {
  const counts = countByTab(orders);

  return (
    <div className="flex gap-1 border-b mb-6 overflow-x-auto">
      {TAB_LABELS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
            activeTab === key
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300',
          )}
        >
          {label}
          {/* Count badge */}
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
              activeTab === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600',
            )}
          >
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}

export { OrderTabs };
