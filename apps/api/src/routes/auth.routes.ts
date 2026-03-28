import { Router, Request, Response, NextFunction } from 'express';
import { authService, AppError } from '../modules/auth/auth.service';
import { generateOTP, storeOTP, sendOTP, verifyOTP } from '../modules/auth/otp.service';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@crochet-hub/shared';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 20,
  message: { error: 'Too many attempts, please try again later' },
});

// Stricter rate limit for password reset endpoints: 3 requests per hour per IP
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 50 : 3,
  message: { error: 'Too many password reset attempts, please try again later' },
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pass guest session ID so cart can be merged into new user's cart
      const sessionId = req.headers['x-session-id'] as string | undefined;
      const result = await authService.register(req.body, sessionId);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pass guest session ID so cart can be merged into user's cart on login
      const sessionId = req.headers['x-session-id'] as string | undefined;
      const result = await authService.login(req.body.email, req.body.password, sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// Forgot password — always returns success to avoid leaking user existence
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// Reset password — validates token and sets new password
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── OTP-based guest authentication ───────────────────────────────

// Lenient rate limit for OTP: 20 requests per minute per IP
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'development' ? 1000 : 20,
  message: { error: 'Too many OTP attempts, please try again later' },
});

// Zod schemas for OTP endpoints
const sendOtpSchema = z.object({ emailOrPhone: z.string().min(1) });
const verifyOtpSchema = z.object({
  emailOrPhone: z.string().min(1),
  otp: z.string().length(6),
  sessionId: z.string().optional(),
});

/**
 * POST /auth/send-otp
 * Generate and "send" (log) an OTP for guest checkout / on-demand.
 */
router.post(
  '/send-otp',
  otpLimiter,
  validate(sendOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { emailOrPhone } = req.body;
      const otp = generateOTP();
      storeOTP(emailOrPhone, otp);
      sendOTP(emailOrPhone, otp);
      res.json({ message: 'OTP sent' });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /auth/verify-otp
 * Verify the OTP. If email is new, auto-create a user account.
 * If email exists, log the user in. Merges guest cart if sessionId provided.
 * Returns the same shape as /auth/login: { user, accessToken, refreshToken }
 */
router.post(
  '/verify-otp',
  otpLimiter,
  validate(verifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { emailOrPhone, otp, sessionId } = req.body;

      // Check OTP validity
      const valid = verifyOTP(emailOrPhone, otp);
      if (!valid) {
        throw new AppError('Invalid or expired OTP', 400);
      }

      // OTP is valid — auto-register or log in the user
      const result = await authService.loginOrRegisterByOTP(emailOrPhone, sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
