import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, ShieldCheck, Star, Package } from 'lucide-react';
import { AddToCartButton } from './add-to-cart-button';
import { PRODUCT_IMAGES, PRODUCT_DETAIL_IMAGES } from '@/lib/constants/images';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/catalog/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const mainImage = PRODUCT_DETAIL_IMAGES[slug as keyof typeof PRODUCT_DETAIL_IMAGES]?.main
    || PRODUCT_IMAGES[slug as keyof typeof PRODUCT_IMAGES]
    || PRODUCT_IMAGES.default;
  const thumbnails = PRODUCT_DETAIL_IMAGES[slug as keyof typeof PRODUCT_DETAIL_IMAGES]?.thumbnails || [];

  const returnPolicyLabel: Record<string, string> = {
    DEFECT_ONLY: 'Returns accepted for defects only',
    NO_RETURN: 'No returns (except platform-resolvable faults)',
    STANDARD: 'Standard return policy',
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#78716c] hover:text-primary-600 transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
              <img className="w-full h-full object-cover" src={mainImage} alt={product.name} />
            </div>
            {thumbnails.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {thumbnails.map((thumb: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer hover:ring-2 hover:ring-primary-600 transition-all">
                    <img className="w-full h-full object-cover" src={thumb} alt={`${product.name} view ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex gap-2 mb-4">
              <Badge variant={product.productType === 'READY_STOCK' ? 'success' : 'warning'}>
                {product.productType === 'READY_STOCK' ? 'Ready Stock' : product.productType === 'MADE_TO_ORDER' ? 'Made to Order' : 'Custom'}
              </Badge>
              <Badge variant="outline">{product.category?.name}</Badge>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1c1b1b] mb-3 tracking-tight">{product.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-[#78716c]">by</span>
              <span className="font-semibold text-[#1c1b1b]">{product.sellerProfile?.businessName || 'Crochet Hub'}</span>
              {product.avgRating > 0 && (
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{product.avgRating.toFixed(1)}</span>
                  <span className="text-[#78716c]">({product._count?.ratings || 0} reviews)</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-primary-600">
                {product.priceInCents ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}` : 'Custom Price'}
              </span>
              {product.compareAtPriceInCents && (
                <span className="text-xl text-[#78716c] line-through">
                  ₹{(product.compareAtPriceInCents / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <p className="text-[#78716c] mb-8 leading-relaxed text-lg">{product.description}</p>

            {/* Info indicators */}
            <div className="space-y-3 mb-8">
              {product.productType === 'READY_STOCK' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium">{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}</span>
                </div>
              )}
              {product.leadTimeDays && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="font-medium">Processing time: {product.leadTimeDays} days</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">{returnPolicyLabel[product.returnPolicy] || product.returnPolicy}</span>
              </div>
            </div>

            {/* Add to Cart */}
            {product.productType !== 'ON_DEMAND' && product.priceInCents && (
              <AddToCartButton productId={product.id} disabled={product.productType === 'READY_STOCK' && product.stockQuantity <= 0} />
            )}

            {/* Product Details */}
            {product.meta && (
              <Card className="mt-8 border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Product Details</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {product.meta.materials && (
                      <><dt className="text-[#78716c]">Materials</dt><dd className="font-medium">{(product.meta.materials as string[]).join(', ')}</dd></>
                    )}
                    {product.meta.dimensions && (
                      <><dt className="text-[#78716c]">Dimensions</dt><dd className="font-medium">{product.meta.dimensions as string}</dd></>
                    )}
                    {product.meta.weight && (
                      <><dt className="text-[#78716c]">Weight</dt><dd className="font-medium">{product.meta.weight as string}</dd></>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews */}
        {product.ratings && product.ratings.length > 0 && (
          <section className="mt-16 pb-8">
            <h2 className="text-2xl font-extrabold text-[#1c1b1b] mb-2">Customer Reviews</h2>
            <div className="flex items-center gap-2 mb-8">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(product.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="font-bold text-lg">{product.avgRating.toFixed(1)}</span>
              <span className="text-[#78716c]">({product._count?.ratings} reviews)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.ratings.map((rating: any) => (
                <Card key={rating.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600 font-bold text-sm">
                        {rating.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{rating.user?.name}</p>
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < rating.score ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {rating.review && <p className="text-sm text-[#78716c] leading-relaxed">{rating.review}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
