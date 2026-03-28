'use client';

/**
 * CouponInput -- Text input for applying a coupon code to the cart.
 * Shows success/error messages and allows removing an applied coupon.
 */

import { useState } from 'react';
import { Tag, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applyCoupon } from '@/lib/api/cart';
import { formatMoney } from '@/lib/utils/format';

interface CouponResult {
  couponId: string;
  code: string;
  type: string;
  discountCents: number;
}

interface CouponInputProps {
  /** Called when a coupon is applied or removed. Passes discount in cents (0 if removed). */
  onCouponChange: (coupon: CouponResult | null) => void;
  /** The currently applied coupon, if any. */
  appliedCoupon: CouponResult | null;
}

export function CouponInput({ onCouponChange, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /** Apply the coupon code */
  async function handleApply() {
    if (!code.trim()) return;
    setError('');
    setIsLoading(true);

    try {
      const result = await applyCoupon(code.trim());
      onCouponChange(result);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid coupon code');
    } finally {
      setIsLoading(false);
    }
  }

  /** Remove the applied coupon */
  function handleRemove() {
    onCouponChange(null);
    setError('');
  }

  // If a coupon is already applied, show the success state
  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-700">
            {appliedCoupon.code}
          </span>
          <span className="text-green-600">
            &mdash; {formatMoney(appliedCoupon.discountCents)} off
          </span>
        </div>
        <button
          onClick={handleRemove}
          className="text-green-600 hover:text-red-500 transition-colors"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError('');
          }}
          placeholder="Coupon code"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          disabled={isLoading}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || isLoading}
          className="shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
