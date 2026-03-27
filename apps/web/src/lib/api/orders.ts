import { api } from './client';

export interface OrderListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface CancelOrderData {
  reason: string;
}

/** Fetch the current buyer's orders with optional status filter. */
export async function getOrders(params?: OrderListParams) {
  const res = await api.get('/orders', { params });
  return res.data;
}

/** Fetch a single order by its order number. */
export async function getOrderByNumber(orderNumber: string) {
  const res = await api.get(`/orders/${orderNumber}`);
  return res.data;
}

/** Cancel an order by its order number with a reason. */
export async function cancelOrder(orderNumber: string, data: CancelOrderData) {
  const res = await api.post(`/orders/${orderNumber}/cancel`, data);
  return res.data;
}
