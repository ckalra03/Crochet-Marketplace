import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../modules/orders/order.service';
import { validate } from '../middleware/validate';
import { cancelOrderSchema } from '@crochet-hub/shared';

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

export default router;
