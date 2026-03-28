import { Router, Request, Response, NextFunction } from 'express';
import { sellerService } from '../modules/seller-onboarding/seller.service';
import { productService } from '../modules/products/product.service';
import { orderService } from '../modules/orders/order.service';
import { payoutService } from '../modules/seller-finance/payout.service';
import { ratingService } from '../modules/ratings/rating.service';
import { sellerDashboardService } from '../modules/dashboard/seller-dashboard.service';
import { performanceService } from '../modules/performance/performance.service';
import { penaltyService } from '../modules/penalties/penalty.service';
import { slaService } from '../modules/sla/sla.service';
import { validate } from '../middleware/validate';
import { sellerRegisterSchema, updateSellerProfileSchema, createProductSchema, updateProductSchema } from '@crochet-hub/shared';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

// Multer stores files temporarily — Cloudinary uploads from the temp path
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

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

// ─── Dashboard ────────────────────────────────────
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const stats = await sellerDashboardService.getDashboardStats(profile.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// ─── Ratings ───────────────────────────────────────
router.get('/ratings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const result = await ratingService.getSellerRatings(profile.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Payouts ───────────────────────────────────────
router.get('/payouts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const result = await payoutService.listSellerPayouts(profile.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/payouts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const payout = await payoutService.getPayoutDetail(req.params.id, profile.id);
    res.json(payout);
  } catch (err) {
    next(err);
  }
});

// ─── Order Allocations ─────────────────────────────
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const result = await orderService.listSellerOrders(
      profile.id,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Product Management ────────────────────────────
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const result = await productService.listSellerProducts(
      profile.id,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/products',
  validate(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await sellerService.getProfile(req.user!.userId);
      const product = await productService.createProduct(profile.id, req.body);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/products/:id',
  validate(updateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await sellerService.getProfile(req.user!.userId);
      const product = await productService.updateProduct(req.params.id, profile.id, req.body);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    await productService.deleteProduct(req.params.id, profile.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const product = await productService.submitForApproval(req.params.id, profile.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/media', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const profile = await sellerService.getProfile(req.user!.userId);
    const type = req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';

    // Upload to Cloudinary (falls back to local path if not configured)
    const resourceType = type === 'VIDEO' ? 'video' as const : 'image' as const;
    const { url } = await uploadToCloudinary(req.file.path, {
      folder: `crochet-hub/products/${req.params.id}`,
      resourceType,
    });

    // Save Cloudinary URL (or local path) to database
    const media = await productService.addMedia(req.params.id, profile.id, url, type as any);

    // Clean up temp file after upload
    fs.unlink(req.file.path, () => {});

    res.status(201).json(media);
  } catch (err) {
    // Clean up temp file on error too
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

router.delete('/products/:id/media/:mediaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    await productService.removeMedia(req.params.id, req.params.mediaId, profile.id);
    res.json({ message: 'Media removed' });
  } catch (err) {
    next(err);
  }
});

// ─── Performance Metrics ──────────────────────────────

router.get('/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const metrics = await performanceService.getPerformanceMetrics(profile.id);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

// ─── Seller Penalties ─────────────────────────────────

router.get('/penalties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const result = await penaltyService.getSellerPenalties(profile.id, {
      status: req.query.status as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Seller SLA Breaches ──────────────────────────────

router.get('/sla/breaches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await sellerService.getProfile(req.user!.userId);
    const result = await slaService.getSlaBreaches({
      sellerProfileId: profile.id,
      slaType: req.query.slaType as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
