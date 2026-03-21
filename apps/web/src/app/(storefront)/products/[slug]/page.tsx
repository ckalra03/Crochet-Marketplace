import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Clock, ShieldCheck, Star, ArrowLeft } from 'lucide-react';
import { AddToCartButton } from './add-to-cart-button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/catalog/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const returnPolicyLabel: Record<string, string> = {
    DEFECT_ONLY: 'Returns accepted for defects only',
    NO_RETURN: 'No returns (except platform-resolvable faults)',
    STANDARD: 'Standard return policy',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <Package className="h-24 w-24 text-muted-foreground/30" />
        </div>

        {/* Info */}
        <div>
          <div className="flex gap-2 mb-3">
            <Badge variant={product.productType === 'READY_STOCK' ? 'success' : 'warning'}>
              {product.productType === 'READY_STOCK' ? 'Ready Stock' : product.productType === 'MADE_TO_ORDER' ? 'Made to Order' : 'Custom'}
            </Badge>
            <Badge variant="outline">{product.category?.name}</Badge>
          </div>

          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">by</span>
            <span className="font-medium">{product.sellerProfile?.businessName || 'Crochet Hub'}</span>
            {product.avgRating > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {product.avgRating.toFixed(1)}
                <span className="text-muted-foreground">({product._count?.ratings || 0})</span>
              </span>
            )}
          </div>

          <p className="text-3xl font-bold text-primary-600 mb-6">
            {product.priceInCents ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}` : 'Custom Price'}
            {product.compareAtPriceInCents && (
              <span className="text-lg text-muted-foreground line-through ml-2">
                ₹{(product.compareAtPriceInCents / 100).toLocaleString('en-IN')}
              </span>
            )}
          </p>

          <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

          {/* Meta info */}
          <div className="space-y-3 mb-6">
            {product.productType === 'READY_STOCK' && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-green-600" />
                <span>{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}</span>
              </div>
            )}
            {product.leadTimeDays && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Processing time: {product.leadTimeDays} days</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>{returnPolicyLabel[product.returnPolicy] || product.returnPolicy}</span>
            </div>
          </div>

          {/* Add to cart */}
          {product.productType !== 'ON_DEMAND' && product.priceInCents && (
            <AddToCartButton productId={product.id} disabled={product.productType === 'READY_STOCK' && product.stockQuantity <= 0} />
          )}

          {/* Product meta */}
          {product.meta && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Product Details</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {product.meta.materials && (
                    <>
                      <dt className="text-muted-foreground">Materials</dt>
                      <dd>{(product.meta.materials as string[]).join(', ')}</dd>
                    </>
                  )}
                  {product.meta.dimensions && (
                    <>
                      <dt className="text-muted-foreground">Dimensions</dt>
                      <dd>{product.meta.dimensions as string}</dd>
                    </>
                  )}
                  {product.meta.weight && (
                    <>
                      <dt className="text-muted-foreground">Weight</dt>
                      <dd>{product.meta.weight as string}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.ratings && product.ratings.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
          <div className="space-y-4">
            {product.ratings.map((rating: any) => (
              <Card key={rating.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < rating.score ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{rating.user?.name}</span>
                  </div>
                  {rating.review && <p className="text-sm text-muted-foreground">{rating.review}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
