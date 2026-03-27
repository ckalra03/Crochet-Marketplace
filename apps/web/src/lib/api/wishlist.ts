import { api } from './client';

export interface WishlistParams {
  page?: number;
  limit?: number;
}

/** Fetch the current user's wishlist (paginated). */
export async function getWishlist(params?: WishlistParams) {
  const res = await api.get('/wishlist', { params });
  return res.data;
}

/** Get all wishlisted product IDs for quick lookup. */
export async function getWishlistIds() {
  const res = await api.get('/wishlist/ids');
  return res.data as { productIds: string[] };
}

/** Add a product to the wishlist. */
export async function addToWishlist(productId: string) {
  const res = await api.post(`/wishlist/${productId}`);
  return res.data;
}

/** Remove a product from the wishlist. */
export async function removeFromWishlist(productId: string) {
  const res = await api.delete(`/wishlist/${productId}`);
  return res.data;
}
