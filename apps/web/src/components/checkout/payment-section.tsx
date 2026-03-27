'use client';

import { CreditCard, Loader2, AlertTriangle } from 'lucide-react';
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
  /** Called when the user clicks the pay button */
  onPay: () => void;
}

/**
 * Mock payment section for Phase 1.
 * Shows the total, a dev-mode disclaimer, and a "Pay" button
 * that triggers order creation (no real payment gateway).
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
          <CreditCard className="h-5 w-5" /> Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Dev mode notice */}
        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">Development mode</span> — payment is simulated.
            No real charges will be made.
          </p>
        </div>

        {/* Pay button */}
        <Button
          size="lg"
          className="w-full text-base"
          onClick={onPay}
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
            </>
          ) : (
            `Pay ${formatMoney(totalInCents)}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
