'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDashboard,
  getAuditLogs,
  getSellers,
  getSeller,
  approveSeller,
  rejectSeller,
  suspendSeller,
  getPendingProducts,
  getAdminProducts,
  getAdminProduct,
  approveProduct,
  rejectProduct,
  getOrders,
  getOrder,
  updateOrderStatus,
  getWarehouseItems,
  receiveWarehouseItem,
  submitQc,
  dispatchItem,
  getOnDemandRequests,
  getOnDemandRequest,
  assignSellerToRequest,
  createOnDemandQuote,
  getReturns,
  reviewReturn,
  getDisputes,
  resolveDispute,
  getPayouts,
  getPayoutDetail,
  generatePayoutCycle,
  approvePayout,
  markPayoutPaid,
  getRevenueAnalytics,
  getOrderAnalytics,
  getSellerAnalytics,
  getCategoryAnalytics,
  getSettings,
  updateSetting,
  getSlaDashboard,
  getSlaBreaches,
  getAdminPenalties,
  createPenalty,
  waivePenalty,
  getSellerPerformance,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/lib/api/admin';
import type {
  AuditLogParams,
  SellerListParams,
  PendingProductsParams,
  AdminProductListParams,
  AdminOrderListParams,
  WarehouseParams,
  PayoutListParams,
  RevenueAnalyticsParams,
  OrderAnalyticsParams,
  SellerAnalyticsParams,
  CategoryAnalyticsParams,
  SlaBreachParams,
  AdminPenaltyListParams,
  CreatePenaltyData,
  PerformanceListParams,
  CouponListParams,
  CreateCouponData,
  UpdateCouponData,
} from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';

// ─── Dashboard ───────────────────────────────────────

/** Fetch admin dashboard summary stats. */
export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => getDashboard(),
  });
}

// ─── Seller Management ───────────────────────────────

/** Fetch a paginated list of sellers with optional status filter. */
export function useAdminSellers(params?: SellerListParams) {
  return useQuery({
    queryKey: queryKeys.admin.sellers(params),
    queryFn: () => getSellers(params),
  });
}

/** Fetch a single seller profile by ID. */
export function useAdminSeller(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.seller(id),
    queryFn: () => getSeller(id),
    enabled: !!id,
  });
}

/** Mutation to approve a pending seller application. */
export function useApproveSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveSeller(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.sellers() });
    },
  });
}

/** Mutation to reject a pending seller application. */
export function useRejectSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectSeller(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.sellers() });
    },
  });
}

/** Mutation to suspend an active seller. */
export function useSuspendSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendSeller(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.sellers() });
    },
  });
}

// ─── Product Approval ────────────────────────────────

/** Fetch products awaiting admin approval. */
export function useAdminPendingProducts(params?: PendingProductsParams) {
  return useQuery({
    queryKey: queryKeys.admin.pendingProducts(params),
    queryFn: () => getPendingProducts(params),
  });
}

/** Fetch all products with optional status filter (admin view). */
export function useAdminProducts(params?: AdminProductListParams) {
  return useQuery({
    queryKey: queryKeys.admin.products(params),
    queryFn: () => getAdminProducts(params),
  });
}

/** Fetch a single product by ID (admin view). */
export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.product(id),
    queryFn: () => getAdminProduct(id),
    enabled: !!id,
  });
}

/** Mutation to approve a pending product listing. */
export function useApproveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingProducts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    },
  });
}

/** Mutation to reject a pending product listing. */
export function useRejectProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectProduct(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingProducts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products() });
    },
  });
}

// ─── Order Management ────────────────────────────────

/** Fetch all orders across the platform. */
export function useAdminOrders(params?: AdminOrderListParams) {
  return useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: () => getOrders(params),
  });
}

/** Fetch a single order by order number (admin view). */
export function useAdminOrder(orderNumber: string) {
  return useQuery({
    queryKey: queryKeys.admin.order(orderNumber),
    queryFn: () => getOrder(orderNumber),
    enabled: !!orderNumber,
  });
}

/** Mutation to update an order's status. */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderNumber,
      data,
    }: {
      orderNumber: string;
      data: { status: string; notes?: string };
    }) => updateOrderStatus(orderNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

// ─── Warehouse / QC ──────────────────────────────────

/** Fetch warehouse fulfillment items. */
export function useAdminWarehouse(params?: WarehouseParams) {
  return useQuery({
    queryKey: queryKeys.admin.warehouse(params),
    queryFn: () => getWarehouseItems(params),
  });
}

/** Mutation to mark a warehouse item as received. */
export function useReceiveWarehouseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => receiveWarehouseItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.warehouse() });
    },
  });
}

/** Mutation to submit quality check results. */
export function useSubmitQC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { result: 'PASS' | 'FAIL'; checklist: Record<string, boolean>; defectNotes?: string };
    }) => submitQc(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.warehouse() });
    },
  });
}

/** Mutation to dispatch a warehouse item with tracking info. */
export function useDispatchItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { trackingNumber: string; shippingCarrier: string };
    }) => dispatchItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.warehouse() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() });
    },
  });
}

// ─── On-Demand Requests ──────────────────────────────

/** Fetch all on-demand requests (admin view). */
export function useAdminOnDemandRequests(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.onDemandRequests(params),
    queryFn: () => getOnDemandRequests(params),
  });
}

/** Fetch a single on-demand request by ID (admin view). */
export function useAdminOnDemandRequest(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.onDemandRequests(), id] as const,
    queryFn: () => getOnDemandRequest(id),
    enabled: !!id,
  });
}

