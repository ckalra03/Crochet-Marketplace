'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useProducts } from '@/lib/hooks/use-catalog';
import { useUrlFilters } from '@/lib/hooks/use-url-filters';
import { ProductFilterSidebar } from '@/components/catalog/product-filter-sidebar';
import { ActiveFilterChips } from '@/components/catalog/active-filter-chips';
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
 * Inner component that reads searchParams (must be wrapped in Suspense
 * because useSearchParams requires it in Next.js app router).
 */
function ProductsPageContent() {
  const { filters, apiParams, setFilter } = useUrlFilters();
  const { data, isLoading } = useProducts(apiParams);

  const products = data?.products ?? [];
  const pagination = data?.pagination ?? { page: 1, total: 0, totalPages: 0 };
  const currentPage = filters.page;

  /** Build href for a given page number. */
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.productType) params.set('productType', filters.productType);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.sort) params.set('sort', filters.sort);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `/products?${qs}` : '/products';
  };

  /** Generate page numbers to show, with ellipsis for large ranges. */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const total = pagination.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(total - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < total - 2) pages.push('ellipsis');
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
          <span className="text-[#1c1b1b] font-medium">Products</span>
        </nav>

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-1">Products</h1>
          {!isLoading && (
            <p className="text-[#78716c]">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Active filter chips */}
        <ActiveFilterChips />

        {/* Main layout: sidebar + grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar (desktop = sticky column, mobile = sheet trigger) */}
          <ProductFilterSidebar />

          {/* Product grid + pagination */}
          <div>
            <ProductGrid products={products} isLoading={isLoading} />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination className="mt-10">
                <PaginationContent>
                  {/* Previous */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href={pageHref(currentPage - 1)} />
                    </PaginationItem>
                  )}

                  {/* Page numbers */}
                  {getPageNumbers().map((p, idx) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href={pageHref(p)}
                          isActive={p === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setFilter('page', String(p));
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  {/* Next */}
                  {currentPage < pagination.totalPages && (
                    <PaginationItem>
                      <PaginationNext href={pageHref(currentPage + 1)} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Products catalog page.
 *
 * Wrapped in Suspense to satisfy Next.js requirement for
 * components using useSearchParams.
 */
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#fcf9f8] min-h-screen flex items-center justify-center">
          <p className="text-[#78716c]">Loading products...</p>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
