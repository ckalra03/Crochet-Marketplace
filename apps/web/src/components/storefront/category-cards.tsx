'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/lib/hooks/use-catalog';
import { CATEGORY_IMAGES } from '@/lib/constants/images';

/**
 * CategoryCards - Responsive grid of product category cards.
 * Fetches categories from the catalog API via the useCategories() hook.
 * Layout: 2 cols mobile, 3 cols md, 4 cols lg.
 */
export function CategoryCards() {
  const { data: categories, isLoading, isError } = useCategories();

  // Don't render the section if loading failed or no categories exist
  if (isError) return null;

  if (isLoading) {
    return (
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </section>
    );
  }

  // categories can be an array directly or nested in a response object
  const categoryList = Array.isArray(categories) ? categories : [];
  if (categoryList.length === 0) return null;

  return (
    <section className="py-16 max-w-7xl mx-auto px-6">
      {/* Section heading */}
      <h2 className="text-3xl font-extrabold text-[#1c1b1b] mb-10 flex items-center gap-4">
        Browse by Category
        <div className="h-px flex-1 bg-[#e7e5e4]" />
      </h2>

      {/* Responsive category grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {categoryList.map((cat: any) => (
          <Link key={cat.id} href={`/products?categoryId=${cat.id}`}>
            <Card className="group cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-[#e7e5e4]">
              <CardContent className="p-6 flex flex-col items-center text-center">
                {/* Category image or letter fallback */}
                <div className="w-14 h-14 rounded-full bg-primary-600/10 flex items-center justify-center mb-4 group-hover:bg-primary-600/20 transition-colors overflow-hidden">
                  {CATEGORY_IMAGES[cat.slug] ? (
                    <img
                      className="w-full h-full object-cover"
                      src={CATEGORY_IMAGES[cat.slug].image}
                      alt={cat.name}
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary-600">
                      {cat.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[#1c1b1b] group-hover:text-primary-600 transition-colors text-sm mb-1">
                  {cat.name}
                </h3>
                <span className="text-xs text-[#78716c]">
                  {cat._count?.products ?? 0} product{(cat._count?.products ?? 0) !== 1 ? 's' : ''}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
