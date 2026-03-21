import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Shield, Truck, Star } from 'lucide-react';
import { PRODUCT_IMAGES, HERO_IMAGES, CATEGORY_IMAGES } from '@/lib/constants/images';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/catalog/products?limit=8`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch { return []; }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/catalog/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="bg-[#fcf9f8]">
      {/* Hero */}
      <section className="relative min-h-[700px] lg:min-h-[800px] flex items-center overflow-hidden px-6 lg:px-12 bg-gradient-to-br from-[#ffdad5] via-[#fcf9f8] to-[#fcf9f8]">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-600/10 text-primary-600 font-bold text-xs uppercase tracking-widest mb-6">
              Handcrafted with Heart
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-[#1c1b1b] leading-[1.1] mb-8 tracking-tight">
              Discover Unique{' '}
              <span className="text-primary-600">Crochet</span>{' '}
              Creations
            </h1>
            <p className="text-lg lg:text-xl text-[#78716c] max-w-lg mb-10 leading-relaxed">
              Curated collection of quality-assured handmade products. From cozy blankets to charming amigurumi, find pieces that speak to your tactile soul.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <button className="px-8 py-4 bg-primary-600 text-white rounded-full font-bold text-lg shadow-xl shadow-primary-600/20 hover:scale-105 transition-transform active:scale-95">
                  Shop Now
                </button>
              </Link>
              <Link href="/on-demand/new">
                <button className="px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-primary-600/5 transition-colors">
                  <Sparkles className="h-5 w-5" /> Custom Order
                </button>
              </Link>
            </div>
          </div>
          {/* Floating Product Images */}
          <div className="relative h-[400px] lg:h-[600px] hidden md:flex items-center justify-center">
            <div className="absolute top-10 right-0 w-56 h-72 rounded-2xl shadow-2xl overflow-hidden rotate-6 z-20 border-[6px] border-white">
              <img className="w-full h-full object-cover" src={HERO_IMAGES.teddy} alt="Crochet teddy bear" />
            </div>
            <div className="absolute bottom-5 left-0 w-64 h-64 rounded-2xl shadow-2xl overflow-hidden -rotate-6 z-10 border-[6px] border-white">
              <img className="w-full h-full object-cover" src={HERO_IMAGES.blanket} alt="Crochet blanket" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-[400px] rounded-3xl shadow-2xl overflow-hidden z-30 border-[6px] border-white">
              <img className="w-full h-full object-cover" src={HERO_IMAGES.bag} alt="Bohemian crochet bag" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-[#f0eded]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Shield className="h-7 w-7" />, title: 'Quality Assured', desc: 'Each item inspected by experts', color: 'text-primary-600 bg-primary-600/10' },
            { icon: <Truck className="h-7 w-7" />, title: 'Managed Shipping', desc: 'Secure & trackable logistics', color: 'text-accent-600 bg-accent-600/10' },
            { icon: <Star className="h-7 w-7" />, title: 'Curated Artisans', desc: 'Vetted community of creators', color: 'text-[#615b56] bg-[#615b56]/10' },
          ].map((badge) => (
            <div key={badge.title} className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${badge.color}`}>
                {badge.icon}
              </div>
              <div>
                <h3 className="font-bold text-[#1c1b1b]">{badge.title}</h3>
                <p className="text-sm text-[#78716c]">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-[#1c1b1b] mb-12 flex items-center gap-4">
            Browse by Category
            <div className="h-px flex-1 bg-[#e7e5e4]" />
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {categories.map((cat: any) => {
              const catImages = CATEGORY_IMAGES[cat.slug] || { bg: '#f5f5f4', image: '' };
              return (
                <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="group flex flex-col items-center text-center">
                  <div
                    className="w-full aspect-square rounded-xl mb-4 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1"
                    style={{ backgroundColor: catImages.bg }}
                  >
                    {catImages.image ? (
                      <img className="w-full h-full object-cover" src={catImages.image} alt={cat.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#78716c] text-3xl">
                        {cat.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-[#1c1b1b] group-hover:text-primary-600 transition-colors text-sm">{cat.name}</span>
                  <span className="text-xs text-[#78716c] uppercase tracking-wider mt-1">
                    {cat._count?.products || 0} items
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-20 bg-[#f6f3f2]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Featured Products</h2>
                <p className="text-[#78716c]">Our most loved hand-stitched treasures</p>
              </div>
              <Link href="/products" className="text-primary-600 font-bold flex items-center gap-1 group">
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product: any) => {
                const imgSrc = PRODUCT_IMAGES[product.slug] || PRODUCT_IMAGES.default;
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
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-black text-primary-600">
                            {product.priceInCents
                              ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}`
                              : 'Custom Price'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Seller CTA */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto bg-primary-600 rounded-[2rem] px-8 py-20 text-center relative z-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10">
            Are You a Crochet Artist?
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
            Join Crochet Hub as a seller and share your craftsmanship with a community that appreciates the art of handmade.
          </p>
          <Link href="/seller/register">
            <button className="bg-white text-primary-700 px-10 py-4 rounded-full font-extrabold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95 relative z-10">
              Start Selling
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
