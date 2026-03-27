import { Router, Request, Response, NextFunction } from 'express';
import { wishlistService } from '../modules/wishlist/wishlist.service';

const router = Router();

/** GET /api/v1/wishlist -- list the current user's wishlist (paginated). */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 12;
    const result = await wishlistService.getWishlist(req.user!.userId, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/wishlist/ids -- get all wishlisted product IDs for quick lookup. */
router.get('/ids', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = await wishlistService.getWishlistProductIds(req.user!.userId);
    res.json({ productIds: ids });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/wishlist/:productId -- add a product to wishlist. */
router.post('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await wishlistService.addToWishlist(req.user!.userId, req.params.productId);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/v1/wishlist/:productId -- remove a product from wishlist. */
router.delete('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await wishlistService.removeFromWishlist(req.user!.userId, req.params.productId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
