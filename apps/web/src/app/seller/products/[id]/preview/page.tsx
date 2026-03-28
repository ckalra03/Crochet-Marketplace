'use client';

/**
 * Product Preview page -- shows how the product will appear to buyers.
 *
 * Fetches the product via useSellerProduct(id) and renders a buyer-facing
 * card layout with images, price, description, and metadata.
 * Includes "Back to Edit" and "Submit for Approval" (when draft) buttons.
 */

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/feedback/status-badge';
import { ProductTypeBadge } from '@/components/product/product-type-badge';
import { useSellerProduct, useSubmitForApproval } from '@/lib/hooks/use-seller';
import { formatMoney } from '@/lib/utils/format';

export default function ProductPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading } = useSellerProduct(productId);
  const submitForApproval = useSubmitForApproval();

  /** Handle submitting for approval */
  async function handleSubmitForApproval() {
    try {
      await submitForApproval.mutateAsync(productId);
      toast.success('Product submitted for approval');
      router.push('/seller/products');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit for approval');
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center">Loading preview...</div>;
  }

  if (!product) {
    return <div className="py-20 text-center text-muted-foreground">Product not found.</div>;
  }

  // Collect media images for the gallery
  const images: Array<{ id: string; filePath: string; isPrimary: boolean }> =
    product.media ?? [];

  // Map return policy to a human-readable label
  const returnPolicyLabels: Record<string, string> = {
    DEFECT_ONLY: 'Returns accepted only for defective items',
    NO_RETURN: 'No returns or exchanges accepted',
    STANDARD: 'Standard 7-day return window',
  };

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/seller">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/seller/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Preview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with status */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Product Preview</h1>
        <StatusBadge status={product.status} type="product" />
      </div>

      {/* Image gallery */}
      {images.length > 0 && (
        <div className="mb-6">
          {/* Primary image */}
          {images.filter((img) => img.isPrimary).length > 0 && (
            <div className="rounded-lg overflow-hidden border bg-muted mb-3 aspect-video max-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images.find((img) => img.isPrimary)!.filePath}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          {/* Thumbnail strip for additional images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`rounded-md overflow-hidden border aspect-square ${
                    img.isPrimary ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.filePath}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product info card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl">{product.name}</CardTitle>
            <ProductTypeBadge type={product.productType} />
          </div>
          {product.category?.name && (
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price */}
          <div>
            <div className="flex items-baseline gap-3">
              {product.priceInCents ? (
                <span className="text-2xl font-bold text-primary">
                  {formatMoney(product.priceInCents)}
                </span>
              ) : (
                <span className="text-lg text-muted-foreground">Custom pricing</span>
              )}
              {product.compareAtPriceInCents && product.priceInCents && (
                <span className="text-sm line-through text-muted-foreground">
                  {formatMoney(product.compareAtPriceInCents)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-sm mb-1">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Stock / lead time info */}
          {product.productType === 'READY_STOCK' && (
            <div>
              <h3 className="font-semibold text-sm mb-1">Availability</h3>
              <p className="text-sm text-muted-foreground">
                {(product.stockQuantity ?? 0) > 0
                  ? `${product.stockQuantity} in stock`
                  : 'Out of stock'}
              </p>
            </div>
          )}
          {product.productType === 'MADE_TO_ORDER' && product.leadTimeDays && (
            <div>
              <h3 className="font-semibold text-sm mb-1">Lead Time</h3>
              <p className="text-sm text-muted-foreground">
                {product.leadTimeDays} day{product.leadTimeDays > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional details card */}
      {(product.materials || product.dimensions || product.careInstructions || product.returnPolicy) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {product.materials && (
              <div>
                <h3 className="font-semibold text-sm">Materials</h3>
                <p className="text-sm text-muted-foreground">{product.materials}</p>
              </div>
            )}
            {product.dimensions && (
              <div>
                <h3 className="font-semibold text-sm">Dimensions</h3>
                <p className="text-sm text-muted-foreground">{product.dimensions}</p>
              </div>
            )}
            {product.careInstructions && (
              <div>
                <h3 className="font-semibold text-sm">Care Instructions</h3>
                <p className="text-sm text-muted-foreground">{product.careInstructions}</p>
              </div>
            )}
            {product.returnPolicy && (
              <div>
                <h3 className="font-semibold text-sm">Return Policy</h3>
                <p className="text-sm text-muted-foreground">
                  {returnPolicyLabels[product.returnPolicy] ?? product.returnPolicy}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Link href={`/seller/products/${productId}/edit`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Edit
          </Button>
        </Link>

        {/* Submit for Approval -- only for DRAFT or REJECTED products */}
        {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
          <Button
            onClick={handleSubmitForApproval}
            disabled={submitForApproval.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitForApproval.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        )}
      </div>
    </div>
  );
}
