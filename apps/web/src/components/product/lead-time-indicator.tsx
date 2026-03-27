import { Clock } from 'lucide-react';

type ProductType = 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';

interface LeadTimeIndicatorProps {
  productType: ProductType;
  /** Number of days for processing (relevant for Made-to-Order). */
  leadTimeDays?: number | null;
}

/**
 * Shows estimated processing/delivery time based on product type:
 * - Ready Stock: "In Stock -- Ships within 2-3 days"
 * - Made-to-Order: "Ships in {leadTimeDays} days"
 * - On-Demand: "Quote-based timeline"
 */
export function LeadTimeIndicator({ productType, leadTimeDays }: LeadTimeIndicatorProps) {
  let message: string;

  switch (productType) {
    case 'READY_STOCK':
      message = 'In Stock \u2014 Ships within 2\u20133 days';
      break;
    case 'MADE_TO_ORDER':
      message = leadTimeDays
        ? `Ships in ${leadTimeDays} day${leadTimeDays === 1 ? '' : 's'}`
        : 'Processing time to be confirmed';
      break;
    case 'ON_DEMAND':
      message = 'Quote-based timeline';
      break;
    default:
      message = 'Delivery timeline unavailable';
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Clock className="h-4 w-4 text-amber-600" />
      </div>
      <span className="font-medium text-[#1c1b1b]">{message}</span>
    </div>
  );
}
