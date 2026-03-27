'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCategoryProducts } from '@/lib/hooks/use-catalog';
import { ProductGrid } from '@/components/catalog/product-grid';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

/**
 * Inner content that uses useParams / useSearchParams (requires Suspense).
 */
function CategoryPageContent() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || '';

  const { data, isLoading } = useCategoryProducts(slug, {
    page,
    sort: sort || undefined,
  });

  const category = data?.category;
  const products = data?.products ?? [];
  const pagination = data?.pagination ?? { page: 1, total: 0, totalPages: 0 };

  /** Build href for a given page number. */
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/categories/${slug}?${qs}` : `/categories/${slug}`;
  };

  /** Generate visible page numbers with ellipsis. */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const total = pagination.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (page > 3) pages.push('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < total - 2) pages.push('ellipsis');
    pages.push(total);
    return pages;
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-[#78716c] mb-6">
          <Link href="/" className="hover:text-primary-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary-600">
            Products
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1c1b1b] font-medium">
            {category?.name || slug}
          </span>
        </nav>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-1">
            {category?.name || 'Category'}
          </h1>
          {category?.description && (
            <p className="text-[#78716c] max-w-2xl">{category.description}</p>
          )}
          {!isLoading && (
            <p className="text-[#78716c] mt-1">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="flex justify-end mb-6">
          <select
            value={sort}
            onChange={(e) => {
              const params = new URLSearchParams();
              if (e.target.value) params.set('sort', e.target.value);
              const qs = params.toString();
              window.location.href = qs
                ? `/categories/${slug}?${qs}`
                : `/categories/${slug}`;
            }}
            className="border border-[#e7e5e4] rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none"
          >
            <option value="">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* Product grid */}
        <ProductGrid products={products} isLoading={isLoading} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination className="mt-10">
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={pageHref(page - 1)} />
                </PaginationItem>
              )}
              {getPageNumbers().map((p, idx) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink href={pageHref(p)} isActive={p === page}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              {page < pagination.totalPages && (
                <PaginationItem>
                  <PaginationNext href={pageHref(page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}

/**
 * Category landing page — shows products filtered by category slug.
 * Uses the useCategoryProducts hook which calls GET /catalog/categories/:slug/products.
 */
export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#fcf9f8] min-h-screen flex items-center justify-center">
          <p className="text-[#78716c]">Loading category...</p>
        </div>
      }
    >
      <CategoryPageContent />
    </Suspense>
  );
}
