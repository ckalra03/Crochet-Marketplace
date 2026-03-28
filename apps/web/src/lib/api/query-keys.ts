import type { ProductListParams, CategoryProductParams } from './catalog';
import type { OrderListParams } from './orders';
import type { AuditLogParams, SellerListParams, AdminOrderListParams, PendingProductsParams, AdminProductListParams, WarehouseParams, PayoutListParams, RevenueAnalyticsParams, OrderAnalyticsParams, SellerAnalyticsParams, CategoryAnalyticsParams, SlaBreachParams, AdminPenaltyListParams, PerformanceListParams, CouponListParams } from './admin';
import type { PaginationParams, SellerPenaltyParams, SellerSlaBreachParams } from './seller';
import type { WishlistParams } from './wishlist';
import type { NotificationParams } from './notifications';

/**
 * Centralized query key factory for React Query.
 * Ensures consistent cache keys across the application.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: () => ['auth', 'profile'] as const,
  },

  catalog: {
    all: ['catalog'] as const,
    products: (params?: ProductListParams) => ['catalog', 'products', params] as const,
    product: (slug: string) => ['catalog', 'product', slug] as const,
    categories: () => ['catalog', 'categories'] as const,
    categoryProducts: (slug: string, params?: CategoryProductParams) =>
      ['catalog', 'categories', slug, 'products', params] as const,
  },

  cart: {
    all: ['cart'] as const,
    detail: () => ['cart', 'detail'] as const,
  },

  orders: {
    all: ['orders'] as const,
    list: (params?: OrderListParams) => ['orders', 'list', params] as const,
    detail: (orderNumber: string) => ['orders', orderNumber] as const,
  },

  onDemand: {
    all: ['on-demand'] as const,
    list: () => ['on-demand', 'list'] as const,
    detail: (id: string) => ['on-demand', id] as const,
  },

  returns: {
    all: ['returns'] as const,
    list: () => ['returns', 'list'] as const,
    detail: (returnNumber: string) => ['returns', returnNumber] as const,
  },

  profile: {
    all: ['profile'] as const,
    detail: () => ['profile', 'detail'] as const,
    addresses: () => ['profile', 'addresses'] as const,
  },

  seller: {
    all: ['seller'] as const,
    profile: () => ['seller', 'profile'] as const,
    dashboard: () => ['seller', 'dashboard'] as const,
    products: (params?: PaginationParams) => ['seller', 'products', params] as const,
    product: (id: string) => ['seller', 'products', id] as const,
    orders: (params?: PaginationParams) => ['seller', 'orders', params] as const,
    payouts: () => ['seller', 'payouts'] as const,
    payout: (id: string) => ['seller', 'payouts', id] as const,
    ratings: () => ['seller', 'ratings'] as const,
    performance: () => ['seller', 'performance'] as const,
    penalties: (params?: SellerPenaltyParams) => ['seller', 'penalties', params] as const,
    slaBreaches: (params?: SellerSlaBreachParams) => ['seller', 'sla-breaches', params] as const,
  },

  wishlist: {
    all: ['wishlist'] as const,
    list: (params?: WishlistParams) => ['wishlist', 'list', params] as const,
    ids: () => ['wishlist', 'ids'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: (params?: NotificationParams) => ['notifications', 'list', params] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },

  admin: {
    all: ['admin'] as const,
    dashboard: () => ['admin', 'dashboard'] as const,
    auditLogs: (params?: AuditLogParams) => ['admin', 'audit-logs', params] as const,
    sellers: (params?: SellerListParams) => ['admin', 'sellers', params] as const,
    seller: (id: string) => ['admin', 'sellers', id] as const,
    pendingProducts: (params?: PendingProductsParams) =>
      ['admin', 'products', 'pending', params] as const,
    products: (params?: AdminProductListParams) =>
      ['admin', 'products', 'list', params] as const,
    product: (id: string) => ['admin', 'products', id] as const,
    orders: (params?: AdminOrderListParams) => ['admin', 'orders', params] as const,
    order: (orderNumber: string) => ['admin', 'orders', orderNumber] as const,
    warehouse: (params?: WarehouseParams) => ['admin', 'warehouse', params] as const,
    onDemandRequests: (params?: { status?: string }) =>
      ['admin', 'on-demand-requests', params] as const,
    returns: (params?: { status?: string }) => ['admin', 'returns', params] as const,
    disputes: (params?: { status?: string }) => ['admin', 'disputes', params] as const,
    payouts: (params?: PayoutListParams) => ['admin', 'payouts', params] as const,
    payoutDetail: (id: string) => ['admin', 'payouts', id] as const,

    // Analytics
    revenueAnalytics: (params?: RevenueAnalyticsParams) =>
      ['admin', 'analytics', 'revenue', params] as const,
    orderAnalytics: (params?: OrderAnalyticsParams) =>
      ['admin', 'analytics', 'orders', params] as const,
    sellerAnalytics: (params?: SellerAnalyticsParams) =>
      ['admin', 'analytics', 'sellers', params] as const,
    categoryAnalytics: (params?: CategoryAnalyticsParams) =>
      ['admin', 'analytics', 'categories', params] as const,

    // Platform Settings
    settings: () => ['admin', 'settings'] as const,

    // SLA Monitoring
    slaDashboard: () => ['admin', 'sla', 'dashboard'] as const,
    slaBreaches: (params?: SlaBreachParams) => ['admin', 'sla', 'breaches', params] as const,

    // Penalties
    penalties: (params?: AdminPenaltyListParams) => ['admin', 'penalties', params] as const,

    // Seller Performance
    sellerPerformance: (params?: PerformanceListParams) =>
      ['admin', 'performance', 'sellers', params] as const,

    // Coupons
    coupons: (params?: CouponListParams) => ['admin', 'coupons', params] as const,
  },
} as const;
