import { api } from './client';

export interface ProductListParams {
  search?: string;
  categoryId?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CategoryProductParams {
  page?: number;
  limit?: number;
  sort?: string;
}

/** Fetch a paginated list of products with optional filters. */
export async function getProducts(params?: ProductListParams) {
  const res = await api.get('/catalog/products', { params });
  return res.data;
}

/** Fetch a single product by its URL slug. */
export async function getProductBySlug(slug: string) {
  const res = await api.get(`/catalog/products/${slug}`);
  return res.data;
}

/** Fetch all product categories. */
export async function getCategories() {
  const res = await api.get('/catalog/categories');
  return res.data;
}

/** Fetch products belonging to a specific category slug. */
export async function getCategoryProducts(slug: string, params?: CategoryProductParams) {
  const res = await api.get(`/catalog/categories/${slug}/products`, { params });
  return res.data;
}
