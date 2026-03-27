'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitRating } from '@/lib/api/ratings';
import type { SubmitRatingData } from '@/lib/api/ratings';
import { queryKeys } from '@/lib/api/query-keys';

/** Mutation to submit a rating and optional review for a delivered order item. */
export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderNumber,
      orderItemId,
      data,
    }: {
      orderNumber: string;
      orderItemId: string;
      data: SubmitRatingData;
    }) => submitRating(orderNumber, orderItemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.ratings() });
    },
  });
}
