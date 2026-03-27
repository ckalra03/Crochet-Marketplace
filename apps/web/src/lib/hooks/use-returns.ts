'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReturns, getReturn, submitReturn } from '@/lib/api/returns';
import type { SubmitReturnData } from '@/lib/api/returns';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch all return requests for the current buyer. */
export function useReturns() {
  return useQuery({
    queryKey: queryKeys.returns.list(),
    queryFn: () => getReturns(),
  });
}

/** Fetch details of a single return by its return number. */
export function useReturn(returnNumber: string) {
  return useQuery({
    queryKey: queryKeys.returns.detail(returnNumber),
    queryFn: () => getReturn(returnNumber),
    enabled: !!returnNumber,
  });
}

/** Submit a new return request. Invalidates return queries on success. */
export function useSubmitReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitReturnData) => submitReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
    },
  });
}
