import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('ratings');

export class RatingService {
  async submitRating(userId: string, orderItemId: string, data: { score: number; review?: string }) {
    if (data.score < 1 || data.score > 5) throw new AppError('Score must be 1-5', 400);

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true },
    });
    if (!orderItem) throw new AppError('Order item not found', 404);
    if (orderItem.order.userId !== userId) throw new AppError('Not your order', 403);
    if (orderItem.order.status !== 'DELIVERED' && orderItem.order.status !== 'COMPLETED') {
      throw new AppError('Can only rate delivered orders', 400);
    }
    if (!orderItem.sellerProfileId) throw new AppError('No seller to rate', 400);

    const existing = await prisma.rating.findFirst({
      where: { orderItemId, userId },
    });
    if (existing) throw new AppError('Already rated this item', 409);

    const rating = await prisma.rating.create({
      data: {
        orderItemId,
        userId,
        sellerProfileId: orderItem.sellerProfileId,
        productId: orderItem.productId,
        score: data.score,
        review: data.review,
      },
    });

    log.info(`Rating submitted: ${data.score}/5`, { userId, orderItemId });
    return rating;
  }

  async getProductRatings(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [ratings, total, avg] = await Promise.all([
      prisma.rating.findMany({
        where: { productId, isVisible: true },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rating.count({ where: { productId, isVisible: true } }),
      prisma.rating.aggregate({
        where: { productId, isVisible: true },
        _avg: { score: true },
      }),
    ]);
    return {
      ratings,
      avgScore: avg._avg.score || 0,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSellerRatings(sellerProfileId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [ratings, total, avg] = await Promise.all([
      prisma.rating.findMany({
        where: { sellerProfileId, isVisible: true },
        include: {
          user: { select: { name: true } },
          product: { select: { name: true } },
          orderItem: { select: { order: { select: { orderNumber: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rating.count({ where: { sellerProfileId, isVisible: true } }),
      prisma.rating.aggregate({
        where: { sellerProfileId, isVisible: true },
        _avg: { score: true },
      }),
    ]);
    return {
      ratings,
      avgScore: avg._avg.score || 0,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const ratingService = new RatingService();
