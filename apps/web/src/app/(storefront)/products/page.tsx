import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProducts(searchParams: Record<string, string>) {
  const params = new URLSearchParams(searchParams);
  try {
    const res = await fetch(`${API_URL}/catalog/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return { products: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    return await res.json();
  } catch {
    return { products: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/catalog/categories`, { next: { revalidate: 300 } });
    return await res.json();
  } catch {
    return [];
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const [data, categories] = await Promise.all([getProducts(params), getCategories()]);

  const productTypes = [
    { value: '', label: 'All Types' },
    { value: 'READY_STOCK', label: 'Ready Stock' },
    { value: 'MADE_TO_ORDER', label: 'Made to Order' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shop All Products</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <form className="flex gap-2 flex-wrap" action="/products" method="GET">
          <Input name="search" placeholder="Search products..." defaultValue={params.search || ''} className="w-64" />
          <select name="productType" defaultValue={params.productType || ''} className="border rounded-md px-3 py-2 text-sm bg-background">
            {productTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select name="categoryId" defaultValue={params.categoryId || ''} className="border rounded-md px-3 py-2 text-sm bg-background">
            <option value="">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="sort" defaultValue={params.sort || ''} className="border rounded-md px-3 py-2 text-sm bg-background">
            <option value="">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700">Filter</button>
        </form>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">{data.pagination.total} products found</p>

      {data.products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No products found</h2>
          <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.products.map((product: any) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/40" />
                </div>
                <CardContent className="p-4">
                  <Badge variant={product.productType === 'READY_STOCK' ? 'success' : 'warning'} className="mb-2 text-[10px]">
                    {product.productType === 'READY_STOCK' ? 'Ready Stock' : product.productType === 'MADE_TO_ORDER' ? 'Made to Order' : 'Custom'}
                  </Badge>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">by {product.sellerProfile?.businessName || 'Crochet Hub'}</p>
                  <p className="font-bold text-primary-600">
                    {product.priceInCents ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}` : 'Custom Price'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/products?${new URLSearchParams({ ...params, page: String(p) })}`}>
              <button className={`px-3 py-1 rounded text-sm ${p === Number(params.page || 1) ? 'bg-primary-600 text-white' : 'border hover:bg-muted'}`}>
                {p}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
