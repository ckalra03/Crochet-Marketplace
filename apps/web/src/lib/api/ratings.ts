import { api } from './client';

export interface SubmitRatingData {
  score: number;
  review?: string;
}

/** Submit a rating and optional review for a delivered order item. */
export async function submitRating(
  orderNumber: string,
  orderItemId: string,
  data: SubmitRatingData,
) {
  const res = await api.post(`/orders/${orderNumber}/items/${orderItemId}/rating`, data);
  return res.data;
}
