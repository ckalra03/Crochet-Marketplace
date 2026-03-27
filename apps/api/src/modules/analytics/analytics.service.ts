import prisma from '../../config/database';

type Period = 'daily' | 'weekly' | 'monthly';

interface RevenueDataPoint {
  period: string;
  revenue: number;
  orderCount: number;
}

/**
 * Analytics service for admin revenue, order, seller, and category reports.
 * Uses Prisma aggregations and raw SQL for grouped time-series queries.
 */
export class AnalyticsService {
  /**
   * Aggregate order totals grouped by time period (day, week, or month).
   * Returns an array of { period, revenue, orderCount }.
   */
  async getRevenueAnalytics(
    period: Period,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueDataPoint[]> {
    // Use Prisma.raw for the date_trunc interval (not parameterized — it's an identifier)
    const { Prisma } = require('@prisma/client');
    const truncUnit = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const rows: any[] = await prisma.$queryRaw`
      SELECT
        date_trunc(${Prisma.raw(`'${truncUnit}'`)}, placed_at)::date AS period,
        COALESCE(SUM(total_in_cents), 0)::int     AS revenue,
        COUNT(*)::int                              AS "orderCount"
      FROM orders
      WHERE placed_at IS NOT NULL
        AND placed_at >= ${startDate}
        AND placed_at <= ${endDate}
        AND status NOT IN ('CANCELLED', 'FAILED')
      GROUP BY 1
      ORDER BY period ASC
    `;

    return rows.map((r) => ({
      period: r.period instanceof Date ? r.period.toISOString().split('T')[0] : String(r.period),
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount),
    }));
  }

  /**
   * Order volume, average order value, and status distribution
   * within the given date range.
   */
  async getOrderAnalytics(startDate: Date, endDate: Date) {
    const where = {
      placedAt: { gte: startDate, lte: endDate },
      status: { notIn: ['CANCELLED' as const, 'FAILED' as const] },
    };

    const [aggregate, statusCounts] = await Promise.all([
      prisma.order.aggregate({
        where,
        _count: true,
        _sum: { totalInCents: true },
        _avg: { totalInCents: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { placedAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),
    ]);

    return {
      totalOrders: aggregate._count,
      totalRevenueInCents: aggregate._sum.totalInCents || 0,
      averageOrderValueInCents: Math.round(aggregate._avg.totalInCents || 0),
      statusDistribution: statusCounts.map((s) => ({
        status: s.status,
        count: s._count,
      })),
    };
  }

  /**
   * Top sellers ranked by revenue, with order count and average rating.
   */
  async getSellerAnalytics(limit = 10) {
    const rows: any[] = await (prisma as any).$queryRaw`
      SELECT
        sp.id                                       AS "sellerProfileId",
        sp.business_name                            AS "businessName",
        COALESCE(SUM(oi.total_price_in_cents), 0)::int AS revenue,
        COUNT(DISTINCT oi.order_id)::int            AS "orderCount",
        COALESCE(
          (SELECT ROUND(AVG(r2.score))::int
           FROM ratings r2
           WHERE r2.seller_profile_id = sp.id), 0
        )                                           AS "avgRating"
      FROM seller_profiles sp
      LEFT JOIN order_items oi ON oi.seller_profile_id = sp.id
      WHERE sp.status = 'APPROVED'
      GROUP BY sp.id, sp.business_name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      sellerProfileId: r.sellerProfileId,
      businessName: r.businessName,
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount),
      avgRating: Number(r.avgRating),
    }));
  }

  /**
   * Top categories by revenue and order count.
   */
  async getCategoryAnalytics(limit = 10) {
    const rows: any[] = await (prisma as any).$queryRaw`
      SELECT
        c.id                                           AS "categoryId",
        c.name                                         AS "categoryName",
        COALESCE(SUM(oi.total_price_in_cents), 0)::int AS revenue,
        COUNT(DISTINCT oi.order_id)::int               AS "orderCount"
      FROM categories c
      LEFT JOIN products p  ON p.category_id = c.id AND p.deleted_at IS NULL
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount),
    }));
  }
}

export const analyticsService = new AnalyticsService();
