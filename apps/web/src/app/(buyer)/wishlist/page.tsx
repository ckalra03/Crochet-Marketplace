'use client';

import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/product/product-card';
import { WishlistButton } from '@/components/product/wishlist-button';
import { useWishlist } from '@/lib/hooks/use-wishlist';

/**
 * Wishlist page -- displays all products the buyer has wishlisted.
 * Reuses ProductCard for each item, with a remove (heart) button overlay.
 * Handles empty state and loading skeletons.
 */
export default function WishlistPage() {
  const { data, isLoading, isError } = useWishlist();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <div className="aspect-[4/5] bg-muted animate-pulse rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-1/4 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
        <p className="text-muted-foreground">Failed to load wishlist. Please try again.</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  // Empty state
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
        <p className="text-muted-foreground">
          Browse our catalog and add products you love to your wishlist.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        My Wishlist ({data?.total ?? items.length})
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item: any) => (
          <div key={item.id} className="relative">
            <ProductCard product={item.product} />
            {/* Wishlist remove button overlaid on card */}
            <WishlistButton
              productId={item.product.id}
              className="absolute top-3 right-3 z-10 bg-white/80 hover:bg-white rounded-full shadow"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
