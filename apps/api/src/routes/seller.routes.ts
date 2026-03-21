import { Router, Request, Response, NextFunction } from 'express';
import { sellerService } from '../modules/seller-onboarding/seller.service';
import { productService } from '../modules/products/product.service';
import { validate } from '../middleware/validate';
import { sellerRegisterSchema, updateSellerProfileSchema, createProductSchema, updateProductSchema } from '@crochet-hub/shared';
import multer from 'multer';
import path from 'path';

const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
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
    const media = await productService.addMedia(req.params.id, profile.id, req.file.path, type as any);
    res.status(201).json(media);
  } catch (err) {
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

export default router;
