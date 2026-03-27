'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Package } from 'lucide-react';
import { useProduct } from '@/lib/hooks/use-catalog';
import { formatMoney } from '@/lib/utils/format';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductTypeBadge } from '@/components/product/product-type-badge';
import { SellerAttribution } from '@/components/product/seller-attribution';
import { LeadTimeIndicator } from '@/components/product/lead-time-indicator';
import { ReturnPolicyCallout } from '@/components/product/return-policy-callout';
import { AddToCartSection } from '@/components/product/add-to-cart-section';
import { ReviewList } from '@/components/product/review-list';

/* ────────────────────────── Loading skeleton ──────────────────────── */

function ProductDetailSkeleton() {
  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-4 w-48 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery skeleton */}
          <div>
            <Skeleton className="aspect-square rounded-2xl mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── 404 fallback ──────────────────────────── */

function ProductNotFound() {
  return (
    <div className="bg-[#fcf9f8] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Package className="h-16 w-16 text-[#78716c] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#1c1b1b] mb-2">Product Not Found</h1>
        <p className="text-[#78716c] mb-6">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────── Main page ─────────────────────────────── */

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: product, isLoading, isError } = useProduct(slug);

  // Loading state
  if (isLoading) return <ProductDetailSkeleton />;

  // 404 or error state
  if (isError || !product) return <ProductNotFound />;

  // Build media array from product data (API may return `media` or none)
  const media: Array<{ filePath: string; type: string; isPrimary: boolean }> =
    product.media ?? [];

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Breadcrumb navigation ─────────────────────────────── */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/products">Products</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {product.category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/categories/${product.category.slug}`}>
                      {product.category.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Left column: Image Gallery ────────────────────────── */}
          <ProductGallery
            media={media}
            productName={product.name}
            productType={product.productType}
          />

          {/* ── Right column: Product Info ────────────────────────── */}
          <div>
            {/* Badges */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <ProductTypeBadge type={product.productType} />
              {product.category && (
                <Badge variant="outline">{product.category.name}</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1c1b1b] mb-3 tracking-tight">
              {product.name}
            </h1>

            {/* Seller attribution */}
            {product.sellerProfile && (
              <div className="mb-6">
                <SellerAttribution
                  seller={{
                    businessName: product.sellerProfile.businessName,
                    id: product.sellerProfile.userId ?? product.sellerProfile.id,
                  }}
                  rating={product.avgRating}
                  reviewCount={product._count?.ratings}
                />
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-primary-600">
                {product.priceInCents ? formatMoney(product.priceInCents) : 'Custom Price'}
              </span>
              {product.compareAtPriceInCents && (
                <span className="text-xl text-[#78716c] line-through">
                  {formatMoney(product.compareAtPriceInCents)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[#78716c] mb-8 leading-relaxed text-lg">
              {product.description}
            </p>

            {/* ── Info indicators ─────────────────────────────────── */}
            <div className="space-y-3 mb-8">
              {/* Stock indicator for Ready Stock */}
              {product.productType === 'READY_STOCK' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium">
                    {product.stockQuantity > 0
                      ? `${product.stockQuantity} in stock`
                      : 'Out of stock'}
                  </span>
                </div>
              )}

              {/* Lead time */}
              <LeadTimeIndicator
                productType={product.productType}
                leadTimeDays={product.leadTimeDays}
              />

              {/* Return policy */}
              <ReturnPolicyCallout
                productType={product.productType}
                returnPolicy={product.returnPolicy}
              />
            </div>

            {/* ── Add to Cart ─────────────────────────────────────── */}
            <AddToCartSection
              productId={product.id}
              stockQuantity={product.stockQuantity}
              productType={product.productType}
              priceInCents={product.priceInCents}
            />

            {/* ── Product Details (meta) ──────────────────────────── */}
            {product.meta && (
              <Card className="mt-8 border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Product Details</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {product.meta.materials && (
                      <>
                        <dt className="text-[#78716c]">Materials</dt>
                        <dd className="font-medium">
                          {(product.meta.materials as string[]).join(', ')}
                        </dd>
                      </>
                    )}
                    {product.meta.dimensions && (
                      <>
                        <dt className="text-[#78716c]">Dimensions</dt>
                        <dd className="font-medium">{product.meta.dimensions as string}</dd>
                      </>
                    )}
                    {product.meta.weight && (
                      <>
                        <dt className="text-[#78716c]">Weight</dt>
                        <dd className="font-medium">{product.meta.weight as string}</dd>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Reviews section ───────────────────────────────────── */}
        <ReviewList
          ratings={product.ratings ?? []}
          avgRating={product.avgRating}
        />
      </div>
    </div>
  );
}
