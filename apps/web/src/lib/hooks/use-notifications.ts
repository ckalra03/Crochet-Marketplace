'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/api/notifications';
import type { NotificationParams } from '@/lib/api/notifications';
import { queryKeys } from '@/lib/api/query-keys';

/** Fetch paginated notifications for the current user. */
export function useNotifications(params?: NotificationParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => getNotifications(params),
  });
}

/** Fetch the unread notification count. */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => getUnreadCount(),
    // Poll every 30 seconds as a fallback for missed socket events
    refetchInterval: 30_000,
  });
}

/** Mutation to mark a single notification as read. */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Mutation to mark all notifications as read. */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
