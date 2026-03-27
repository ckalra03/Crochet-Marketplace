import { api } from './client';

export interface SubmitReturnData {
  orderItemId: string;
  reason: string;
  description?: string;
}

/** Fetch all return requests for the current buyer. */
export async function getReturns() {
  const res = await api.get('/returns');
  return res.data;
}

/** Fetch details of a single return by its return number. */
export async function getReturn(returnNumber: string) {
  const res = await api.get(`/returns/${returnNumber}`);
  return res.data;
}

/** Submit a new return request for an order item. */
export async function submitReturn(data: SubmitReturnData) {
  const res = await api.post('/returns', data);
  return res.data;
}
