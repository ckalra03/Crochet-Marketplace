'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ProductListParams } from '@/lib/api/catalog';

/**
 * Filter keys we support in the catalog URL.
 * Each key maps to a query parameter name.
 */
export type FilterKey =
  | 'search'
  | 'categoryId'
  | 'productType'
  | 'minPrice'
  | 'maxPrice'
  | 'sort'
  | 'page';

/** Shape returned by useUrlFilters — current filter values derived from searchParams. */
export interface UrlFilters {
  search: string;
  categoryId: string;
  productType: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  page: number;
}

/**
 * Custom hook for URL-based filter state management.
 *
 * Reads current filter values from Next.js searchParams and provides
 * helpers to set, remove, or clear filters — all via URL updates
 * so the browser back/forward buttons work naturally.
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Current filter values parsed from the URL. */
  const filters: UrlFilters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      categoryId: searchParams.get('categoryId') || '',
      productType: searchParams.get('productType') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort: searchParams.get('sort') || '',
      page: Number(searchParams.get('page')) || 1,
    }),
    [searchParams],
  );

  /** Convert current filters to ProductListParams for the API hook. */
  const apiParams: ProductListParams = useMemo(() => {
    const params: ProductListParams = {};
    if (filters.search) params.search = filters.search;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.productType) params.productType = filters.productType;
    if (filters.minPrice) params.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
    if (filters.sort) params.sort = filters.sort;
    if (filters.page > 1) params.page = filters.page;
    return params;
  }, [filters]);

  /** Set a single filter value. Resets page to 1 unless setting page itself. */
  const setFilter = useCallback(
    (key: FilterKey, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when changing any filter except page
      if (key !== 'page') {
        params.delete('page');
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  /** Remove a single filter from the URL. */
  const removeFilter = useCallback(
    (key: FilterKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      // Reset to page 1 when removing a filter
      if (key !== 'page') {
        params.delete('page');
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  /** Clear all filters and reset to the base URL. */
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  /** Check if any filters are currently active (ignoring page). */
  const hasActiveFilters = useMemo(
    () =>
      !!(
        filters.search ||
        filters.categoryId ||
        filters.productType ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.sort
      ),
    [filters],
  );

  return {
    filters,
    apiParams,
    setFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
  };
}
