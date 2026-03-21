import { Router, Request, Response, NextFunction } from 'express';
import { sellerService } from '../modules/seller-onboarding/seller.service';
import { productService } from '../modules/products/product.service';
import { orderService } from '../modules/orders/order.service';
import { fulfillmentService } from '../modules/fulfillment/fulfillment.service';
import { onDemandService } from '../modules/on-demand/on-demand.service';
import { returnService } from '../modules/returns/return.service';
import { disputeService } from '../modules/disputes/dispute.service';
import { reviewReturnSchema } from '@crochet-hub/shared';
import { validate } from '../middleware/validate';
import { rejectSellerSchema } from '@crochet-hub/shared';
import { z } from 'zod';

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

// ─── Product Approval ──────────────────────────────
router.get('/products/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productService.listPendingProducts(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.approveProduct(req.params.id, req.user!.userId);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/products/:id/reject',
  validate(z.object({ reason: z.string().min(5).max(500) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.rejectProduct(req.params.id, req.user!.userId, req.body.reason);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Order Management ──────────────────────────────
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await orderService.listAllOrders({
      status: req.query.status as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:orderNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrderByNumber(req.params.orderNumber);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/orders/:orderNumber/update-status',
  validate(z.object({ status: z.string(), notes: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.orderNumber,
        req.user!.userId,
        req.body.status,
        req.body.notes,
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
);

// ─── On-Demand Requests ────────────────────────────
router.get('/on-demand-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await onDemandService.listAllRequests(req.query.status as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/on-demand-requests/:id/quote',
  validate(z.object({
    priceInCents: z.number().int().positive(),
    estimatedDays: z.number().int().positive(),
    description: z.string().optional(),
    validityHours: z.number().int().positive().default(72),
    sellerProfileId: z.string().uuid().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quote = await onDemandService.createQuote(req.params.id, req.user!.userId, req.body);
      res.status(201).json(quote);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Warehouse / Fulfillment ───────────────────────
router.get('/warehouse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await fulfillmentService.listWarehouseItems(
      req.query.status as string,
      Number(req.query.page) || 1,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/warehouse/:id/receive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await fulfillmentService.receiveItem(req.params.id, req.user!.userId);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/warehouse/:id/qc',
  validate(z.object({
    result: z.enum(['PASS', 'FAIL']),
    checklist: z.record(z.boolean()),
    defectNotes: z.string().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await fulfillmentService.submitQc(req.params.id, req.user!.userId, req.body);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/warehouse/:id/dispatch',
  validate(z.object({ trackingNumber: z.string().min(1), shippingCarrier: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await fulfillmentService.dispatchItem(req.params.id, req.user!.userId, req.body);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Returns ──────────────────────────────────────
router.get('/returns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await returnService.listAllReturns(req.query.status as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/returns/:id/review', validate(reviewReturnSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ret = await returnService.reviewReturn(req.params.id, req.user!.userId, req.body);
    res.json(ret);
  } catch (err) {
    next(err);
  }
});

// ─── Disputes ─────────────────────────────────────
router.get('/disputes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await disputeService.listAllDisputes(req.query.status as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/disputes/:id/resolve',
  validate(z.object({ resolutionSummary: z.string().min(5) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dispute = await disputeService.resolveDispute(req.params.id, req.user!.userId, req.body);
      res.json(dispute);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
