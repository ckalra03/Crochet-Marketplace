import { Router, Request, Response, NextFunction } from 'express';
import { sellerService } from '../modules/seller-onboarding/seller.service';
import { validate } from '../middleware/validate';
import { sellerRegisterSchema, updateSellerProfileSchema } from '@crochet-hub/shared';

const router = Router();

router.post(
  '/register',
  validate(sellerRegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await sellerService.register(req.user!.userId, req.body);
      res.status(201).json(profile);
    } catch (err) {
      next(err);
    }
  },
);

router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.put(
  '/profile',
  validate(updateSellerProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await sellerService.updateProfile(req.user!.userId, req.body);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
