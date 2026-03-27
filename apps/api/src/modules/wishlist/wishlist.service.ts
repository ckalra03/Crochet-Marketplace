import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';

/**
 * WishlistService handles all wishlist operations for buyers.
 * Each user can wishlist a product once (unique constraint on userId + productId).
 */
export class WishlistService {
  /** Get paginated wishlist with product details for a user. */
  async getWishlist(userId: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              media: { take: 1, orderBy: { sortOrder: 'asc' } },
              sellerProfile: { select: { id: true, businessName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.wishlist.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Add a product to the user's wishlist. Idempotent -- returns existing if already wishlisted. */
  async addToWishlist(userId: string, productId: string) {
    // Verify product exists and is available
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'APPROVED', isActive: true, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found or not available', 404);

    // Upsert: if already wishlisted, just return the existing record
    const existing = await prisma.wishlist.findUnique({
      where: { uq_wishlist_user_product: { userId, productId } },
    });
    if (existing) return existing;

    return prisma.wishlist.create({
      data: { userId, productId },
    });
  }

  /** Remove a product from the user's wishlist. */
  async removeFromWishlist(userId: string, productId: string) {
    const existing = await prisma.wishlist.findUnique({
      where: { uq_wishlist_user_product: { userId, productId } },
    });
    if (!existing) throw new AppError('Product not in wishlist', 404);

    await prisma.wishlist.delete({
      where: { id: existing.id },
    });
  }

  /** Check if a product is in the user's wishlist. */
  async isWishlisted(userId: string, productId: string): Promise<boolean> {
    const item = await prisma.wishlist.findUnique({
      where: { uq_wishlist_user_product: { userId, productId } },
    });
    return !!item;
  }

  /** Get all product IDs in the user's wishlist (for quick lookup on product grids). */
  async getWishlistProductIds(userId: string): Promise<string[]> {
    const items = await prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
    });
    return items.map((item) => item.productId);
  }
}

export const wishlistService = new WishlistService();
