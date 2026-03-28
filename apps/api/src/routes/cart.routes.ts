import { Router, Request, Response, NextFunction } from 'express';
import { cartService, CartIdentifier } from '../modules/cart/cart.service';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

/**
 * Extract cart identifier from request.
 * Authenticated users are identified by userId (from JWT).
 * Guest users are identified by X-Session-ID header.
 */
function getCartId(req: Request): CartIdentifier {
  if (req.user?.userId) {
    return { userId: req.user.userId };
  }
  const sessionId = req.headers['x-session-id'] as string | undefined;
  if (!sessionId) {
    throw Object.assign(new Error('Authentication or session ID required'), { status: 401 });
  }
  return { sessionId };
}

// Get cart contents (works for both authenticated and guest users)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await cartService.getCart(getCartId(req));
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// Add item to cart
router.post(
  '/items',
  validate(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).default(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await cartService.addItem(getCartId(req), req.body.productId, req.body.quantity);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

// Update item quantity
router.put(
  '/items/:id',
  validate(z.object({ quantity: z.number().int().min(0) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await cartService.updateQuantity(getCartId(req), req.params.id, req.body.quantity);
      res.json(item || { message: 'Item removed' });
    } catch (err) {
      next(err);
    }
  },
);

// Remove item from cart
router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cartService.removeItem(getCartId(req), req.params.id);
    res.json({ message: 'Item removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
