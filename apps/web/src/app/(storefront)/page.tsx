import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Truck, Star, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/catalog/products?limit=8`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/catalog/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">Handmade with Love</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Discover Unique <span className="text-primary-600">Crochet</span> Creations
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Explore curated handmade crochet products from talented artisans. Every item is quality-checked and delivered with care.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="gap-2">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/on-demand/new">
              <Button size="lg" variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" /> Custom Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <h3 className="font-semibold">Quality Assured</h3>
              <p className="text-sm text-muted-foreground">Every item passes our crochet-specific QC checklist</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck className="h-8 w-8 text-primary-600" />
              <h3 className="font-semibold">Platform-Managed Shipping</h3>
              <p className="text-sm text-muted-foreground">Centralized fulfillment for reliable delivery</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="h-8 w-8 text-primary-600" />
              <h3 className="font-semibold">Curated Artisans</h3>
              <p className="text-sm text-muted-foreground">Only approved sellers with quality track records</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {categories.map((cat: any) => (
                <Link key={cat.id} href={`/products?categoryId=${cat.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4 text-center">
                      <p className="font-medium text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cat._count?.products || 0} items
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
              <Link href="/products">
                <Button variant="ghost" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant={product.productType === 'READY_STOCK' ? 'success' : 'warning'} className="mb-2 text-[10px]">
                        {product.productType === 'READY_STOCK' ? 'Ready Stock' : 'Made to Order'}
                      </Badge>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        by {product.sellerProfile?.businessName || 'Crochet Hub'}
                      </p>
                      <p className="font-bold text-primary-600">
                        {product.priceInCents
                          ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}`
                          : 'Custom Price'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-primary-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Are You a Crochet Artist?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join Crochet Hub as a seller. We handle payments, quality checks, and shipping — you focus on creating.
          </p>
          <Link href="/seller/register">
            <Button size="lg" variant="secondary" className="bg-white text-primary-700 hover:bg-gray-100">
              Start Selling
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Needed for the import in the product card area
import { Package } from 'lucide-react';
