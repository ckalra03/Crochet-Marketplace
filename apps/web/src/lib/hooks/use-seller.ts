'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  registerSeller,
  getSellerDashboard,
  getSellerProfile,
  updateSellerProfile,
  getSellerProducts,
  getSellerProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  submitProductForApproval,
  uploadProductMedia,
  deleteProductMedia,
  getSellerOrders,
  getSellerOrder,
  getSellerPayouts,
  getSellerPayout,
  getSellerRatings,
  updateBankDetails,
  getSellerPerformance,
  getSellerPenalties,
  getSellerSlaBreaches,
} from '@/lib/api/seller';
import type {
  SellerRegisterData,
  PaginationParams,
  CreateProductData,
  UpdateProductData,
  UpdateSellerProfileData,
  UpdateBankDetailsData,
  SellerPenaltyParams,
  SellerSlaBreachParams,
} from '@/lib/api/seller';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch the seller dashboard stats. */
export function useSellerDashboard() {
  return useQuery({
    queryKey: queryKeys.seller.dashboard(),
    queryFn: () => getSellerDashboard(),
  });
}

/** Fetch the seller's own products with optional pagination. */
export function useSellerProducts(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.seller.products(params),
    queryFn: () => getSellerProducts(params),
  });
}

/** Fetch a single seller product by ID. */
export function useSellerProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.seller.product(id),
    queryFn: () => getSellerProduct(id),
    enabled: !!id,
  });
}

/** Mutation to create a new product listing. */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products() });
    },
  });
}

/** Mutation to update an existing product. */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    },
  });
}

/** Mutation to delete a product listing. */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    },
  });
}

/** Mutation to submit a product for admin approval. */
export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => submitProductForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products() });
    },
  });
}

/** Mutation to upload an image or video for a product. */
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadProductMedia(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products() });
    },
  });
}

/** Mutation to remove a media file from a product. */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, mediaId }: { productId: string; mediaId: string }) =>
      deleteProductMedia(productId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products() });
    },
  });
}

/** Fetch the seller's profile. */
export function useSellerProfile() {
  return useQuery({
    queryKey: queryKeys.seller.profile(),
    queryFn: () => getSellerProfile(),
  });
}

/** Mutation to update the seller's business profile. */
export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSellerProfileData) => updateSellerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.profile() });
    },
  });
}

/** Mutation to update the seller's bank details. */
export function useUpdateBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBankDetailsData) => updateBankDetails(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.profile() });
    },
  });
}

/** Fetch orders allocated to the seller with optional pagination. */
export function useSellerOrders(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.seller.orders(params),
    queryFn: () => getSellerOrders(params),
  });
}

/** Fetch a single seller order item by ID. */
export function useSellerOrder(id: string) {
  return useQuery({
    queryKey: [...queryKeys.seller.orders(), id],
    queryFn: () => getSellerOrder(id),
    enabled: !!id,
  });
}

/** Fetch the seller's payout history. */
export function useSellerPayouts() {
  return useQuery({
    queryKey: queryKeys.seller.payouts(),
    queryFn: () => getSellerPayouts(),
  });
}

/** Fetch details of a specific payout. */
export function useSellerPayout(id: string) {
  return useQuery({
    queryKey: queryKeys.seller.payout(id),
    queryFn: () => getSellerPayout(id),
    enabled: !!id,
  });
}

/** Fetch ratings received by the seller. */
export function useSellerRatings() {
  return useQuery({
    queryKey: queryKeys.seller.ratings(),
    queryFn: () => getSellerRatings(),
  });
}

// ─── Performance Metrics ──────────────────────────────

/** Fetch the seller's own performance metrics. */
export function useSellerPerformance() {
  return useQuery({
    queryKey: queryKeys.seller.performance(),
    queryFn: () => getSellerPerformance(),
  });
}

// ─── Seller Penalties ─────────────────────────────────

/** Fetch the seller's own penalties. */
export function useSellerPenalties(params?: SellerPenaltyParams) {
  return useQuery({
    queryKey: queryKeys.seller.penalties(params),
    queryFn: () => getSellerPenalties(params),
  });
}

// ─── Seller SLA Breaches ──────────────────────────────

/** Fetch the seller's own SLA breaches. */
export function useSellerSlaBreaches(params?: SellerSlaBreachParams) {
  return useQuery({
    queryKey: queryKeys.seller.slaBreaches(params),
    queryFn: () => getSellerSlaBreaches(params),
  });
}

/** Mutation to register as a seller. */
export function useRegisterSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SellerRegisterData) => registerSeller(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.all });
    },
  });
}
