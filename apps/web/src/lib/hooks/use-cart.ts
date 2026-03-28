'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart, updateCartItem, removeCartItem } from '@/lib/api/cart';
import type { AddToCartData, UpdateCartItemData } from '@/lib/api/cart';
import { queryKeys } from '@/lib/api/query-keys';
import { useCartStore } from '@/lib/stores/cart-store';

/** Fetch the current user's cart. Syncs with Zustand store. */
export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart.detail(),
    queryFn: async () => {
      const data = await getCart();
      useCartStore.getState().setCart(data.items, data.totalInCents);
      return data;
    },
  });
}

/** Add a product to the cart. Invalidates cart cache and syncs store on success. */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToCartData) => addToCart(data),
    onSuccess: async () => {
      // Invalidate and refetch cart to sync Zustand store (updates nav badge)
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      try {
        const cart = await getCart();
        useCartStore.getState().setCart(cart.items, cart.totalInCents);
      } catch {
        // Ignore — store will sync on next cart page visit
      }
    },
  });
}

/** Update the quantity of a cart item. Invalidates cart cache on success. */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCartItemData }) =>
      updateCartItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}

/** Remove an item from the cart. Invalidates cart cache on success. */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}
