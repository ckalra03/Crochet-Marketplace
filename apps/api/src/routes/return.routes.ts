import { Router, Request, Response, NextFunction } from 'express';
import { returnService } from '../modules/returns/return.service';
import { validate } from '../middleware/validate';
import { createReturnSchema } from '@crochet-hub/shared';

const router = Router();

router.post('/', validate(createReturnSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ret = await returnService.submitReturn(req.user!.userId, req.body);
    res.status(201).json(ret);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await returnService.listBuyerReturns(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:returnNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ret = await returnService.getReturnDetail(req.params.returnNumber, req.user!.userId);
    res.json(ret);
  } catch (err) {
    next(err);
  }
});

export default router;