/** Mutation to assign a seller to an on-demand request. */
export function useAssignSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      sellerProfileId,
    }: {
      requestId: string;
      sellerProfileId: string;
    }) => assignSellerToRequest(requestId, { sellerProfileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.onDemandRequests() });
    },
  });
}

/** Mutation to create a quote for an on-demand request. */
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string;
      data: {
        priceInCents: number;
        estimatedDays: number;
        description?: string;
        validityHours?: number;
        sellerProfileId?: string;
      };
    }) => createOnDemandQuote(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.onDemandRequests() });
    },
  });
}

// ─── Returns ─────────────────────────────────────────

/** Fetch all return requests (admin view). */
export function useAdminReturns(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.returns(params),
    queryFn: () => getReturns(params),
  });
}

/** Mutation to review and decide on a return request. */
export function useReviewReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { decision: string; adminNotes?: string; refundAmountCents?: number };
    }) => reviewReturn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.returns() });
    },
  });
}

// ─── Disputes ────────────────────────────────────────

/** Fetch all disputes (admin view). */
export function useAdminDisputes(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.disputes(params),
    queryFn: () => getDisputes(params),
  });
}

/** Mutation to resolve a dispute. */
export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resolutionSummary }: { id: string; resolutionSummary: string }) =>
      resolveDispute(id, { resolutionSummary }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.disputes() });
    },
  });
}

// ─── Payouts ─────────────────────────────────────────

/** Fetch all payout records. */
export function useAdminPayouts(params?: PayoutListParams) {
  return useQuery({
    queryKey: queryKeys.admin.payouts(params),
    queryFn: () => getPayouts(params),
  });
}

/** Fetch a single payout by ID. */
export function useAdminPayoutDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.payoutDetail(id),
    queryFn: () => getPayoutDetail(id),
    enabled: !!id,
  });
}

/** Mutation to generate a new payout cycle. */
export function useGeneratePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { cycleStart: string; cycleEnd: string }) =>
      generatePayoutCycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.payouts() });
    },
  });
}

/** Mutation to approve a payout for processing. */
export function useApprovePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approvePayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.payouts() });
    },
  });
}

/** Mutation to mark a payout as paid. */
export function useMarkPayoutPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentReference }: { id: string; paymentReference: string }) =>
      markPayoutPaid(id, { paymentReference }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.payouts() });
    },
  });
}

// ─── Audit Logs ──────────────────────────────────────

/** Fetch paginated audit logs with optional filters. */
export function useAdminAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(params),
    queryFn: () => getAuditLogs(params),
  });
}

// ─── Analytics ──────────────────────────────────────

/** Fetch revenue analytics grouped by time period. */
export function useRevenueAnalytics(params?: RevenueAnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.admin.revenueAnalytics(params),
    queryFn: () => getRevenueAnalytics(params),
  });
}

/** Fetch order volume, average value, and status distribution. */
export function useOrderAnalytics(params?: OrderAnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.admin.orderAnalytics(params),
    queryFn: () => getOrderAnalytics(params),
  });
}

/** Fetch top sellers by revenue. */
export function useSellerAnalytics(params?: SellerAnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.admin.sellerAnalytics(params),
    queryFn: () => getSellerAnalytics(params),
  });
}

/** Fetch top categories by revenue. */
export function useCategoryAnalytics(params?: CategoryAnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.admin.categoryAnalytics(params),
    queryFn: () => getCategoryAnalytics(params),
  });
}

// ─── Platform Settings ──────────────────────────────

/** Fetch all platform settings. */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: () => getSettings(),
  });
}

/** Mutation to update a single platform setting. */
export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { key: string; value: unknown }) => updateSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings() });
    },
  });
}

// ─── SLA Monitoring ─────────────────────────────────

/** Fetch SLA dashboard summary. */
export function useSlaDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.slaDashboard(),
    queryFn: () => getSlaDashboard(),
  });
}

/** Fetch paginated SLA breaches. */
export function useSlaBreaches(params?: SlaBreachParams) {
  return useQuery({
    queryKey: queryKeys.admin.slaBreaches(params),
    queryFn: () => getSlaBreaches(params),
  });
}

// ─── Penalties ──────────────────────────────────────

/** Fetch all penalties across the platform. */
export function useAdminPenalties(params?: AdminPenaltyListParams) {
  return useQuery({
    queryKey: queryKeys.admin.penalties(params),
    queryFn: () => getAdminPenalties(params),
  });
}

/** Mutation to create a new penalty. */
export function useCreatePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePenaltyData) => createPenalty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.penalties() });
    },
  });
}

/** Mutation to waive a penalty. */
export function useWaivePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => waivePenalty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.penalties() });
    },
  });
}

// ─── Seller Performance ─────────────────────────────

/** Fetch all seller performance rankings. */
export function useAdminSellerPerformance(params?: PerformanceListParams) {
  return useQuery({
    queryKey: queryKeys.admin.sellerPerformance(params),
    queryFn: () => getSellerPerformance(params),
  });
}

// ─── Coupons ─────────────────────────────────────────

/** Fetch all coupons with pagination. */
export function useAdminCoupons(params?: CouponListParams) {
  return useQuery({
    queryKey: queryKeys.admin.coupons(params),
    queryFn: () => getCoupons(params),
  });
}

/** Mutation to create a new coupon. */
export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCouponData) => createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons() });
    },
  });
}

/** Mutation to update an existing coupon. */
export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponData }) =>
      updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons() });
    },
  });
}

/** Mutation to deactivate (soft delete) a coupon. */
export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons() });
    },
  });
}
