import { api } from './client';

export interface CheckoutData {
  shippingAddressId: string;
  notes?: string;
  paymentMethod?: 'COD';
}

/** Create an order from the current cart contents. */
export async function createOrder(data: CheckoutData) {
  const res = await api.post('/checkout', data);
  return res.data;
}
