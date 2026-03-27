import prisma from '../../config/database';
import { emitToUser } from '../../socket/socket';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('notification-persistence');

/** Parameters for paginated notification queries. */
export interface NotificationListParams {
  page?: number;
  limit?: number;
}

/** Data required to create a new notification. */
export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

/**
 * Handles persisting notifications to the database and emitting
 * real-time updates via Socket.io.
 */
class NotificationPersistenceService {
  /**
   * Save a notification to the DB and emit it to the user in real time.
   */
  async createNotification(input: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        data: input.data ?? undefined,
      },
    });

    log.info(`Created notification [${input.type}] for user:${input.userId}`);

    // Emit real-time event so the frontend can update instantly
    emitToUser(input.userId, 'notification', notification);

    return notification;
  }

  /**
   * Get paginated list of notifications for a user (newest first).
   */
  async getNotifications(userId: string, params?: NotificationListParams) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Count unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  /**
   * Mark a single notification as read (sets readAt to now).
   * Only the owning user can mark their own notification.
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });

    return notification.count > 0;
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    log.info(`Marked ${result.count} notifications as read for user:${userId}`);
    return result.count;
  }
}

export const notificationPersistenceService = new NotificationPersistenceService();
