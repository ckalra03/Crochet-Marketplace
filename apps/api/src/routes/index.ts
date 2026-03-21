import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import catalogRoutes from './catalog.routes';
import cartRoutes from './cart.routes';
import checkoutRoutes from './checkout.routes';
import orderRoutes from './order.routes';
import sellerRoutes from './seller.routes';
import adminRoutes from './admin.routes';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/cart', authenticate, cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/profile', authenticate, profileRoutes);
router.use('/seller', authenticate, sellerRoutes);
router.use('/admin', authenticate, requireRole('ADMIN'), adminRoutes);

export default router;
