import { api } from './client';

export interface AddToCartData {
  productId: string;
  quantity?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

/** Fetch the current user's cart. */
export async function getCart() {
  const res = await api.get('/cart');
  return res.data;
}

/** Add a product to the cart. */
export async function addToCart(data: AddToCartData) {
  const res = await api.post('/cart/items', data);
  return res.data;
}

/** Update the quantity of a cart item. Setting quantity to 0 removes it. */
export async function updateCartItem(id: string, data: UpdateCartItemData) {
  const res = await api.put(`/cart/items/${id}`, data);
  return res.data;
}

/** Remove an item from the cart. */
export async function removeCartItem(id: string) {
  const res = await api.delete(`/cart/items/${id}`);
  return res.data;
}

/** Apply a coupon code to the cart and get the discount. */
export async function applyCoupon(code: string) {
  const res = await api.post('/cart/apply-coupon', { code });
  return res.data;
}
