import { api } from './client';

export interface SubmitOnDemandData {
  description: string;
  categoryId?: string;
  budgetMinCents?: number;
  budgetMaxCents?: number;
  expectedBy?: string;
  referenceImages?: string[];
}

/** Fetch all on-demand requests for the current buyer. */
export async function getOnDemandRequests() {
  const res = await api.get('/on-demand');
  return res.data;
}

/** Fetch details of a single on-demand request. */
export async function getOnDemandRequest(id: string) {
  const res = await api.get(`/on-demand/${id}`);
  return res.data;
}

/** Submit a new on-demand crochet request. */
export async function submitOnDemandRequest(data: SubmitOnDemandData) {
  const res = await api.post('/on-demand', data);
  return res.data;
}

/**
 * Upload a reference image for a custom order.
 * Returns the Cloudinary URL for the uploaded image.
 */
export async function uploadOnDemandImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/on-demand/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/** Accept a seller's quote on an on-demand request. */
export async function acceptQuote(requestId: string, quoteId: string) {
  const res = await api.post(`/on-demand/${requestId}/quotes/${quoteId}/accept`);
  return res.data;
}

/** Reject a seller's quote on an on-demand request. */
export async function rejectQuote(requestId: string, quoteId: string) {
  const res = await api.post(`/on-demand/${requestId}/quotes/${quoteId}/reject`);
  return res.data;
}
