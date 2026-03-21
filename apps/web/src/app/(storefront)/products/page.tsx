import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { PRODUCT_IMAGES } from '@/lib/constants/images';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProducts(searchParams: Record<string, string>) {
  const params = new URLSearchParams(searchParams);
  try {
    const res = await fetch(`${API_URL}/catalog/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return { products: [], pagination: { page: 1, total: 0, totalPages: 0 } };
    return await res.json();
  } catch { return { products: [], pagination: { page: 1, total: 0, totalPages: 0 } }; }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/catalog/categories`, { next: { revalidate: 300 } });
    return await res.json();
  } catch { return []; }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const [data, categories] = await Promise.all([getProducts(params), getCategories()]);

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-[#78716c] mb-6">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#1c1b1b] font-medium">Products</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Shop All Products</h1>
        <p className="text-[#78716c] mb-8">{data.pagination.total} products found</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <form action="/products" method="GET" className="space-y-6 bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <div>
                <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">Search</h3>
                <input name="search" placeholder="Search products..." defaultValue={params.search || ''}
                  className="w-full border border-[#e7e5e4] rounded-lg px-4 py-2.5 text-sm bg-[#fcf9f8] focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">Product Type</h3>
                <div className="space-y-2">
                  {[
                    { value: 'READY_STOCK', label: 'Ready Stock' },
                    { value: 'MADE_TO_ORDER', label: 'Made to Order' },
                  ].map((type) => (
                    <label key={type.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="productType" value={type.value}
                        defaultChecked={params.productType === type.value}
                        className="text-primary-600 focus:ring-primary-600" />
                      {type.label}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="productType" value=""
                      defaultChecked={!params.productType}
                      className="text-primary-600 focus:ring-primary-600" />
                    All Types
                  </label>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">Category</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((c: any) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="categoryId" value={c.id}
                        defaultChecked={params.categoryId === c.id}
                        className="text-primary-600 focus:ring-primary-600" />
                      {c.name}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="categoryId" value=""
                      defaultChecked={!params.categoryId}
                      className="text-primary-600 focus:ring-primary-600" />
                    All Categories
                  </label>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">Sort By</h3>
                <select name="sort" defaultValue={params.sort || ''}
                  className="w-full border border-[#e7e5e4] rounded-lg px-4 py-2.5 text-sm bg-[#fcf9f8] focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none">
                  <option value="">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors active:scale-[0.98]">
                Apply Filters
              </button>
            </form>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {data.products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl">
                <Package className="h-16 w-16 text-[#78716c]/30 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No products found</h2>
                <p className="text-[#78716c]">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.products.map((product: any) => {
                  const imgSrc = PRODUCT_IMAGES[product.slug as keyof typeof PRODUCT_IMAGES] || PRODUCT_IMAGES.default;
                  return (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                      <div className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                        <div className="relative aspect-[4/5]">
                          <img className="w-full h-full object-cover" src={imgSrc} alt={product.name} />
                          <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full ${
                            product.productType === 'READY_STOCK'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {product.productType === 'READY_STOCK' ? 'Ready Stock' : 'Made to Order'}
                          </span>
                        </div>
                        <div className="p-5">
                          <span className="text-xs text-[#78716c] font-medium">
                            by {product.sellerProfile?.businessName || 'Crochet Hub'}
                          </span>
                          <h3 className="font-bold text-lg text-[#1c1b1b] mb-3 mt-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <span className="text-xl font-black text-primary-600">
                            {product.priceInCents
                              ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}`
                              : 'Custom Price'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={`/products?${new URLSearchParams({ ...params, page: String(p) })}`}>
                    <button className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      p === Number(params.page || 1)
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                        : 'bg-white border border-[#e7e5e4] hover:bg-[#f0eded]'
                    }`}>{p}</button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
