'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/lib/hooks/use-cart';
import { toast } from 'sonner';

interface AddToCartSectionProps {
  productId: string;
  /** Current stock level (relevant for Ready Stock items). */
  stockQuantity?: number;
  productType: 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';
  /** Price in cents. If null/0 the item cannot be carted (e.g. On-Demand). */
  priceInCents?: number | null;
}

/**
 * Quantity selector + Add to Cart button.
 * Works for both authenticated and guest users.
 * Guest carts use X-Session-ID header (handled by Axios interceptor).
 */
export function AddToCartSection({
  productId,
  stockQuantity,
  productType,
  priceInCents,
}: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();

  // On-Demand items or items without a price cannot be added to cart
  if (productType === 'ON_DEMAND' || !priceInCents) {
    return null;
  }

  const isOutOfStock = productType === 'READY_STOCK' && (stockQuantity ?? 0) <= 0;

  function handleAdd() {
    addToCart.mutate(
      { productId, quantity },
      {
        onSuccess: () => toast.success('Added to cart!'),
        onError: (err: any) =>
          toast.error(err.response?.data?.error || 'Failed to add to cart'),
      },
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Quantity selector */}
      <div className="flex items-center border rounded-md">
        <button
          className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-40"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
          {quantity}
        </span>
        <button
          className="px-3 py-2 hover:bg-muted transition-colors"
          onClick={() => setQuantity(quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Add to Cart button */}
      <Button
        size="lg"
        onClick={handleAdd}
        disabled={isOutOfStock || addToCart.isPending}
        className="gap-2 flex-1"
      >
        <ShoppingCart className="h-5 w-5" />
        {isOutOfStock
          ? 'Out of Stock'
          : addToCart.isPending
            ? 'Adding...'
            : 'Add to Cart'}
      </Button>
    </div>
  );
}
