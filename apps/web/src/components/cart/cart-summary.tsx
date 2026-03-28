'use client';

import Link from 'next/link';
import { ArrowRight, LogIn, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatMoney } from '@/lib/utils/format';
import { useAuthStore } from '@/lib/stores/auth-store';

interface CartSummaryProps {
  /** Total price in cents */
  totalInCents: number;
  /** Number of items in the cart */
  itemCount: number;
}

/**
 * Cart summary sidebar showing subtotal, item count, and checkout CTA.
 * Shows "Proceed to Checkout" for authenticated users.
 * Shows "Sign in to Checkout" for guest users.
 */
export function CartSummary({ totalInCents, itemCount }: CartSummaryProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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

          <Separator />

          {/* Total */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary-600">{formatMoney(totalInCents)}</span>
          </div>
        </div>

        {/* Checkout CTA — different for authenticated vs guest users */}
        {isAuthenticated ? (
          <Link href="/checkout">
            <Button className="w-full mt-6 gap-2" size="lg">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div className="mt-6 space-y-3">
            <Link href="/login?redirect=/cart">
              <Button className="w-full gap-2" size="lg">
                <LogIn className="h-4 w-4" />
                Sign in to Checkout
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground">
              Your cart will be saved when you sign in
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
