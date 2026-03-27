'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrderByNumber, cancelOrder } from '@/lib/api/orders';
import type { OrderListParams, CancelOrderData } from '@/lib/api/orders';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch the current buyer's orders with optional filters. */
export function useOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => getOrders(params),
  });
}

/** Fetch a single order by its order number. */
export function useOrder(orderNumber: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderNumber),
    queryFn: () => getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });
}

/** Cancel an order. Invalidates order queries on success. */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderNumber, data }: { orderNumber: string; data: CancelOrderData }) =>
      cancelOrder(orderNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
