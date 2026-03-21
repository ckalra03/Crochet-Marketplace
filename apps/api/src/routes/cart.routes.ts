import { Router, Request, Response, NextFunction } from 'express';
import { cartService } from '../modules/cart/cart.service';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await cartService.getCart(req.user!.userId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/items',
  validate(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).default(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await cartService.addItem(req.user!.userId, req.body.productId, req.body.quantity);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/items/:id',
  validate(z.object({ quantity: z.number().int().min(0) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await cartService.updateQuantity(req.user!.userId, req.params.id, req.body.quantity);
      res.json(item || { message: 'Item removed' });
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cartService.removeItem(req.user!.userId, req.params.id);
    res.json({ message: 'Item removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
