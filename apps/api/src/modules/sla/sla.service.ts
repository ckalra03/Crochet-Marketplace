import prisma from '../../config/database';

/**
 * SLA monitoring service.
 *
 * Provides breach listing, dashboard summary, SLA record creation,
 * and auto-penalty generation when a seller exceeds 3 breaches in 30 days.
 */

export interface SlaBreachParams {
  slaType?: string;
  sellerProfileId?: string;
  page?: number;
  limit?: number;
}

export interface CreateSlaRecordData {
  slaType: 'QUOTE_RESPONSE' | 'DISPATCH' | 'DELIVERY' | 'DISPUTE_RESOLUTION';
  referenceType: string;
  referenceId: string;
  sellerProfileId?: string;
  targetHours: number;
  startedAt: Date;
  completedAt?: Date;
  isBreached?: boolean;
}

// ─── Paginated SLA breaches ─────────────────────────

async function getSlaBreaches(params?: SlaBreachParams) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { isBreached: true };
  if (params?.slaType) where.slaType = params.slaType;
  if (params?.sellerProfileId) where.sellerProfileId = params.sellerProfileId;

  const [data, total] = await Promise.all([
    (prisma as any).slaRecord.findMany({
      where,
      include: {
        sellerProfile: {
          select: { id: true, businessName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    (prisma as any).slaRecord.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Dashboard summary ──────────────────────────────

async function getSlaDashboard() {
  const totalBreaches = await (prisma as any).slaRecord.count({
    where: { isBreached: true },
  });

  // Breaches grouped by type
  const breachesByType = await (prisma as any).slaRecord.groupBy({
    by: ['slaType'],
    where: { isBreached: true },
    _count: { id: true },
  });

  // Top 10 offending sellers (most breaches)
  const topOffenders = await (prisma as any).slaRecord.groupBy({
    by: ['sellerProfileId'],
    where: { isBreached: true, sellerProfileId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  // Enrich top offenders with seller names
  const sellerIds = topOffenders.map((o: any) => o.sellerProfileId).filter(Boolean);
  const sellers = sellerIds.length
    ? await (prisma as any).sellerProfile.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, businessName: true },
      })
    : [];
  const sellerMap = new Map(sellers.map((s: any) => [s.id, s.businessName]));

  const topOffendingSellers = topOffenders.map((o: any) => ({
    sellerProfileId: o.sellerProfileId,
    businessName: sellerMap.get(o.sellerProfileId) || 'Unknown',
    breachCount: o._count.id,
  }));

  return {
    totalBreaches,
    breachesByType: breachesByType.map((b: any) => ({
      slaType: b.slaType,
      count: b._count.id,
    })),
    topOffendingSellers,
  };
}

// ─── Create SLA record ──────────────────────────────

async function createSlaRecord(data: CreateSlaRecordData) {
  const record = await (prisma as any).slaRecord.create({
    data: {
      slaType: data.slaType,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      sellerProfileId: data.sellerProfileId || null,
      targetHours: data.targetHours,
      startedAt: data.startedAt,
      completedAt: data.completedAt || null,
      isBreached: data.isBreached ?? false,
    },
  });

  // If breached, check if auto-penalty should fire
  if (record.isBreached && record.sellerProfileId) {
    await checkAndCreatePenalty(record);
  }

  return record;
}

// ─── Auto-penalty check ─────────────────────────────

/**
 * If a seller has more than 3 SLA breaches in the last 30 days,
 * automatically create an SLA_BREACH penalty.
 */
async function checkAndCreatePenalty(slaRecord: any) {
  if (!slaRecord.sellerProfileId) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentBreaches = await (prisma as any).slaRecord.count({
    where: {
      sellerProfileId: slaRecord.sellerProfileId,
      isBreached: true,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  if (recentBreaches > 3) {
    // Auto-create penalty (500 cents = $5 default penalty)
    const penalty = await (prisma as any).sellerPenalty.create({
      data: {
        sellerProfileId: slaRecord.sellerProfileId,
        type: 'SLA_BREACH',
        amountInCents: 500,
        description: `Auto-penalty: ${recentBreaches} SLA breaches in the last 30 days. Latest breach type: ${slaRecord.slaType}`,
        status: 'PENDING',
        createdBy: slaRecord.sellerProfileId, // system-generated, attributed to seller
      },
    });
    return penalty;
  }

  return null;
}

export const slaService = {
  getSlaBreaches,
  getSlaDashboard,
  createSlaRecord,
  checkAndCreatePenalty,
};
