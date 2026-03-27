'use client';

import Link from 'next/link';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QuantityControl } from './quantity-control';
import { formatMoney } from '@/lib/utils/format';
import { useUpdateCartItem, useRemoveCartItem } from '@/lib/hooks/use-cart';
import { toast } from 'sonner';

interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  priceInCents: number;
  productType: string;
  stockQuantity?: number;
  media?: { filePath: string }[];
  sellerProfile?: { businessName: string };
}

interface CartItemData {
  id: string;
  quantity: number;
  product: CartItemProduct;
}

interface CartItemListProps {
  items: CartItemData[];
}

/** Map product type to a human-readable badge label and color */
function typeBadge(type: string) {
  switch (type) {
    case 'READY_STOCK':
      return { label: 'Ready Stock', className: 'bg-emerald-100 text-emerald-700' };
    case 'MADE_TO_ORDER':
      return { label: 'Made to Order', className: 'bg-amber-100 text-amber-700' };
    case 'ON_DEMAND':
      return { label: 'On Demand', className: 'bg-violet-100 text-violet-700' };
    default:
      return { label: type, className: 'bg-gray-100 text-gray-700' };
  }
}

/**
 * Displays cart items grouped by seller.
 * Each group has a seller header, and each item shows name, type badge,
 * unit price, quantity control, line total, and a remove button.
 */
export function CartItemList({ items }: CartItemListProps) {
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  // Group items by seller business name
  const grouped = items.reduce<Record<string, CartItemData[]>>((acc, item) => {
    const seller = item.product.sellerProfile?.businessName || 'Unknown Seller';
    if (!acc[seller]) acc[seller] = [];
    acc[seller].push(item);
    return acc;
  }, {});

  /** Handle quantity change via the QuantityControl component */
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
      onSuccess: () => toast.success('Item removed from cart'),
      onError: () => toast.error('Failed to remove item'),
    });
  }

  const sellerNames = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {sellerNames.map((sellerName) => (
        <div key={sellerName}>
          {/* Seller group header */}
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {sellerName}
          </h3>

          <div className="space-y-3">
            {grouped[sellerName].map((item) => {
              const badge = typeBadge(item.product.productType);
              const lineTotal = item.product.priceInCents * item.quantity;

              return (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Product thumbnail placeholder */}
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product.media?.[0]?.filePath ? (
                        <img
                          src={item.product.media[0].filePath}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-semibold text-sm hover:text-primary-600 line-clamp-1"
                      >
                        {item.product.name}
                      </Link>

                      {/* Type badge */}
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>

                      {/* Unit price */}
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatMoney(item.product.priceInCents)} each
                      </p>
                    </div>

                    {/* Quantity control */}
                    <QuantityControl
                      quantity={item.quantity}
                      max={item.product.stockQuantity || 99}
                      onChange={(qty) => handleQuantityChange(item.id, qty)}
                      disabled={updateMutation.isPending}
                    />

                    {/* Line total */}
                    <p className="font-bold text-sm w-24 text-right">
                      {formatMoney(lineTotal)}
                    </p>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemove(item.id)}
                      disabled={removeMutation.isPending}
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Separator between seller groups */}
          {sellerNames.indexOf(sellerName) < sellerNames.length - 1 && (
            <Separator className="mt-6" />
          )}
        </div>
      ))}
    </div>
  );
}
