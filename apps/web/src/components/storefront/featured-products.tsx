'use client';

import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/lib/hooks/use-catalog';
import { formatMoney } from '@/lib/utils/format';
import { PRODUCT_IMAGES } from '@/lib/constants/images';

/**
 * FeaturedProducts - Horizontal scrollable row of the latest approved products.
 * Fetches up to 8 products from the catalog API via useProducts().
 * Each card shows: image placeholder, name, price, product type badge, seller name.
 */
export function FeaturedProducts() {
  const { data, isLoading, isError } = useProducts({ limit: 8 });

  if (isError) return null;

  if (isLoading) {
    return (
      <section className="py-16 bg-[#f6f3f2]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </section>
    );
  }

  // The API may return { products: [...] } or just an array
  const products = Array.isArray(data) ? data : data?.products || [];
  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-[#f6f3f2]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header with "View All" link */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">
              Featured Products
            </h2>
            <p className="text-[#78716c]">Our most loved hand-stitched treasures</p>
          </div>
          <Link
            href="/products"
            className="text-primary-600 font-bold flex items-center gap-1 group"
          >
            View All
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Horizontal scroll area for product cards */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-6 pb-4">
            {products.map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="inline-block w-[260px] flex-shrink-0"
              >
                <div className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 whitespace-normal">
                  {/* Product image with gradient fallback */}
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-[#ffdad5] to-[#f6f3f2] flex items-center justify-center overflow-hidden">
                    {PRODUCT_IMAGES[product.slug] || PRODUCT_IMAGES.default ? (
                      <img
                        className="w-full h-full object-cover"
                        src={PRODUCT_IMAGES[product.slug] || PRODUCT_IMAGES.default}
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-6xl font-extrabold text-primary-600/20">
                        {product.name?.charAt(0) || '?'}
                      </span>
                    )}
                    {/* Product type badge */}
                    <Badge
                      variant={product.productType === 'READY_STOCK' ? 'success' : 'warning'}
                      className="absolute top-3 left-3"
                    >
                      {product.productType === 'READY_STOCK' ? 'Ready Stock' : 'Made to Order'}
                    </Badge>
                  </div>

                  {/* Product details */}
                  <div className="p-4">
                    <span className="text-xs text-[#78716c] font-medium">
                      by {product.sellerProfile?.businessName || 'Crochet Hub'}
                    </span>
                    <h3 className="font-bold text-sm text-[#1c1b1b] mt-1 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <span className="text-lg font-black text-primary-600">
                      {product.priceInCents
                        ? formatMoney(product.priceInCents)
                        : 'Custom Price'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
