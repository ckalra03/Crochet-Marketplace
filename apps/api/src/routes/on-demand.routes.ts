import { Router, Request, Response, NextFunction } from 'express';
import { onDemandService } from '../modules/on-demand/on-demand.service';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary } from '../config/cloudinary';

const router = Router();

// Multer config for reference image uploads (temp directory, 5MB limit, images only)
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /on-demand
 * Submit a new custom crochet request.
 * Accepts referenceImages as a JSON array of Cloudinary URLs (uploaded separately).
 */
router.post(
  '/',
  validate(z.object({
    description: z.string().min(10),
    categoryId: z.string().uuid().optional(),
    budgetMinCents: z.number().int().min(0).optional(),
    budgetMaxCents: z.number().int().min(0).optional(),
    expectedBy: z.string().optional(),
    referenceImages: z.array(z.string().url()).max(5).optional(),
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

/**
 * POST /on-demand/upload-image
 * Upload a reference image for a custom order.
 * Returns the Cloudinary URL. The frontend collects URLs and sends them
 * in the referenceImages array when submitting the request.
 * Max 5MB per image.
 */
router.post(
  '/upload-image',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }

      // Upload to Cloudinary (falls back to local path if not configured)
      const { url } = await uploadToCloudinary(req.file.path, {
        folder: 'crochet-hub/on-demand-references',
      });

      // Clean up temp file after upload
      fs.unlink(req.file.path, () => {});

      res.status(201).json({ url });
    } catch (err) {
      // Clean up temp file on error
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
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
