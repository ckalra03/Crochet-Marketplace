'use client';

import { Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard, type ProductCardData } from '@/components/product/product-card';

interface ProductGridProps {
  /** Array of products to display. */
  products: ProductCardData[];
  /** Whether data is still loading. */
  isLoading?: boolean;
  /** Number of skeleton cards to show while loading. */
  skeletonCount?: number;
}

/**
 * ProductGrid — responsive grid of product cards.
 *
 * Layout: 1 col on mobile, 2 cols on sm, 3 cols on lg, 4 cols on xl.
 * Shows skeleton placeholders during loading and an empty state when
 * the product list is empty.
 */
export function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 8,
}: ProductGridProps) {
  // ---------- Loading skeleton ----------
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---------- Empty state ----------
  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl">
        <Package className="h-16 w-16 text-[#78716c]/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2 text-[#1c1b1b]">No products found</h2>
        <p className="text-[#78716c]">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  // ---------- Product grid ----------
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
