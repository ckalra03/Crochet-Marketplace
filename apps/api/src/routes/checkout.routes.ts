import { Router, Request, Response, NextFunction } from 'express';
import { checkoutService } from '../modules/checkout/checkout.service';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { checkoutSchema } from '@crochet-hub/shared';

const router = Router();

router.post(
  '/',
  authenticate,
  validate(checkoutSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await checkoutService.createOrder(req.user!.userId, {
        shippingAddressId: req.body.shippingAddressId,
        notes: req.body.notes,
        paymentMethod: req.body.paymentMethod || 'COD',
      });
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },
);

// Payment webhook (would be public in production)
router.post('/payment-callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production: verify webhook signature
    const { orderId, gatewayTransactionId, amountInCents, method } = req.body;
    const order = await checkoutService.confirmPayment(orderId, {
      gateway: 'RAZORPAY',
      gatewayTransactionId,
      amountInCents,
      method,
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
