import { Router, Request, Response, NextFunction } from 'express';
import { notificationPersistenceService } from '../modules/notifications/notification-persistence.service';

const router = Router();

/** GET /api/v1/notifications -- paginated list of notifications for the current user. */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await notificationPersistenceService.getNotifications(
      req.user!.userId,
      { page, limit },
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/notifications/unread-count -- count of unread notifications. */
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await notificationPersistenceService.getUnreadCount(req.user!.userId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/notifications/:id/read -- mark a single notification as read. */
router.post('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const marked = await notificationPersistenceService.markAsRead(
      req.params.id,
      req.user!.userId,
    );
    if (!marked) {
      return res.status(404).json({ message: 'Notification not found or already read' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/notifications/read-all -- mark all unread notifications as read. */
router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await notificationPersistenceService.markAllAsRead(req.user!.userId);
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

export default router;
