'use client';

/**
 * Admin Product Review Detail -- Full product preview with approval actions.
 * Shows the product as a buyer would see it, plus seller info sidebar and
 * a ProductReviewPanel at the bottom for PENDING_APPROVAL products.
 */

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminProduct } from '@/lib/hooks/use-admin';
import { ProductReviewPanel } from '@/components/admin/product-review-panel';
import { StatusBadge } from '@/components/feedback/status-badge';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Package, Star, Store, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─────────────── Types ─────────────── */

interface ProductMedia {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  productType: string;
  status: string;
  priceInCents: number | null;
  compareAtPriceInCents: number | null;
  stock: number | null;
  leadTimeDays: number | null;
  returnPolicy: string | null;
  materials: string | null;
  dimensions: string | null;
  careInstructions: string | null;
  createdAt: string;
  media?: ProductMedia[];
  category?: { name: string };
  sellerProfile?: {
    id: string;
    businessName: string;
    status: string;
    averageRating: number | null;
    user?: { name: string; email: string };
  };
}

/* ─────────────── Loading Skeleton ─────────────── */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/* ─────────────── Media Gallery ─────────────── */

function MediaGallery({ media }: { media: ProductMedia[] }) {
  if (!media || media.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <Package className="h-16 w-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {media
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => (
          <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={item.url}
              alt={item.altText || 'Product image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
        ))}
    </div>
  );
}

/* ─────────────── Page Component ─────────────── */

export default function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useAdminProduct(id);

  const product: ProductDetail | undefined = data?.product;

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-6 w-48 mb-6" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Product not found</h2>
        <p className="text-muted-foreground mb-4">
          The product you are looking for does not exist or has been removed.
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  const isPending = product.status === 'PENDING_APPROVAL';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <StatusBadge status={product.status} type="product" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaGallery media={product.media ?? []} />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Type</dt>
                  <dd className="mt-1">
                    <Badge variant="outline">
                      {product.productType?.replace(/_/g, ' ')}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Category</dt>
                  <dd className="mt-1">{product.category?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Price</dt>
                  <dd className="mt-1 font-semibold">
                    {product.priceInCents ? formatMoney(product.priceInCents) : 'Custom Pricing'}
                  </dd>
                </div>
                {product.compareAtPriceInCents && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Compare-at Price</dt>
                    <dd className="mt-1 line-through text-muted-foreground">
                      {formatMoney(product.compareAtPriceInCents)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-muted-foreground">Stock</dt>
                  <dd className="mt-1">{product.stock ?? 'N/A'}</dd>
                </div>
                {product.leadTimeDays != null && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Lead Time</dt>
                    <dd className="mt-1">{product.leadTimeDays} day{product.leadTimeDays !== 1 ? 's' : ''}</dd>
                  </div>
                )}
                {product.materials && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Materials</dt>
                    <dd className="mt-1">{product.materials}</dd>
                  </div>
                )}
                {product.dimensions && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Dimensions</dt>
                    <dd className="mt-1">{product.dimensions}</dd>
                  </div>
                )}
                {product.careInstructions && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-muted-foreground">Care Instructions</dt>
                    <dd className="mt-1">{product.careInstructions}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Return Policy */}
          {product.returnPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>Return Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.returnPolicy.replace(/_/g, ' ')}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Seller Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Seller Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.sellerProfile ? (
                <>
                  <div>
                    <p className="font-semibold">{product.sellerProfile.businessName}</p>
                    {product.sellerProfile.user && (
                      <p className="text-sm text-muted-foreground">
                        {product.sellerProfile.user.name} ({product.sellerProfile.user.email})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <StatusBadge status={product.sellerProfile.status} type="seller" />
                  </div>
                  {product.sellerProfile.averageRating != null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">
                        {product.sellerProfile.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No seller information available.</p>
              )}
            </CardContent>
          </Card>

          {/* Submission Info */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span>{formatDate(product.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={product.status} type="product" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Panel -- only for pending products */}
      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductReviewPanel
              productId={product.id}
              productName={product.name}
              onActionComplete={() => router.push('/admin/products')}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
