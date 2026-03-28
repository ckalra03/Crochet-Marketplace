'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatMoney } from '@/lib/utils/format';
import { CouponInput } from './coupon-input';

interface CouponResult {
  couponId: string;
  code: string;
  type: string;
  discountCents: number;
}

interface CartSummaryProps {
  /** Total price in cents */
  totalInCents: number;
  /** Number of items in the cart */
  itemCount: number;
}

/**
 * Cart summary sidebar showing subtotal, item count, and checkout CTA.
 * Always shows "Proceed to Checkout" -- guest users will verify via OTP on the checkout page.
 */
export function CartSummary({ totalInCents, itemCount }: CartSummaryProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  // Calculate final total after coupon discount
  const discountCents = appliedCoupon?.discountCents ?? 0;
  const finalTotal = Math.max(0, totalInCents - discountCents);

  return (
    <Card className="h-fit sticky top-20">
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
        </h3>

        <div className="space-y-3 text-sm">
          {/* Item count */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Items ({itemCount})
            </span>
            <span>{formatMoney(totalInCents)}</span>
          </div>

          {/* Shipping — free for now */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>

          {/* Coupon input */}
          <Separator />
          <CouponInput
            onCouponChange={setAppliedCoupon}
            appliedCoupon={appliedCoupon}
          />

          {/* Discount line -- only show when a coupon is applied */}
          {appliedCoupon && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatMoney(discountCents)}</span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary-600">{formatMoney(finalTotal)}</span>
          </div>
        </div>

        {/* Checkout CTA -- guests verify via OTP on the checkout page */}
        <Link href="/checkout">
          <Button className="w-full mt-6 gap-2" size="lg">
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
