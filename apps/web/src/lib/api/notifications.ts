import { api } from './client';

export interface NotificationParams {
  page?: number;
  limit?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Fetch paginated notifications for the current user. */
export async function getNotifications(params?: NotificationParams): Promise<NotificationListResponse> {
  const res = await api.get('/notifications', { params });
  return res.data;
}

/** Get count of unread notifications. */
export async function getUnreadCount(): Promise<{ count: number }> {
  const res = await api.get('/notifications/unread-count');
  return res.data;
}

/** Mark a single notification as read. */
export async function markAsRead(id: string): Promise<{ success: boolean }> {
  const res = await api.post(`/notifications/${id}/read`);
  return res.data;
}

/** Mark all unread notifications as read. */
export async function markAllAsRead(): Promise<{ success: boolean; count: number }> {
  const res = await api.post('/notifications/read-all');
  return res.data;
}
