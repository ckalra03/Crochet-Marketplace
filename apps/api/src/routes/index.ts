import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import catalogRoutes from './catalog.routes';
import cartRoutes from './cart.routes';
import checkoutRoutes from './checkout.routes';
import orderRoutes from './order.routes';
import onDemandRoutes from './on-demand.routes';
import returnRoutes from './return.routes';
import sellerRoutes from './seller.routes';
import adminRoutes from './admin.routes';
import wishlistRoutes from './wishlist.routes';
import notificationRoutes from './notification.routes';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
// Cart uses optionalAuth — guests can add/view cart via X-Session-ID header
router.use('/cart', optionalAuth, cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/on-demand', authenticate, onDemandRoutes);
router.use('/returns', authenticate, returnRoutes);
router.use('/profile', authenticate, profileRoutes);
router.use('/seller', authenticate, sellerRoutes);
router.use('/wishlist', authenticate, wishlistRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/admin', authenticate, requireRole('ADMIN'), adminRoutes);

export default router;
