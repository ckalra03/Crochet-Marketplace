import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.service';
import { createModuleLogger } from '../../support/logger';
import { cartService } from '../cart/cart.service';

const log = createModuleLogger('auth');

export class AuthService {
  async register(data: { name: string; email: string; password: string; phone?: string }, sessionId?: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
      },
    });

    log.info(`User registered: ${user.email}`, { userId: user.id });
    const tokens = await this.generateTokens(user.id, user.role);

    // Merge guest cart into new user's cart if session ID provided
    if (sessionId) {
      await cartService.mergeGuestCart(sessionId, user.id);
    }

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(email: string, password: string, sessionId?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { sellerProfile: true },
    });
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    log.info(`User logged in: ${user.email}`, { userId: user.id });
    const tokens = await this.generateTokens(user.id, user.role, user.sellerProfile?.id);

    // Merge guest cart into user's cart if session ID provided
    if (sessionId) {
      await cartService.mergeGuestCart(sessionId, user.id);
    }

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token expired or revoked', 401);
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(stored.user.id, stored.user.role);
    return { user: this.sanitizeUser(stored.user), ...tokens };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sellerProfile: true },
    });
    if (!user) throw new AppError('User not found', 404);
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(user);
  }

  /**
   * Forgot password: generate a reset token, hash it, store with 1h expiry.
   * Always returns a generic success message to avoid leaking user existence.
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid leaking whether email exists
    if (!user || !user.isActive) {
      log.info(`Forgot password requested for unknown/inactive email: ${email}`);
      return { message: 'If an account exists with that email, you will receive a reset link.' };
    }

    // Generate a cryptographically random token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: expiry,
      },
    });

    // In development, log the plain token so devs can test without email
    if (process.env.NODE_ENV === 'development') {
      log.info(`[DEV] Password reset token for ${email}: ${plainToken}`);
    }

    log.info(`Password reset token generated for: ${email}`, { userId: user.id });
    return { message: 'If an account exists with that email, you will receive a reset link.' };
  }

  /**
   * Reset password: find user by hashed token (not expired), update password,
   * clear reset fields, and revoke all refresh tokens.
   */
  async resetPassword(token: string, newPassword: string) {
    // Hash the incoming token to match what we stored
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() }, // token must not be expired
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token fields in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      }),
      // Revoke all refresh tokens so user must re-login everywhere
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    log.info(`Password reset successful for: ${user.email}`, { userId: user.id });
    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  private async generateTokens(userId: string, role: string, sellerProfileId?: string) {
    const tokenId = uuidv4();
    const accessToken = signAccessToken({ userId, role, sellerProfileId });
    const refreshTokenStr = signRefreshToken({ userId, tokenId });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        token: refreshTokenStr,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken: refreshTokenStr };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, deletedAt, ...safe } = user;
    return safe;
  }
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const authService = new AuthService();
