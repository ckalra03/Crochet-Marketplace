'use client';

import { ShoppingBag, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatMoney } from '@/lib/utils/format';

interface CartItemProduct {
  id: string;
  name: string;
  priceInCents: number;
  productType: string;
  media?: { filePath: string }[];
}

interface CartItemData {
  id: string;
  quantity: number;
  product: CartItemProduct;
}

interface OrderSummaryProps {
  /** Cart items to display */
  items: CartItemData[];
  /** Total price in cents */
  totalInCents: number;
  /** Whether the policy acknowledgment checkbox is checked */
  policyAcknowledged: boolean;
  /** Called when the policy checkbox changes */
  onPolicyChange: (checked: boolean) => void;
}

/**
 * Readonly order summary shown during checkout.
 * Displays item list with thumbnails, subtotal, shipping, total,
 * and a policy acknowledgment checkbox for MTO/On-Demand items.
 */
export function OrderSummary({
  items,
  totalInCents,
  policyAcknowledged,
  onPolicyChange,
}: OrderSummaryProps) {
  // Check if any items are MTO or On-Demand (non-returnable)
  const hasMtoOrOnDemand = items.some(
    (item) =>
      item.product.productType === 'MADE_TO_ORDER' ||
      item.product.productType === 'ON_DEMAND',
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Item list */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden">
                {item.product.media?.[0]?.filePath ? (
                  <img
                    src={item.product.media[0].filePath}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                )}
              </div>

              {/* Name and quantity */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>

              {/* Line total */}
              <p className="text-sm font-semibold">
                {formatMoney(item.product.priceInCents * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Pricing breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(totalInCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary-600">{formatMoney(totalInCents)}</span>
          </div>
        </div>

        {/* Policy acknowledgment */}
        <div className="mt-4 p-3 border rounded-md bg-muted/30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={policyAcknowledged}
              onChange={(e) => onPolicyChange(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Return Policy Acknowledgment
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasMtoOrOnDemand
                  ? 'I understand that Made-to-Order and Custom items are non-returnable except for defects, wrong items, or transit damage. Ready Stock items accept defect-only returns within 7 days.'
                  : 'I understand that Ready Stock items accept defect-only returns within 7 days of delivery. Refunds are processed after warehouse inspection.'}
              </p>
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
