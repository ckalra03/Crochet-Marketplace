import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('cart');

/**
 * Identifies a cart owner — either an authenticated user or a guest session.
 * Exactly one must be provided.
 */
export type CartIdentifier =
  | { userId: string; sessionId?: undefined }
  | { sessionId: string; userId?: undefined };

/**
 * Build a Prisma where clause fragment from a CartIdentifier.
 */
function identifierWhere(id: CartIdentifier) {
  return id.userId ? { userId: id.userId } : { sessionId: id.sessionId };
}

export class CartService {
  /**
   * Get all items in a cart (for a user or guest session).
   * Returns items with product details, total in cents, and item count.
   */
  async getCart(id: CartIdentifier) {
    const items = await prisma.cartItem.findMany({
      where: identifierWhere(id),
      include: {
        product: {
          include: {
            media: { take: 1, orderBy: { sortOrder: 'asc' } },
            sellerProfile: { select: { id: true, businessName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalInCents = items.reduce(
      (sum, item) => sum + (item.product.priceInCents || 0) * item.quantity,
      0,
    );

    return { items, totalInCents, itemCount: items.length };
  }

  /**
   * Add a product to the cart (or increment quantity if already in cart).
   * Validates product availability and stock for READY_STOCK items.
   */
  async addItem(id: CartIdentifier, productId: string, quantity: number) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'APPROVED', isActive: true, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found or not available', 404);

    if (product.productType === 'READY_STOCK' && product.stockQuantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    // Check if product is already in this cart
    const existing = await prisma.cartItem.findFirst({
      where: { ...identifierWhere(id), productId },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.productType === 'READY_STOCK' && product.stockQuantity < newQty) {
        throw new AppError('Insufficient stock', 400);
      }
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { product: true },
      });
    }

    return prisma.cartItem.create({
      data: { ...identifierWhere(id), productId, quantity },
      include: { product: true },
    });
  }

  /**
   * Update the quantity of a cart item. Removes the item if quantity is 0 or less.
   */
  async updateQuantity(id: CartIdentifier, cartItemId: string, quantity: number) {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, ...identifierWhere(id) },
      include: { product: true },
    });
    if (!item) throw new AppError('Cart item not found', 404);

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
      return null;
    }

    if (item.product.productType === 'READY_STOCK' && item.product.stockQuantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true },
    });
  }

  /**
   * Remove a single item from the cart.
   */
  async removeItem(id: CartIdentifier, cartItemId: string) {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, ...identifierWhere(id) },
    });
    if (!item) throw new AppError('Cart item not found', 404);
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  /**
   * Clear all items from a cart.
   */
  async clearCart(id: CartIdentifier) {
    await prisma.cartItem.deleteMany({ where: identifierWhere(id) });
  }

  /**
   * Merge a guest cart (by sessionId) into a user's cart (by userId).
   * Called on login/register to transfer guest items to the authenticated user.
   *
   * For duplicate products: sums quantities (capped at stock for READY_STOCK).
   * For unique products: moves them from session to user.
   * Wrapped in a transaction for atomicity.
   */
  async mergeGuestCart(sessionId: string, userId: string) {
    const guestItems = await prisma.cartItem.findMany({
      where: { sessionId },
      include: { product: true },
    });

    if (guestItems.length === 0) return;

    log.info(`Merging ${guestItems.length} guest cart items into user ${userId}`);

    await prisma.$transaction(async (tx) => {
      for (const guestItem of guestItems) {
        // Check if user already has this product in their cart
        const userItem = await tx.cartItem.findFirst({
          where: { userId, productId: guestItem.productId },
        });

        if (userItem) {
          // Duplicate: sum quantities, cap at stock for READY_STOCK
          let mergedQty = userItem.quantity + guestItem.quantity;
          if (
            guestItem.product.productType === 'READY_STOCK' &&
            mergedQty > guestItem.product.stockQuantity
          ) {
            mergedQty = guestItem.product.stockQuantity;
          }

          await tx.cartItem.update({
            where: { id: userItem.id },
            data: { quantity: mergedQty },
          });

          // Delete the guest row
          await tx.cartItem.delete({ where: { id: guestItem.id } });
        } else {
          // No duplicate: move guest item to user
          await tx.cartItem.update({
            where: { id: guestItem.id },
            data: { userId, sessionId: null },
          });
        }
      }
    });

    log.info(`Guest cart merge complete for user ${userId}`);
  }
}

export const cartService = new CartService();
