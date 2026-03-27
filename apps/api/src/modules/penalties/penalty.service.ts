import prisma from '../../config/database';

/**
 * Penalty management service.
 *
 * Supports creating, listing, waiving, and fetching seller-scoped penalties.
 * Penalty types: QC_FAILURE, SLA_BREACH, RETURN_LIABILITY, OTHER.
 */

export interface PenaltyListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreatePenaltyData {
  sellerProfileId: string;
  type: 'QC_FAILURE' | 'SLA_BREACH' | 'RETURN_LIABILITY' | 'OTHER';
  amountInCents: number;
  reason: string;
}

// ─── List all penalties (admin) ─────────────────────

async function getPenalties(params?: PenaltyListParams) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params?.status) where.status = params.status;

  const [data, total] = await Promise.all([
    (prisma as any).sellerPenalty.findMany({
      where,
      include: {
        sellerProfile: {
          select: { id: true, businessName: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    (prisma as any).sellerPenalty.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Create penalty (admin) ─────────────────────────

async function createPenalty(data: CreatePenaltyData, adminId: string) {
  const penalty = await (prisma as any).sellerPenalty.create({
    data: {
      sellerProfileId: data.sellerProfileId,
      type: data.type,
      amountInCents: data.amountInCents,
      description: data.reason,
      status: 'PENDING',
      createdBy: adminId,
    },
    include: {
      sellerProfile: {
        select: { id: true, businessName: true },
      },
    },
  });

  return penalty;
}

// ─── Waive penalty (admin) ──────────────────────────

async function waivePenalty(id: string, _adminId: string) {
  const penalty = await (prisma as any).sellerPenalty.update({
    where: { id },
    data: { status: 'WAIVED' },
    include: {
      sellerProfile: {
        select: { id: true, businessName: true },
      },
    },
  });

  return penalty;
}

// ─── Seller's own penalties ─────────────────────────

async function getSellerPenalties(sellerProfileId: string, params?: PenaltyListParams) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { sellerProfileId };
  if (params?.status) where.status = params.status;

  const [data, total] = await Promise.all([
    (prisma as any).sellerPenalty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    (prisma as any).sellerPenalty.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export const penaltyService = {
  getPenalties,
  createPenalty,
  waivePenalty,
  getSellerPenalties,
};
