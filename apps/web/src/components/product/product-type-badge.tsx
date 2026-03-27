import { cn } from '@/lib/utils/cn';

type ProductType = 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';

interface ProductTypeBadgeProps {
  type: ProductType;
  className?: string;
}

/** Color config for each product type. */
const TYPE_CONFIG: Record<ProductType, { label: string; classes: string }> = {
  READY_STOCK: {
    label: 'Ready Stock',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  MADE_TO_ORDER: {
    label: 'Made to Order',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  ON_DEMAND: {
    label: 'On Demand',
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
  },
};

/**
 * Color-coded badge indicating the product fulfilment type.
 * Emerald for Ready Stock, Amber for Made-to-Order, Violet for On-Demand.
 */
export function ProductTypeBadge({ type, className }: ProductTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.READY_STOCK;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
