import { api } from './client';

// ─── Dashboard ───────────────────────────────────────

/** Fetch admin dashboard summary stats. */
export async function getDashboard() {
  const res = await api.get('/admin/dashboard');
  return res.data;
}

// ─── Audit Logs ──────────────────────────────────────

export interface AuditLogParams {
  action?: string;
  userId?: string;
  auditableType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/** Fetch paginated audit logs with optional filters. */
export async function getAuditLogs(params?: AuditLogParams) {
  const res = await api.get('/admin/audit-logs', { params });
  return res.data;
}

// ─── Seller Management ───────────────────────────────

export interface SellerListParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** List all seller profiles with optional status filter. */
export async function getSellers(params?: SellerListParams) {
  const res = await api.get('/admin/sellers', { params });
  return res.data;
}

/** Fetch a single seller profile by ID. */
export async function getSeller(id: string) {
  const res = await api.get(`/admin/sellers/${id}`);
  return res.data;
}

/** Approve a pending seller application. */
export async function approveSeller(id: string) {
  const res = await api.post(`/admin/sellers/${id}/approve`);
  return res.data;
}

/** Reject a pending seller application. */
export async function rejectSeller(id: string, data: { reason: string }) {
  const res = await api.post(`/admin/sellers/${id}/reject`, data);
  return res.data;
}

/** Suspend an active seller. */
export async function suspendSeller(id: string, data: { reason: string }) {
  const res = await api.post(`/admin/sellers/${id}/suspend`, data);
  return res.data;
}

// ─── Product Approval ────────────────────────────────

export interface PendingProductsParams {
  page?: number;
  limit?: number;
}

export interface AdminProductListParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** List products awaiting admin approval. */
export async function getPendingProducts(params?: PendingProductsParams) {
  const res = await api.get('/admin/products/pending', { params });
  return res.data;
}

/** List all products (admin view) with optional status filter. */
export async function getAdminProducts(params?: AdminProductListParams) {
  const res = await api.get('/admin/products', { params });
  return res.data;
}

/** Fetch a single product by ID (admin view). */
export async function getAdminProduct(id: string) {
  const res = await api.get(`/admin/products/${id}`);
  return res.data;
}

/** Approve a pending product listing. */
export async function approveProduct(id: string) {
  const res = await api.post(`/admin/products/${id}/approve`);
  return res.data;
}

/** Reject a pending product listing with a reason. */
export async function rejectProduct(id: string, data: { reason: string }) {
  const res = await api.post(`/admin/products/${id}/reject`, data);
  return res.data;
}

// ─── Order Management ────────────────────────────────

export interface AdminOrderListParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** List all orders across the platform. */
export async function getOrders(params?: AdminOrderListParams) {
  const res = await api.get('/admin/orders', { params });
  return res.data;
}

/** Fetch a single order by order number (admin view). */
export async function getOrder(orderNumber: string) {
  const res = await api.get(`/admin/orders/${orderNumber}`);
  return res.data;
}

/** Update an order's status (e.g. for fulfillment transitions). */
export async function updateOrderStatus(
  orderNumber: string,
  data: { status: string; notes?: string },
) {
  const res = await api.post(`/admin/orders/${orderNumber}/update-status`, data);
  return res.data;
}

// ─── Warehouse / QC ──────────────────────────────────

export interface WarehouseParams {
  status?: string;
  page?: number;
}

/** List warehouse fulfillment items. */
export async function getWarehouseItems(params?: WarehouseParams) {
  const res = await api.get('/admin/warehouse', { params });
  return res.data;
}

/** Mark a warehouse item as received. */
export async function receiveWarehouseItem(id: string) {
  const res = await api.post(`/admin/warehouse/${id}/receive`);
  return res.data;
}

/** Submit quality check results for a warehouse item. */
export async function submitQc(
  id: string,
  data: { result: 'PASS' | 'FAIL'; checklist: Record<string, boolean>; defectNotes?: string },
) {
  const res = await api.post(`/admin/warehouse/${id}/qc`, data);
  return res.data;
}

/** Dispatch a warehouse item with tracking info. */
export async function dispatchItem(
  id: string,
  data: { trackingNumber: string; shippingCarrier: string },
) {
  const res = await api.post(`/admin/warehouse/${id}/dispatch`, data);
  return res.data;
}

// ─── On-Demand Requests ──────────────────────────────

/** List all on-demand requests (admin view). */
export async function getOnDemandRequests(params?: { status?: string }) {
  const res = await api.get('/admin/on-demand-requests', { params });
  return res.data;
}

/** Fetch a single on-demand request by ID (admin view). */
export async function getOnDemandRequest(id: string) {
  const res = await api.get(`/admin/on-demand-requests/${id}`);
  return res.data;
}

/** Assign a seller to an on-demand request. */
export async function assignSellerToRequest(
  requestId: string,
  data: { sellerProfileId: string },
) {
  const res = await api.post(`/admin/on-demand-requests/${requestId}/assign-seller`, data);
  return res.data;
}

/** Create a quote for an on-demand request. */
export async function createOnDemandQuote(
  requestId: string,
  data: {
    priceInCents: number;
    estimatedDays: number;
    description?: string;
    validityHours?: number;
    sellerProfileId?: string;
  },
) {
  const res = await api.post(`/admin/on-demand-requests/${requestId}/quote`, data);
  return res.data;
}

// ─── Returns ─────────────────────────────────────────

/** List all return requests (admin view). */
export async function getReturns(params?: { status?: string }) {
  const res = await api.get('/admin/returns', { params });
  return res.data;
}

/** Review and decide on a return request. */
export async function reviewReturn(
  id: string,
  data: { decision: string; adminNotes?: string; refundAmountCents?: number },
) {
  const res = await api.post(`/admin/returns/${id}/review`, data);
  return res.data;
}

// ─── Disputes ────────────────────────────────────────

/** List all disputes (admin view). */
export async function getDisputes(params?: { status?: string }) {
  const res = await api.get('/admin/disputes', { params });
  return res.data;
}

/** Resolve a dispute with a resolution summary. */
export async function resolveDispute(id: string, data: { resolutionSummary: string }) {
  const res = await api.post(`/admin/disputes/${id}/resolve`, data);
  return res.data;
}

// ─── Payouts ─────────────────────────────────────────

export interface PayoutListParams {
  status?: string;
  page?: number;
}

/** List all payout records. */
export async function getPayouts(params?: PayoutListParams) {
  const res = await api.get('/admin/payouts', { params });
  return res.data;
}

/** Fetch a single payout by ID. */
export async function getPayoutDetail(id: string) {
  const res = await api.get(`/admin/payouts/${id}`);
  return res.data;
}

/** Generate a new payout cycle for sellers. */
export async function generatePayoutCycle(data: { cycleStart: string; cycleEnd: string }) {
  const res = await api.post('/admin/payouts/generate', data);
  return res.data;
}

/** Approve a payout for processing. */
export async function approvePayout(id: string) {
  const res = await api.post(`/admin/payouts/${id}/approve`);
  return res.data;
}

/** Mark a payout as paid with a payment reference. */
export async function markPayoutPaid(id: string, data: { paymentReference: string }) {
  const res = await api.post(`/admin/payouts/${id}/mark-paid`, data);
  return res.data;
}

// ─── Analytics ──────────────────────────────────────

export interface RevenueAnalyticsParams {
  period?: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

export interface OrderAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

export interface SellerAnalyticsParams {
  limit?: number;
}

export interface CategoryAnalyticsParams {
  limit?: number;
}

/** Fetch revenue analytics grouped by time period. */
export async function getRevenueAnalytics(params?: RevenueAnalyticsParams) {
  const res = await api.get('/admin/analytics/revenue', { params });
  return res.data;
}

/** Fetch order volume, average value, and status distribution. */
export async function getOrderAnalytics(params?: OrderAnalyticsParams) {
  const res = await api.get('/admin/analytics/orders', { params });
  return res.data;
}

/** Fetch top sellers by revenue. */
export async function getSellerAnalytics(params?: SellerAnalyticsParams) {
  const res = await api.get('/admin/analytics/sellers', { params });
  return res.data;
}

/** Fetch top categories by revenue. */
export async function getCategoryAnalytics(params?: CategoryAnalyticsParams) {
  const res = await api.get('/admin/analytics/categories', { params });
  return res.data;
}

// ─── Platform Settings ──────────────────────────────

/** Fetch all platform settings. */
export async function getSettings() {
  const res = await api.get('/admin/settings');
  return res.data;
}

/** Update a single platform setting by key. */
export async function updateSetting(data: { key: string; value: unknown }) {
  const res = await api.put('/admin/settings', data);
  return res.data;
}

// ─── SLA Monitoring ─────────────────────────────────

/** Fetch SLA dashboard summary (totals, by-type, top offenders). */
export async function getSlaDashboard() {
  const res = await api.get('/admin/sla/dashboard');
  return res.data;
}

export interface SlaBreachParams {
  slaType?: string;
  sellerProfileId?: string;
  page?: number;
  limit?: number;
}

/** Fetch paginated SLA breaches with optional filters. */
export async function getSlaBreaches(params?: SlaBreachParams) {
  const res = await api.get('/admin/sla/breaches', { params });
  return res.data;
}

// ─── Penalties ──────────────────────────────────────

export interface AdminPenaltyListParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** Fetch all penalties across the platform. */
export async function getAdminPenalties(params?: AdminPenaltyListParams) {
  const res = await api.get('/admin/penalties', { params });
  return res.data;
}

export interface CreatePenaltyData {
  sellerProfileId: string;
  type: 'QC_FAILURE' | 'SLA_BREACH' | 'RETURN_LIABILITY' | 'OTHER';
  amountInCents: number;
  reason: string;
}

/** Create a new penalty for a seller. */
export async function createPenalty(data: CreatePenaltyData) {
  const res = await api.post('/admin/penalties', data);
  return res.data;
}

/** Waive a penalty by ID. */
export async function waivePenalty(id: string) {
  const res = await api.post(`/admin/penalties/${id}/waive`);
  return res.data;
}

// ─── Seller Performance ─────────────────────────────

export interface PerformanceListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/** Fetch all seller performance rankings. */
export async function getSellerPerformance(params?: PerformanceListParams) {
  const res = await api.get('/admin/performance/sellers', { params });
  return res.data;
}

// ─── Coupons ─────────────────────────────────────────

export interface CouponListParams {
  page?: number;
  limit?: number;
}

export interface CreateCouponData {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderCents?: number;
  maxDiscountCents?: number;
  maxUses?: number;
  expiresAt?: string;
}

export interface UpdateCouponData {
  code?: string;
  type?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  minOrderCents?: number | null;
  maxDiscountCents?: number | null;
  maxUses?: number | null;
  isActive?: boolean;
  expiresAt?: string | null;
}

/** List all coupons with pagination. */
export async function getCoupons(params?: CouponListParams) {
  const res = await api.get('/admin/coupons', { params });
  return res.data;
}

/** Create a new coupon. */
export async function createCoupon(data: CreateCouponData) {
  const res = await api.post('/admin/coupons', data);
  return res.data;
}

/** Update an existing coupon. */
export async function updateCoupon(id: string, data: UpdateCouponData) {
  const res = await api.put(`/admin/coupons/${id}`, data);
  return res.data;
}

/** Deactivate a coupon. */
export async function deleteCoupon(id: string) {
  const res = await api.delete(`/admin/coupons/${id}`);
  return res.data;
}
