'use client';

import Link from 'next/link';
import { Package, Scissors, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils/format';
import { PRODUCT_IMAGES } from '@/lib/constants/images';

/** Product shape expected by the card (subset of API response). */
export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  priceInCents: number | null;
  compareAtPriceInCents?: number | null;
  productType: 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';
  sellerProfile?: { businessName: string } | null;
  /** Media array from API — use first item's filePath as thumbnail */
  media?: Array<{ filePath: string; type?: string; isPrimary?: boolean }>;
}

/** Badge config per product type. */
const PRODUCT_TYPE_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Package }
> = {
  READY_STOCK: {
    label: 'Ready Stock',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: Package,
  },
  MADE_TO_ORDER: {
    label: 'Made to Order',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Scissors,
  },
  ON_DEMAND: {
    label: 'On Demand',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Sparkles,
  },
};

/** Gradient backgrounds for the image placeholder area. */
const TYPE_GRADIENTS: Record<string, string> = {
  READY_STOCK: 'from-green-50 to-emerald-100',
  MADE_TO_ORDER: 'from-amber-50 to-orange-100',
  ON_DEMAND: 'from-purple-50 to-violet-100',
};

/**
 * ProductCard — displays a single product in the catalog grid.
 *
 * Features:
 * - Image from PRODUCT_IMAGES map, with gradient fallback + type icon
 * - Product type badge
 * - Seller name
 * - Price with optional compare-at strikethrough
 * - Hover effect with shadow and subtle scale
 * - Entire card is a link to /products/{slug}
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  // Use actual product media if available, fall back to hardcoded images
  const primaryMedia = product.media?.find((m) => m.isPrimary) || product.media?.[0];
  const imgSrc =
    primaryMedia?.filePath ||
    PRODUCT_IMAGES[product.slug as keyof typeof PRODUCT_IMAGES] ||
    PRODUCT_IMAGES.default;
  const typeConfig = PRODUCT_TYPE_CONFIG[product.productType] || PRODUCT_TYPE_CONFIG.READY_STOCK;
  const TypeIcon = typeConfig.icon;
  const gradient = TYPE_GRADIENTS[product.productType] || TYPE_GRADIENTS.READY_STOCK;

  const hasComparePrice =
    product.compareAtPriceInCents &&
    product.priceInCents &&
    product.compareAtPriceInCents > product.priceInCents;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image / placeholder */}
        <div className="relative aspect-[4/5] overflow-hidden">
          {imgSrc ? (
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={imgSrc}
              alt={product.name}
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <TypeIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Product type badge */}
          <Badge
            variant="outline"
            className={`absolute top-3 left-3 text-xs font-bold ${typeConfig.className}`}
          >
            {typeConfig.label}
          </Badge>
        </div>

        {/* Details */}
        <div className="p-4">
          {/* Seller name */}
          <span className="text-xs text-[#78716c] font-medium">
            by {product.sellerProfile?.businessName || 'Crochet Hub'}
          </span>

          {/* Product name */}
          <h3 className="font-bold text-base text-[#1c1b1b] mt-1 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-primary-600">
              {product.priceInCents ? formatMoney(product.priceInCents) : 'Custom Price'}
            </span>
            {hasComparePrice && (
              <span className="text-sm text-[#78716c] line-through">
                {formatMoney(product.compareAtPriceInCents!)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
