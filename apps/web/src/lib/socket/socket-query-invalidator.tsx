'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocketEvent } from './use-socket-event';

/**
 * Listens to key socket events and invalidates React Query caches accordingly.
 * Shows toast notifications for important events.
 *
 * Place this component inside SocketProvider and QueryClientProvider.
 */
export function SocketQueryInvalidator() {
  const queryClient = useQueryClient();

  // --- Order status updated ---
  useSocketEvent<{ orderNumber: string; status: string }>(
    'order:status_updated',
    useCallback(
      (data) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        toast.info(`Order ${data.orderNumber} status updated to ${data.status}`);
      },
      [queryClient],
    ),
  );

  // --- Order allocated to seller ---
  useSocketEvent(
    'order:allocated',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      toast.info('New order allocated');
    }, [queryClient]),
  );

  // --- Quote issued for on-demand request ---
  useSocketEvent(
    'quote:issued',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['on-demand'] });
      toast.info('New quote received for your request');
    }, [queryClient]),
  );

  // --- Product reviewed by admin ---
  useSocketEvent<{ name: string; status: string }>(
    'product:reviewed',
    useCallback(
      (data) => {
        queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
        toast.info(`Product ${data.name} has been ${data.status}`);
      },
      [queryClient],
    ),
  );

  // --- Seller application reviewed ---
  useSocketEvent<{ status: string }>(
    'seller:application_reviewed',
    useCallback(
      (data) => {
        queryClient.invalidateQueries({ queryKey: ['seller'] });
        toast.info(`Seller application ${data.status}`);
      },
      [queryClient],
    ),
  );

  // --- Return resolved ---
  useSocketEvent<{ returnNumber: string }>(
    'return:resolved',
    useCallback(
      (data) => {
        queryClient.invalidateQueries({ queryKey: ['returns'] });
        toast.info(`Return ${data.returnNumber} resolved`);
      },
      [queryClient],
    ),
  );

  // --- Payout processed ---
  useSocketEvent(
    'payout:processed',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'payouts'] });
      toast.info('Payout processed');
    }, [queryClient]),
  );

  // --- Warehouse item received (silent — badge update only) ---
  useSocketEvent(
    'warehouse:item_received',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse'] });
    }, [queryClient]),
  );

  // --- Dispute created (admin notification) ---
  useSocketEvent(
    'dispute:created',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      toast.info('New dispute filed');
    }, [queryClient]),
  );

  // --- Dashboard counts updated (silent) ---
  useSocketEvent(
    'dashboard:counts_updated',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    }, [queryClient]),
  );

  // This component renders nothing — it only manages side effects
  return null;
}
