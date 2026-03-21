import { Router, Request, Response, NextFunction } from 'express';
import { onDemandService } from '../modules/on-demand/on-demand.service';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.post(
  '/',
  validate(z.object({
    description: z.string().min(10),
    categoryId: z.string().uuid().optional(),
    budgetMinCents: z.number().int().min(0).optional(),
    budgetMaxCents: z.number().int().min(0).optional(),
    expectedBy: z.string().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await onDemandService.submitRequest(req.user!.userId, req.body);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  },
);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await onDemandService.listBuyerRequests(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await onDemandService.getRequestDetail(req.params.id, req.user!.userId);
    res.json(request);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/quotes/:quoteId/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await onDemandService.acceptQuote(req.params.quoteId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/quotes/:quoteId/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await onDemandService.rejectQuote(req.params.quoteId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
