'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOnDemandRequests,
  getOnDemandRequest,
  submitOnDemandRequest,
  acceptQuote,
  rejectQuote,
} from '@/lib/api/on-demand';
import type { SubmitOnDemandData } from '@/lib/api/on-demand';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch all on-demand requests for the current buyer. */
export function useOnDemandRequests() {
  return useQuery({
    queryKey: queryKeys.onDemand.list(),
    queryFn: () => getOnDemandRequests(),
  });
}

/** Fetch details of a single on-demand request. */
export function useOnDemandRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.onDemand.detail(id),
    queryFn: () => getOnDemandRequest(id),
    enabled: !!id,
  });
}

/** Submit a new on-demand crochet request. Invalidates list on success. */
export function useSubmitOnDemandRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitOnDemandData) => submitOnDemandRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onDemand.all });
    },
  });
}

/** Accept a seller's quote on an on-demand request. */
export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, quoteId }: { requestId: string; quoteId: string }) =>
      acceptQuote(requestId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onDemand.all });
    },
  });
}

/** Reject a seller's quote on an on-demand request. */
export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, quoteId }: { requestId: string; quoteId: string }) =>
      rejectQuote(requestId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.onDemand.all });
    },
  });
}
