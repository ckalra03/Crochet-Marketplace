'use client';

import { Banknote, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils/format';

interface PaymentSectionProps {
  /** Total amount to pay in cents */
  totalInCents: number;
  /** Whether the payment button should be disabled */
  disabled?: boolean;
  /** Whether an order creation is currently in progress */
  loading?: boolean;
  /** Called when the user clicks the place order button */
  onPay: () => void;
}

/**
 * Payment section for checkout — COD (Cash on Delivery) only for now.
 * Shows a COD radio option (pre-selected), a note about paying on delivery,
 * and the place order button.
 */
export function PaymentSection({
  totalInCents,
  disabled = false,
  loading = false,
  onPay,
}: PaymentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Banknote className="h-5 w-5" /> Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* COD radio — only option for now, always selected */}
        <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary-600 bg-primary-50/50 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked
            readOnly
            className="w-4 h-4 text-primary-600 accent-primary-600"
          />
          <div className="flex-1">
            <span className="font-semibold text-sm">Cash on Delivery (COD)</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pay when your order arrives
            </p>
          </div>
          <Banknote className="h-5 w-5 text-primary-600" />
        </label>

        {/* Total display */}
        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <span className="text-muted-foreground">Amount to pay on delivery</span>
          <span className="text-lg font-bold text-primary-600">
            {formatMoney(totalInCents)}
          </span>
        </div>

        {/* Place order button */}
        <Button
          size="lg"
          className="w-full text-base"
          onClick={onPay}
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...
            </>
          ) : (
            `Place Order — ${formatMoney(totalInCents)}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
