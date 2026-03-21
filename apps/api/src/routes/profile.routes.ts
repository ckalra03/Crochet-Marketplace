import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import prisma from '../config/database';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put(
  '/',
  validate(z.object({ name: z.string().min(2).max(150).optional(), phone: z.string().max(20).optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

// Addresses
router.get('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).default('IN'),
  isDefault: z.boolean().default(false),
});

router.post(
  '/addresses',
  validate(addressSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user!.userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      const address = await prisma.address.create({
        data: { userId: req.user!.userId, ...req.body },
      });
      res.status(201).json(address);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/addresses/:id',
  validate(addressSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = await prisma.address.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!address) return res.status(404).json({ error: 'Address not found' });

      if (req.body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user!.userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      const updated = await prisma.address.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!address) return res.status(404).json({ error: 'Address not found' });

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
