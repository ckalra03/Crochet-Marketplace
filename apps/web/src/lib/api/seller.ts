import { api } from './client';

export interface SellerRegisterData {
  businessName: string;
  description?: string;
  gstin?: string;
  pickupAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
}

export interface UpdateSellerProfileData {
  businessName?: string;
  description?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CreateProductData {
  name: string;
  description: string;
  categoryId: string;
  productType: 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';
  priceInCents?: number;
  compareAtPriceInCents?: number;
  stockQuantity?: number;
  leadTimeDays?: number;
  returnPolicy: 'DEFECT_ONLY' | 'NO_RETURN' | 'STANDARD';
  materials?: string;
  dimensions?: string;
  careInstructions?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  categoryId?: string;
  productType?: 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';
  priceInCents?: number;
  compareAtPriceInCents?: number;
  stockQuantity?: number;
  leadTimeDays?: number;
  returnPolicy?: 'DEFECT_ONLY' | 'NO_RETURN' | 'STANDARD';
  materials?: string;
  dimensions?: string;
  careInstructions?: string;
}

// ─── Seller onboarding ───────────────────────────────

/** Register as a seller. */
export async function registerSeller(data: SellerRegisterData) {
  const res = await api.post('/seller/register', data);
  return res.data;
}

/** Fetch the authenticated seller's profile. */
export async function getSellerProfile() {
  const res = await api.get('/seller/profile');
  return res.data;
}

/** Update the seller's business profile. */
export async function updateSellerProfile(data: UpdateSellerProfileData) {
  const res = await api.put('/seller/profile', data);
  return res.data;
}

// ─── Dashboard ───────────────────────────────────────

/** Fetch the seller dashboard stats (revenue, orders, ratings). */
export async function getSellerDashboard() {
  const res = await api.get('/seller/dashboard');
  return res.data;
}

// ─── Products ────────────────────────────────────────

/** List the seller's own products. */
export async function getSellerProducts(params?: PaginationParams) {
  const res = await api.get('/seller/products', { params });
  return res.data;
}

/** Fetch a single product by ID (seller-scoped). */
export async function getSellerProduct(id: string) {
  const res = await api.get(`/seller/products/${id}`);
  return res.data;
}

/** Create a new product listing. */
export async function createProduct(data: CreateProductData) {
  const res = await api.post('/seller/products', data);
  return res.data;
}

/** Update an existing product listing. */
export async function updateProduct(id: string, data: UpdateProductData) {
  const res = await api.put(`/seller/products/${id}`, data);
  return res.data;
}

/** Delete a product listing. */
export async function deleteProduct(id: string) {
  const res = await api.delete(`/seller/products/${id}`);
  return res.data;
}

/** Submit a product for admin approval. */
export async function submitProductForApproval(id: string) {
  const res = await api.post(`/seller/products/${id}/submit`);
  return res.data;
}

/** Upload an image or video for a product. */
export async function uploadProductMedia(id: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/seller/products/${id}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/** Remove a media file from a product. */
export async function deleteProductMedia(productId: string, mediaId: string) {
  const res = await api.delete(`/seller/products/${productId}/media/${mediaId}`);
  return res.data;
}

export interface UpdateBankDetailsData {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

// ─── Orders ──────────────────────────────────────────

/** List orders allocated to the seller. */
export async function getSellerOrders(params?: PaginationParams) {
  const res = await api.get('/seller/orders', { params });
  return res.data;
}

/** Fetch details of a single seller order item. */
export async function getSellerOrder(id: string) {
  const res = await api.get(`/seller/orders/${id}`);
  return res.data;
}

// ─── Bank Details ────────────────────────────────────

/** Update the seller's bank / payout details. */
export async function updateBankDetails(data: UpdateBankDetailsData) {
  const res = await api.put('/seller/bank-details', data);
  return res.data;
}

// ─── Payouts ─────────────────────────────────────────

/** List the seller's payout history. */
export async function getSellerPayouts() {
  const res = await api.get('/seller/payouts');
  return res.data;
}

/** Fetch details of a specific payout. */
export async function getSellerPayout(id: string) {
  const res = await api.get(`/seller/payouts/${id}`);
  return res.data;
}

// ─── Ratings ─────────────────────────────────────────

/** Fetch ratings received by the seller. */
export async function getSellerRatings() {
  const res = await api.get('/seller/ratings');
  return res.data;
}

// ─── Performance Metrics ────────────────────────────

/** Fetch the seller's own performance metrics. */
export async function getSellerPerformance() {
  const res = await api.get('/seller/performance');
  return res.data;
}

// ─── Seller Penalties ───────────────────────────────

export interface SellerPenaltyParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** Fetch the seller's own penalties. */
export async function getSellerPenalties(params?: SellerPenaltyParams) {
  const res = await api.get('/seller/penalties', { params });
  return res.data;
}

// ─── Seller SLA Breaches ────────────────────────────

export interface SellerSlaBreachParams {
  slaType?: string;
  page?: number;
  limit?: number;
}

/** Fetch the seller's own SLA breaches. */
export async function getSellerSlaBreaches(params?: SellerSlaBreachParams) {
  const res = await api.get('/seller/sla/breaches', { params });
  return res.data;
}
