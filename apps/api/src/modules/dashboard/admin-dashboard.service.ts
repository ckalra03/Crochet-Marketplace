import prisma from '../../config/database';

export class AdminDashboardService {
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      totalOrders,
      pendingSellerApprovals,
      pendingProductApprovals,
      openDisputes,
      pendingReturns,
      pendingPayouts,
      totalRevenue,
      activeProducts,
      activeSellers,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count(),
      prisma.sellerProfile.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { status: 'PENDING_APPROVAL', deletedAt: null } }),
      prisma.dispute.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      prisma.return.count({ where: { status: { in: ['REQUESTED', 'UNDER_REVIEW'] } } }),
      prisma.payout.count({ where: { status: { in: ['DRAFT', 'APPROVED'] } } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amountInCents: true },
      }),
      prisma.product.count({ where: { status: 'APPROVED', isActive: true, deletedAt: null } }),
      prisma.sellerProfile.count({ where: { status: 'APPROVED' } }),
    ]);

    return {
      ordersToday,
      totalOrders,
      pendingSellerApprovals,
      pendingProductApprovals,
      openDisputes,
      pendingReturns,
      pendingPayouts,
      totalRevenueInCents: totalRevenue._sum.amountInCents || 0,
      activeProducts,
      activeSellers,
    };
  }

  async getAuditLogs(filters: {
    action?: string;
    userId?: string;
    auditableType?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.action) where.action = { contains: filters.action };
    if (filters.userId) where.userId = filters.userId;
    if (filters.auditableType) where.auditableType = filters.auditableType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const adminDashboardService = new AdminDashboardService();
