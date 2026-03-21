import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';

export class CartService {
  async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
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

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'APPROVED', isActive: true, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found or not available', 404);

    if (product.productType === 'READY_STOCK' && product.stockQuantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    // Upsert cart item
    const existing = await prisma.cartItem.findFirst({
      where: { userId, productId },
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
      data: { userId, productId, quantity },
      include: { product: true },
    });
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
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

  async removeItem(userId: string, cartItemId: string) {
    const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, userId } });
    if (!item) throw new AppError('Cart item not found', 404);
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  async clearCart(userId: string) {
    await prisma.cartItem.deleteMany({ where: { userId } });
  }
}

export const cartService = new CartService();
