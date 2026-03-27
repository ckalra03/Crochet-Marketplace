'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getProducts,
  getProductBySlug,
  getCategories,
  getCategoryProducts,
} from '@/lib/api/catalog';
import type { ProductListParams, CategoryProductParams } from '@/lib/api/catalog';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch a paginated list of products with optional filters. */
export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.catalog.products(params),
    queryFn: () => getProducts(params),
    staleTime: 30 * 1000,
  });
}

/** Fetch a single product by its URL slug. */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.catalog.product(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
}

/** Fetch all product categories. */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch products belonging to a specific category. */
export function useCategoryProducts(slug: string, params?: CategoryProductParams) {
  return useQuery({
    queryKey: queryKeys.catalog.categoryProducts(slug, params),
    queryFn: () => getCategoryProducts(slug, params),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
}
