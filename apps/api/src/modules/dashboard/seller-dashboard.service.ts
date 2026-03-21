import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';

export class SellerDashboardService {
  async getDashboardStats(sellerProfileId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
    });
    if (!profile) throw new AppError('Seller profile not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      ordersThisMonth,
      pendingOrders,
      totalRevenueResult,
      revenueThisMonthResult,
      avgRatingResult,
      totalRatings,
      activeProducts,
      pendingProducts,
      totalPayoutsResult,
      pendingPayouts,
      recentOrders,
    ] = await Promise.all([
      // Order counts
      prisma.orderItem.count({ where: { sellerProfileId } }),
      prisma.orderItem.count({
        where: { sellerProfileId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.orderItem.count({
        where: { sellerProfileId, status: { in: ['CONFIRMED', 'PROCESSING'] } },
      }),

      // Revenue
      prisma.orderItem.aggregate({
        where: { sellerProfileId, status: { in: ['DELIVERED', 'COMPLETED'] } },
        _sum: { totalPriceInCents: true },
      }),
      prisma.orderItem.aggregate({
        where: {
          sellerProfileId,
          status: { in: ['DELIVERED', 'COMPLETED'] },
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalPriceInCents: true },
      }),

      // Ratings
      prisma.rating.aggregate({
        where: { sellerProfileId, isVisible: true },
        _avg: { score: true },
      }),
      prisma.rating.count({ where: { sellerProfileId, isVisible: true } }),

      // Products
      prisma.product.count({
        where: { sellerProfileId, status: 'APPROVED', isActive: true, deletedAt: null },
      }),
      prisma.product.count({
        where: { sellerProfileId, status: 'PENDING_APPROVAL', deletedAt: null },
      }),

      // Payouts
      prisma.payout.aggregate({
        where: { sellerProfileId, status: 'PAID' },
        _sum: { netPayoutInCents: true },
      }),
      prisma.payout.count({
        where: { sellerProfileId, status: { in: ['DRAFT', 'APPROVED'] } },
      }),

      // Recent orders (last 5)
      prisma.orderItem.findMany({
        where: { sellerProfileId },
        include: {
          order: { select: { orderNumber: true, placedAt: true, status: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      overview: {
        totalOrders,
        ordersThisMonth,
        pendingOrders,
        totalRevenueInCents: totalRevenueResult._sum.totalPriceInCents || 0,
        revenueThisMonthInCents: revenueThisMonthResult._sum.totalPriceInCents || 0,
        avgRating: avgRatingResult._avg.score || 0,
        totalRatings,
        activeProducts,
        pendingProducts,
        totalPayoutsPaidInCents: totalPayoutsResult._sum.netPayoutInCents || 0,
        pendingPayouts,
      },
      recentOrders,
      commissionRate: profile.commissionRate,
    };
  }
}

export const sellerDashboardService = new SellerDashboardService();
