# Branch 20: `feature/fe-api-layer` — API Client Modules + React Query Hooks

**Date:** 2026-03-27 | **Commits:** 1

## What Was Built

Complete frontend API layer replacing raw `useEffect` + `api.get()` calls with domain-specific API modules and React Query hooks. Also upgraded the Axios interceptor with silent token refresh on 401.

## API Client Modules (`lib/api/`)

| Module | Functions | Backend Routes |
|--------|-----------|---------------|
| `auth.ts` | register, login, refresh, logout | `/auth/*` |
| `catalog.ts` | getProducts, getProductBySlug, getCategories, getCategoryProducts | `/catalog/*` |
| `cart.ts` | getCart, addToCart, updateCartItem, removeCartItem | `/cart/*` |
| `checkout.ts` | createOrder | `/checkout` |
| `orders.ts` | getOrders, getOrderByNumber, cancelOrder | `/orders/*` |
| `on-demand.ts` | getOnDemandRequests, getOnDemandRequest, submitOnDemandRequest, acceptQuote, rejectQuote | `/on-demand/*` |
| `returns.ts` | getReturns, getReturn, submitReturn | `/returns/*` |
| `ratings.ts` | submitRating | `/orders/:num/items/:id/rating` |
| `profile.ts` | getProfile, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress | `/profile/*` |
| `seller.ts` | 16 functions: register, profile, dashboard, products CRUD, media, orders, payouts, ratings | `/seller/*` |
| `admin.ts` | 20 functions: dashboard, sellers, products, orders, warehouse/QC, on-demand, returns, disputes, payouts, audit-logs | `/admin/*` |
| `query-keys.ts` | Centralized query key factory for all domains | — |

## React Query Hooks (`lib/hooks/`)

| Hook File | Queries | Mutations |
|-----------|---------|-----------|
| `use-auth.ts` | — | useLogin, useRegister, useLogout |
| `use-catalog.ts` | useProducts, useProduct, useCategories, useCategoryProducts | — |
| `use-cart.ts` | useCart | useAddToCart, useUpdateCartItem, useRemoveCartItem |
| `use-checkout.ts` | — | useCreateOrder |
| `use-orders.ts` | useOrders, useOrder | useCancelOrder |
| `use-on-demand.ts` | useOnDemandRequests, useOnDemandRequest | useSubmitOnDemandRequest, useAcceptQuote, useRejectQuote |
| `use-returns.ts` | useReturns, useReturn | useSubmitReturn |
| `use-ratings.ts` | — | useSubmitRating |
| `use-profile.ts` | useProfile, useAddresses | useUpdateProfile, useAddAddress, useUpdateAddress, useDeleteAddress |
| `use-seller.ts` | useSellerDashboard, useSellerProducts, useSellerOrders, useSellerPayouts, useSellerPayout, useSellerRatings | useRegisterSeller, useCreateProduct, useUpdateProduct, useDeleteProduct, useSubmitForApproval, useUploadMedia, useDeleteMedia |
| `use-admin.ts` | useAdminDashboard, useAdminSellers, useAdminSeller, useAdminPendingProducts, useAdminOrders, useAdminOrder, useAdminWarehouse, useAdminOnDemandRequests, useAdminReturns, useAdminDisputes, useAdminPayouts, useAdminAuditLogs | useApproveSeller, useRejectSeller, useSuspendSeller, useApproveProduct, useRejectProduct, useUpdateOrderStatus, useReceiveWarehouseItem, useSubmitQC, useDispatchItem, useCreateQuote, useReviewReturn, useResolveDispute, useGeneratePayout, useApprovePayout, useMarkPayoutPaid |

## Token Refresh Interceptor

Upgraded `lib/api/client.ts` with:
- **Silent token refresh:** On 401, attempts `POST /auth/refresh` before redirecting to login
- **Promise queue:** Prevents concurrent refresh attempts (multiple 401s share one refresh call)
- **Retry logic:** Original failed request is retried with the new token
- **Safety guards:** `_retried` flag prevents infinite loops; refresh endpoint itself is excluded

## Query Key Convention

```typescript
queryKeys.catalog.products(params)  // ['catalog', 'products', params]
queryKeys.orders.detail(num)        // ['orders', num]
queryKeys.seller.products(params)   // ['seller', 'products', params]
queryKeys.admin.sellers(params)     // ['admin', 'sellers', params]
```

## Architecture Decisions

- **Every mutation invalidates related queries** on success via `queryClient.invalidateQueries()`
- **Auth mutations update Zustand store** directly (setAuth on login/register, logout on logout)
- **Cart mutations sync to Zustand** so UI updates immediately
- **Queries use `enabled` flag** for conditional fetching (e.g., `enabled: !!slug`)
- **StaleTime**: products 30s, categories 5min, dashboard 30s

## How to Verify

```bash
# TypeScript check — should show zero errors
cd apps/web && npx tsc --noEmit

# Check file count
ls src/lib/api/*.ts | wc -l   # Should be 13
ls src/lib/hooks/*.ts | wc -l  # Should be 11
```

## Key Files

- `apps/web/src/lib/api/client.ts` — Upgraded Axios instance with token refresh
- `apps/web/src/lib/api/query-keys.ts` — Centralized query key factory
- `apps/web/src/lib/api/*.ts` — 12 domain API modules
- `apps/web/src/lib/hooks/*.ts` — 11 React Query hook files
