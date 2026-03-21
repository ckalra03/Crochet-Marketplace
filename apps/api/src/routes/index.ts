import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import catalogRoutes from './catalog.routes';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/profile', authenticate, profileRoutes);

export default router;
