import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('coupon');

/**
 * CouponService -- Handles coupon CRUD, validation, and application.
 * Supports PERCENTAGE and FIXED discount types with optional caps and minimums.
 */
export class CouponService {
  /** Create a new coupon (admin only). */
  async createCoupon(data: {
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderCents?: number;
    maxDiscountCents?: number;
    maxUses?: number;
    expiresAt?: string;
  }) {
    // Normalize code to uppercase for consistency
    const code = data.code.trim().toUpperCase();

    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new AppError('Coupon code already exists', 409);

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: data.type,
        value: data.value,
        minOrderCents: data.minOrderCents ?? null,
        maxDiscountCents: data.maxDiscountCents ?? null,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    log.info(`Coupon created: ${code}`, { couponId: coupon.id });
    return coupon;
  }

  /** List coupons with optional pagination. */
  async getCoupons(params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.coupon.count(),
    ]);

    return { coupons, total, page, limit };
  }

  /** Update a coupon by ID (admin only). */
  async updateCoupon(id: string, data: {
    code?: string;
    type?: 'PERCENTAGE' | 'FIXED';
    value?: number;
    minOrderCents?: number | null;
    maxDiscountCents?: number | null;
    maxUses?: number | null;
    isActive?: boolean;
    expiresAt?: string | null;
  }) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new AppError('Coupon not found', 404);

    // If code is changing, check for duplicates
    if (data.code && data.code.toUpperCase() !== coupon.code) {
      const existing = await prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (existing) throw new AppError('Coupon code already exists', 409);
    }

    return prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code.toUpperCase() }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.minOrderCents !== undefined && { minOrderCents: data.minOrderCents }),
        ...(data.maxDiscountCents !== undefined && { maxDiscountCents: data.maxDiscountCents }),
        ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
      },
    });
  }

  /** Deactivate a coupon (soft delete). */
  async deactivateCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new AppError('Coupon not found', 404);

    return prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Validate a coupon code against an order total.
   * Returns the coupon if valid, throws if invalid.
   */
  async validateCoupon(code: string, orderTotalCents: number) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon) throw new AppError('Invalid coupon code', 404);
    if (!coupon.isActive) throw new AppError('This coupon is no longer active', 400);

    // Check expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new AppError('This coupon has expired', 400);
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new AppError('This coupon has reached its usage limit', 400);
    }

    // Check minimum order amount
    if (coupon.minOrderCents !== null && orderTotalCents < coupon.minOrderCents) {
      const minRupees = (coupon.minOrderCents / 100).toFixed(0);
      throw new AppError(`Minimum order amount is ₹${minRupees} for this coupon`, 400);
    }

    return coupon;
  }

  /**
   * Apply a coupon to an order total and return the discount amount in cents.
   * Does NOT increment usage -- that happens after successful checkout.
   */
  async applyCoupon(code: string, orderTotalCents: number) {
    const coupon = await this.validateCoupon(code, orderTotalCents);

    let discountCents: number;

    if (coupon.type === 'PERCENTAGE') {
      // Calculate percentage discount
      discountCents = Math.floor(orderTotalCents * (coupon.value / 100));
      // Apply max discount cap if set
      if (coupon.maxDiscountCents !== null && discountCents > coupon.maxDiscountCents) {
        discountCents = coupon.maxDiscountCents;
      }
    } else {
      // FIXED discount -- discount is the value in cents, capped at order total
      discountCents = Math.min(coupon.value, orderTotalCents);
    }

    log.info(`Coupon ${code} applied: ${discountCents} cents discount`, {
      couponId: coupon.id,
      orderTotalCents,
    });

    return {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      discountCents,
    };
  }

  /** Increment the usage count after a successful order. */
  async incrementUsage(couponId: string) {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }
}

export const couponService = new CouponService();
