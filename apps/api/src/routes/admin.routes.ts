import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { sellerService } from '../modules/seller-onboarding/seller.service';
import { productService } from '../modules/products/product.service';
import { orderService } from '../modules/orders/order.service';
import { fulfillmentService } from '../modules/fulfillment/fulfillment.service';
import { onDemandService } from '../modules/on-demand/on-demand.service';
import { returnService } from '../modules/returns/return.service';
import { disputeService } from '../modules/disputes/dispute.service';
import { payoutService } from '../modules/seller-finance/payout.service';
import { adminDashboardService } from '../modules/dashboard/admin-dashboard.service';
import { analyticsService } from '../modules/analytics/analytics.service';
import { settingsService } from '../modules/settings/settings.service';
import { slaService } from '../modules/sla/sla.service';
import { penaltyService } from '../modules/penalties/penalty.service';
import { performanceService } from '../modules/performance/performance.service';
import { couponService } from '../modules/coupons/coupon.service';
import { getPayoutQueue } from '../jobs';
import { reviewReturnSchema } from '@crochet-hub/shared';
import { validate } from '../middleware/validate';
import { rejectSellerSchema } from '@crochet-hub/shared';
import { z } from 'zod';

const router = Router();

// ─── Dashboard ─────────────────────────────────────
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminDashboardService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminDashboardService.getAuditLogs({
      action: req.query.action as string,
      userId: req.query.userId as string,
      auditableType: req.query.auditableType as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

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

// Create a new seller directly (admin bypass)
router.post(
  '/sellers/create',
  validate(z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    businessName: z.string().min(1).max(200),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, businessName } = req.body;

      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      // Create user + seller profile in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: 'SELLER',
            emailVerifiedAt: new Date(),
          },
        });

        const sellerProfile = await tx.sellerProfile.create({
          data: {
            userId: user.id,
            businessName,
            status: 'APPROVED',
            approvedBy: req.user!.userId,
            approvedAt: new Date(),
            commissionRate: 1500, // 15% default
          },
        });

        return { user: { id: user.id, name: user.name, email: user.email }, sellerProfile };
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Product Approval ──────────────────────────────

// List all products with optional status filter (admin view)
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productService.listAllProducts(
      req.query.status as string | undefined,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

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

// Fetch a single product by ID (admin view)
router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
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

// Fetch a single on-demand request by ID with quotes and user details
router.get('/on-demand-requests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await onDemandService.getRequestDetail(req.params.id);
    res.json(request);
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

// Assign a seller to an on-demand request
router.post(
  '/on-demand-requests/:id/assign-seller',
  validate(z.object({
    sellerProfileId: z.string().uuid(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await onDemandService.assignSeller(req.params.id, req.body.sellerProfileId, req.user!.userId);
      res.json(result);
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

// Initiate refund for an approved return
router.post(
  '/returns/:id/initiate-refund',
  validate(z.object({
    refundReference: z.string().min(1),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await returnService.initiateRefund(req.params.id, req.body.refundReference, req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

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

// ─── Payouts ──────────────────────────────────────
router.get('/payouts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await payoutService.listPayouts({
      status: req.query.status as string,
      page: Number(req.query.page) || 1,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/payouts/generate',
  validate(z.object({ cycleStart: z.string(), cycleEnd: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await payoutService.generatePayoutCycle(req.user!.userId, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post('/payouts/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payout = await payoutService.approvePayout(req.params.id, req.user!.userId);
    res.json(payout);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/payouts/:id/mark-paid',
  validate(z.object({ paymentReference: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payout = await payoutService.markPaid(req.params.id, req.user!.userId, req.body.paymentReference);
      res.json(payout);
    } catch (err) {
      next(err);
    }
  },
);

// Trigger payout generation as a background job (BullMQ).
// Falls back to synchronous execution when Redis/job queues are unavailable.
router.post(
  '/payouts/generate-cycle',
  validate(z.object({ cycleStart: z.string(), cycleEnd: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queue = getPayoutQueue();

      if (queue) {
        // Enqueue as a background job
        const job = await queue.add('payout-cycle', {
          cycleStart: req.body.cycleStart,
          cycleEnd: req.body.cycleEnd,
          adminId: req.user!.userId,
        });
        res.status(202).json({
          message: 'Payout generation job enqueued',
          jobId: job.id,
          cycleStart: req.body.cycleStart,
          cycleEnd: req.body.cycleEnd,
        });
      } else {
        // Fallback: run synchronously when job queues are unavailable
        const result = await payoutService.generatePayoutCycle(req.user!.userId, req.body);
        res.status(201).json(result);
      }
    } catch (err) {
      next(err);
    }
  },
);

// ─── Analytics ──────────────────────────────────────

router.get('/analytics/revenue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const data = await analyticsService.getRevenueAnalytics(period, startDate, endDate);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const data = await analyticsService.getOrderAnalytics(startDate, endDate);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/sellers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await analyticsService.getSellerAnalytics(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await analyticsService.getCategoryAnalytics(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Platform Settings ──────────────────────────────

router.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put(
  '/settings',
  validate(z.object({ key: z.string().min(1).max(100), value: z.any() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await settingsService.updateSetting(req.body.key, req.body.value);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── SLA Monitoring ─────────────────────────────────

router.get('/sla/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await slaService.getSlaDashboard();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
});

router.get('/sla/breaches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await slaService.getSlaBreaches({
      slaType: req.query.slaType as string,
      sellerProfileId: req.query.sellerProfileId as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Penalties ──────────────────────────────────────

router.get('/penalties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await penaltyService.getPenalties({
      status: req.query.status as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/penalties',
  validate(z.object({
    sellerProfileId: z.string().uuid(),
    type: z.enum(['QC_FAILURE', 'SLA_BREACH', 'RETURN_LIABILITY', 'OTHER']),
    amountInCents: z.number().int().positive(),
    reason: z.string().min(3).max(1000),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const penalty = await penaltyService.createPenalty(req.body, req.user!.userId);
      res.status(201).json(penalty);
    } catch (err) {
      next(err);
    }
  },
);

router.post('/penalties/:id/waive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const penalty = await penaltyService.waivePenalty(req.params.id, req.user!.userId);
    res.json(penalty);
  } catch (err) {
    next(err);
  }
});

// ─── Seller Performance ─────────────────────────────

router.get('/performance/sellers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await performanceService.getAllSellerPerformance({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sortBy: (req.query.sortBy as string) || 'avgRating',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Coupons ──────────────────────────────────────

// Create a new coupon
router.post(
  '/coupons',
  validate(z.object({
    code: z.string().min(2).max(50),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().int().positive(),
    minOrderCents: z.number().int().positive().optional(),
    maxDiscountCents: z.number().int().positive().optional(),
    maxUses: z.number().int().positive().optional(),
    expiresAt: z.string().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupon = await couponService.createCoupon(req.body);
      res.status(201).json(coupon);
    } catch (err) {
      next(err);
    }
  },
);

// List all coupons
router.get('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await couponService.getCoupons({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Update a coupon
router.put(
  '/coupons/:id',
  validate(z.object({
    code: z.string().min(2).max(50).optional(),
    type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    value: z.number().int().positive().optional(),
    minOrderCents: z.number().int().positive().nullable().optional(),
    maxDiscountCents: z.number().int().positive().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().nullable().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupon = await couponService.updateCoupon(req.params.id, req.body);
      res.json(coupon);
    } catch (err) {
      next(err);
    }
  },
);

// Deactivate (soft delete) a coupon
router.delete('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.deactivateCoupon(req.params.id);
    res.json(coupon);
  } catch (err) {
    next(err);
  }
});

export default router;
