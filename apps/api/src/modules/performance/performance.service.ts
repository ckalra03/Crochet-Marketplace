import prisma from '../../config/database';

/**
 * Seller performance metrics service.
 *
 * Calculates and upserts performance metrics for sellers:
 * - avgRating (x100, e.g. 450 = 4.50 stars)
 * - totalOrders
 * - qcPassRate (basis points, e.g. 9500 = 95.00%)
 * - onTimeDeliveryRate (basis points)
 * - returnRate (basis points)
 * - disputeRate (basis points)
 * - violationsCount
 */

export interface PerformanceListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// ─── Calculate and upsert metrics ───────────────────

async function calculateMetrics(sellerProfileId: string) {
  // Total orders for this seller
  const totalOrders = await (prisma as any).orderItem.count({
    where: { sellerProfileId },
  });

  // Average rating (from ratings table)
  const ratingAgg = await (prisma as any).rating.aggregate({
    where: { sellerProfileId },
    _avg: { score: true },
  });
  // Store as x100 integer (e.g. 4.5 -> 450)
  const avgRating = ratingAgg._avg.score
    ? Math.round(ratingAgg._avg.score * 100)
    : 0;

  // QC pass rate from fulfillment items
  const totalQc = await (prisma as any).fulfillmentItem.count({
    where: {
      orderItem: { sellerProfileId },
      qcResult: { not: null },
    },
  });
  const passedQc = await (prisma as any).fulfillmentItem.count({
    where: {
      orderItem: { sellerProfileId },
      qcResult: 'PASS',
    },
  });
  // Basis points: 9500 = 95.00%
  const qcPassRate = totalQc > 0 ? Math.round((passedQc / totalQc) * 10000) : 0;

  // On-time delivery rate from SLA records
  const totalDeliverySla = await (prisma as any).slaRecord.count({
    where: { sellerProfileId, slaType: 'DELIVERY' },
  });
  const onTimeDeliveries = await (prisma as any).slaRecord.count({
    where: { sellerProfileId, slaType: 'DELIVERY', isBreached: false },
  });
  const onTimeDeliveryRate = totalDeliverySla > 0
    ? Math.round((onTimeDeliveries / totalDeliverySla) * 10000)
    : 0;

  // Return rate
  const totalReturns = await (prisma as any).returnRequest.count({
    where: {
      orderItem: { sellerProfileId },
    },
  });
  const returnRate = totalOrders > 0
    ? Math.round((totalReturns / totalOrders) * 10000)
    : 0;

  // Dispute rate
  const totalDisputes = await (prisma as any).dispute.count({
    where: {
      order: {
        items: { some: { sellerProfileId } },
      },
    },
  });
  const disputeRate = totalOrders > 0
    ? Math.round((totalDisputes / totalOrders) * 10000)
    : 0;

  // Violations count (penalty count)
  const violationsCount = await (prisma as any).sellerPenalty.count({
    where: { sellerProfileId, status: { not: 'WAIVED' } },
  });

  // Upsert the metrics row
  const metrics = await (prisma as any).sellerPerformanceMetrics.upsert({
    where: { sellerProfileId },
    create: {
      sellerProfileId,
      avgRating,
      totalOrders,
      qcPassRate,
      onTimeDeliveryRate,
      returnRate,
      disputeRate,
      violationsCount,
      lastCalculatedAt: new Date(),
    },
    update: {
      avgRating,
      totalOrders,
      qcPassRate,
      onTimeDeliveryRate,
      returnRate,
      disputeRate,
      violationsCount,
      lastCalculatedAt: new Date(),
    },
  });

  return metrics;
}

// ─── Get cached metrics for one seller ──────────────

async function getPerformanceMetrics(sellerProfileId: string) {
  let metrics = await (prisma as any).sellerPerformanceMetrics.findUnique({
    where: { sellerProfileId },
  });

  // If not yet calculated, compute now
  if (!metrics) {
    metrics = await calculateMetrics(sellerProfileId);
  }

  return metrics;
}

// ─── All sellers ranked by performance ──────────────

async function getAllSellerPerformance(params?: PerformanceListParams) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;
  const sortBy = params?.sortBy || 'avgRating';
  const order = params?.order || 'desc';

  const [data, total] = await Promise.all([
    (prisma as any).sellerPerformanceMetrics.findMany({
      include: {
        sellerProfile: {
          select: { id: true, businessName: true, status: true },
        },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    }),
    (prisma as any).sellerPerformanceMetrics.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export const performanceService = {
  calculateMetrics,
  getPerformanceMetrics,
  getAllSellerPerformance,
};
