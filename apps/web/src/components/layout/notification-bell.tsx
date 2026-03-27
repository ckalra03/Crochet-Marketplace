'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/lib/hooks/use-notifications';
import { useSocketEvent } from '@/lib/socket/use-socket-event';
import { queryKeys } from '@/lib/api/query-keys';
import type { Notification } from '@/lib/api/notifications';

/**
 * Returns a human-readable relative time string (e.g. "2m ago", "3h ago").
 */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return 'just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/**
 * Notification bell icon with unread badge and dropdown.
 * Listens to Socket.io for real-time notification updates.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData } = useNotifications({ page: 1, limit: 5 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.notifications ?? [];

  // Listen for real-time notifications via Socket.io
  useSocketEvent<Notification>(
    'notification',
    useCallback(
      (data) => {
        // Invalidate queries so the bell count and list refresh
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        // Show a toast for the incoming notification
        toast.info(data.title, { description: data.body ?? undefined });
      },
      [queryClient],
    ),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleNotificationClick(notification: Notification) {
    if (!notification.readAt) {
      markAsRead.mutate(notification.id);
    }
    setOpen(false);
  }

  function handleMarkAllAsRead() {
    markAllAsRead.mutate();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-[#1c1b1b] hover:text-primary-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#e7e5e4] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e7e5e4]">
            <span className="font-semibold text-sm text-[#1c1b1b]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#78716c]">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#f5f5f4] hover:bg-[#fafaf9] transition-colors ${
                    !n.readAt ? 'bg-primary-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Unread indicator dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!n.readAt ? (
                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-transparent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1c1b1b] truncate">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-[#78716c] truncate mt-0.5">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-[#a8a29e] mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#e7e5e4] text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
