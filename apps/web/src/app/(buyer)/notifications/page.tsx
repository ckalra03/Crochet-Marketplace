'use client';

import { useState } from 'react';
import { Bell, Package, ShoppingCart, MessageSquare, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications, useMarkAsRead } from '@/lib/hooks/use-notifications';
import type { Notification } from '@/lib/api/notifications';

/**
 * Returns a human-readable relative time string.
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

/** Map notification type to an icon component. */
function getNotificationIcon(type: string) {
  if (type.startsWith('order.')) return <Package className="h-5 w-5 text-blue-500" />;
  if (type.startsWith('seller.') || type.startsWith('product.')) return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (type.startsWith('quote.')) return <MessageSquare className="h-5 w-5 text-purple-500" />;
  if (type.startsWith('return.') || type.startsWith('dispute.')) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
  if (type.startsWith('payout.')) return <ShoppingCart className="h-5 w-5 text-emerald-500" />;
  if (type === 'new_order') return <Star className="h-5 w-5 text-yellow-500" />;
  return <Bell className="h-5 w-5 text-[#78716c]" />;
}

/**
 * Full notification history page with pagination.
 * Clicking a notification marks it as read.
 */
export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useNotifications({ page, limit: 20 });
  const markAsRead = useMarkAsRead();

  function handleClick(notification: Notification) {
    if (!notification.readAt) {
      markAsRead.mutate(notification.id);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                    <div className="h-2 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <p className="text-muted-foreground">Failed to load notifications. Please try again.</p>
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Empty state
  if (notifications.length === 0 && page === 1) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No notifications</h1>
        <p className="text-muted-foreground">
          You&apos;re all caught up! New notifications will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full text-left rounded-xl border transition-colors ${
              !n.readAt
                ? 'bg-primary-50/30 border-primary-200/50 hover:bg-primary-50/50'
                : 'bg-white border-[#e7e5e4] hover:bg-[#fafaf9]'
            }`}
          >
            <div className="p-4 flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-[#f5f5f4] flex items-center justify-center flex-shrink-0">
                {getNotificationIcon(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!n.readAt ? 'font-semibold' : 'font-medium'} text-[#1c1b1b]`}>
                    {n.title}
                  </p>
                  {!n.readAt && (
                    <div className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" />
                  )}
                </div>
                {n.body && (
                  <p className="text-sm text-[#78716c] mt-0.5">{n.body}</p>
                )}
                <p className="text-xs text-[#a8a29e] mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#e7e5e4] hover:bg-[#fafaf9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[#78716c]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#e7e5e4] hover:bg-[#fafaf9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
