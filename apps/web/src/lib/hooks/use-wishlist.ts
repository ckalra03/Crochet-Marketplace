'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWishlist,
  getWishlistIds,
  addToWishlist,
  removeFromWishlist,
} from '@/lib/api/wishlist';
import type { WishlistParams } from '@/lib/api/wishlist';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch the current user's wishlist (paginated). */
export function useWishlist(params?: WishlistParams) {
  return useQuery({
    queryKey: queryKeys.wishlist.list(params),
    queryFn: () => getWishlist(params),
  });
}

/** Fetch all wishlisted product IDs as a Set for quick lookup. */
export function useWishlistIds() {
  return useQuery({
    queryKey: queryKeys.wishlist.ids(),
    queryFn: async () => {
      const data = await getWishlistIds();
      return new Set(data.productIds);
    },
  });
}

/** Mutation to add a product to the wishlist. Invalidates wishlist cache on success. */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}

/** Mutation to remove a product from the wishlist. Invalidates wishlist cache on success. */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}
