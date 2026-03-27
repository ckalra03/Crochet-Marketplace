import { ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ProductType = 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';

interface ReturnPolicyCalloutProps {
  productType: ProductType;
  /** Raw return policy value from the API (e.g. DEFECT_ONLY, NO_RETURN, STANDARD). */
  returnPolicy?: string | null;
}

/** Contextual descriptions based on product type. */
const POLICY_INFO: Record<ProductType, { title: string; description: string }> = {
  READY_STOCK: {
    title: 'Returns Accepted',
    description: 'Returns accepted for defective items within 7 days of delivery.',
  },
  MADE_TO_ORDER: {
    title: 'Limited Returns',
    description: 'No returns for preference changes. Defect claims accepted within 7 days.',
  },
  ON_DEMAND: {
    title: 'Custom Item Policy',
    description: 'Custom items \u2014 no returns for preference changes. Defect claims accepted.',
  },
};

/**
 * Callout banner showing the applicable return policy based on
 * the product type. Uses the Alert component for consistent styling.
 */
export function ReturnPolicyCallout({ productType, returnPolicy }: ReturnPolicyCalloutProps) {
  const info = POLICY_INFO[productType] ?? POLICY_INFO.READY_STOCK;

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <ShieldCheck className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">{info.title}</AlertTitle>
      <AlertDescription className="text-blue-700">
        {info.description}
        {returnPolicy && returnPolicy !== 'STANDARD' && (
          <span className="block mt-1 text-xs text-blue-600">
            Policy: {returnPolicy.replace(/_/g, ' ').toLowerCase()}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
