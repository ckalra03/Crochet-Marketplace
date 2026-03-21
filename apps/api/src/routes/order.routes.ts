import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../modules/orders/order.service';
import { ratingService } from '../modules/ratings/rating.service';
import { validate } from '../middleware/validate';
import { cancelOrderSchema } from '@crochet-hub/shared';
import { z } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await orderService.listBuyerOrders(
      req.user!.userId,
      req.query.status as string,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:orderNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrderByNumber(req.params.orderNumber, req.user!.userId);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:orderNumber/cancel',
  validate(cancelOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.cancelOrder(req.params.orderNumber, req.user!.userId, req.body.reason);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Ratings ──────────────────────────────────────
router.post(
  '/:orderNumber/items/:itemId/rating',
  validate(z.object({ score: z.number().int().min(1).max(5), review: z.string().max(1000).optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rating = await ratingService.submitRating(req.user!.userId, req.params.itemId, req.body);
      res.status(201).json(rating);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
