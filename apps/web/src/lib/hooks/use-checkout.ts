'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '@/lib/api/checkout';
import type { CheckoutData } from '@/lib/api/checkout';
import { queryKeys } from '@/lib/api/query-keys';
import { useCartStore } from '@/lib/stores/cart-store';

/** Mutation to create an order from the current cart contents. */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutData) => createOrder(data),
    onSuccess: () => {
      useCartStore.getState().clearCart();
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
