'use client';

/**
 * CartDrawer -- Slide-out side cart that opens from the right.
 * Shows cart items with quantity controls, totals, and checkout links.
 * Controlled by the Zustand cart store (isDrawerOpen / openDrawer / closeDrawer).
 */

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/lib/hooks/use-cart';
import { formatMoney } from '@/lib/utils/format';
import { CouponInput } from './coupon-input';
import { toast } from 'sonner';

export function CartDrawer() {
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  // Fetch cart data when drawer is open
  const { data: cart } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const items = cart?.items ?? [];
  const totalInCents = cart?.totalInCents ?? 0;

  /** Update quantity for a cart item */
  function handleQuantityChange(itemId: string, newQuantity: number) {
    updateMutation.mutate(
      { id: itemId, data: { quantity: newQuantity } },
      {
        onError: (err: any) => {
          toast.error(err.response?.data?.error || 'Failed to update quantity');
        },
      },
    );
  }

  /** Remove an item from the cart */
  function handleRemove(itemId: string) {
    removeMutation.mutate(itemId, {
      onSuccess: () => toast.success('Item removed'),
      onError: () => toast.error('Failed to remove item'),
    });
  }

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart ({items.length})
          </SheetTitle>
          <SheetDescription className="sr-only">
            Cart items and checkout options
          </SheetDescription>
        </SheetHeader>

        {/* Cart items list -- scrollable middle section */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-lg">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Browse our products and find something you love.
              </p>
              <Link href="/products" onClick={closeDrawer}>
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item: any) => {
                const lineTotal = (item.product.priceInCents || 0) * item.quantity;

                return (
                  <div key={item.id} className="flex gap-3">
                    {/* Product thumbnail */}
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product.media?.[0]?.filePath ? (
                        <img
                          src={item.product.media[0].filePath}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="text-sm font-medium hover:text-primary-600 line-clamp-1"
                        onClick={closeDrawer}
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatMoney(item.product.priceInCents || 0)} each
                      </p>

                      {/* Quantity controls + remove */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center border rounded">
                          <button
                            className="px-1.5 py-0.5 hover:bg-muted transition-colors disabled:opacity-40"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateMutation.isPending}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-medium min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="px-1.5 py-0.5 hover:bg-muted transition-colors disabled:opacity-40"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={updateMutation.isPending}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                          onClick={() => handleRemove(item.id)}
                          disabled={removeMutation.isPending}
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <p className="text-sm font-bold whitespace-nowrap">
                      {formatMoney(lineTotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with total and action buttons -- only show when cart has items */}
        {items.length > 0 && (
          <CartDrawerFooter totalInCents={totalInCents} closeDrawer={closeDrawer} />
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Footer sub-component with coupon input, subtotal, and checkout buttons. */
function CartDrawerFooter({ totalInCents, closeDrawer }: { totalInCents: number; closeDrawer: () => void }) {
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    type: string;
    discountCents: number;
  } | null>(null);

  const discountCents = appliedCoupon?.discountCents ?? 0;
  const finalTotal = Math.max(0, totalInCents - discountCents);

  return (
    <div className="border-t px-6 py-4 space-y-3">
      {/* Coupon input */}
      <CouponInput onCouponChange={setAppliedCoupon} appliedCoupon={appliedCoupon} />

      {appliedCoupon && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-{formatMoney(discountCents)}</span>
        </div>
      )}

      <Separator />

      {/* Cart total */}
      <div className="flex justify-between items-center">
        <span className="font-semibold">Subtotal</span>
        <span className="font-bold text-lg text-primary-600">
          {formatMoney(finalTotal)}
        </span>
      </div>

      <Separator />

      {/* Action buttons -- guests verify via OTP on the checkout page */}
      <div className="space-y-2">
        <Link href="/checkout" onClick={closeDrawer}>
          <Button className="w-full" size="lg">
            Checkout
          </Button>
        </Link>

        {/* View full cart page */}
        <Link href="/cart" onClick={closeDrawer}>
          <Button variant="outline" className="w-full">
            View Cart
          </Button>
        </Link>
      </div>
    </div>
  );
}
