import { Router, Request, Response, NextFunction } from 'express';
import { sellerService } from '../modules/seller-onboarding/seller.service';
import { validate } from '../middleware/validate';
import { rejectSellerSchema } from '@crochet-hub/shared';

const router = Router();

// ─── Seller Management ─────────────────────────────
router.get('/sellers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sellerService.listSellers(
      req.query.status as string,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/sellers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seller = await sellerService.getSellerById(req.params.id);
    res.json(seller);
  } catch (err) {
    next(err);
  }
});

router.post('/sellers/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seller = await sellerService.approveSeller(req.params.id, req.user!.userId);
    res.json(seller);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/sellers/:id/reject',
  validate(rejectSellerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seller = await sellerService.rejectSeller(req.params.id, req.user!.userId, req.body.reason);
      res.json(seller);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/sellers/:id/suspend',
  validate(rejectSellerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const seller = await sellerService.suspendSeller(req.params.id, req.user!.userId, req.body.reason);
      res.json(seller);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
