'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CartItemList } from '@/components/cart/cart-item-list';
import { CartSummary } from '@/components/cart/cart-summary';
import { useCart } from '@/lib/hooks/use-cart';

/**
 * Cart page — displays all items in the buyer's cart with quantity controls,
 * grouped by seller. Shows a sticky order summary sidebar on desktop.
 * Handles empty cart and loading states.
 */
export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();

  // ── Loading skeleton ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="h-fit">
            <CardContent className="p-6 space-y-3">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse mt-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Failed to load your cart. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────
  const items = cart?.items || [];
  const totalInCents = cart?.totalInCents || 0;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Add some beautiful crochet items to get started!
        </p>
        <Link href="/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  // ── Cart with items ───────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item list — spans 2 columns on desktop */}
        <div className="lg:col-span-2">
          <CartItemList items={items} />
        </div>

        {/* Summary sidebar — sticky on desktop */}
        <div>
          <CartSummary totalInCents={totalInCents} itemCount={items.length} />
        </div>
      </div>
    </div>
  );
}
