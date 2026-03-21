import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';
import { RETURN_WINDOW_DAYS } from '@crochet-hub/shared';

const log = createModuleLogger('payouts');

function generatePayoutNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${date}-${rand}`;
}

export class PayoutService {
  async generatePayoutCycle(adminId: string, data: {
    cycleStart: string;
    cycleEnd: string;
  }) {
    const cycleStart = new Date(data.cycleStart);
    const cycleEnd = new Date(data.cycleEnd);
    const returnWindowCutoff = new Date(cycleEnd.getTime() - RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Find all sellers with delivered order items in this cycle
    const eligibleItems = await prisma.orderItem.findMany({
      where: {
        sellerProfileId: { not: null },
        status: { in: ['DELIVERED', 'COMPLETED'] },
        order: {
          deliveredAt: {
            gte: cycleStart,
            lte: returnWindowCutoff,
          },
          paymentStatus: 'PAID',
        },
        payoutLineItems: { none: {} }, // Not already in a payout
      },
      include: {
        order: { select: { orderNumber: true, deliveredAt: true } },
        sellerProfile: { select: { id: true, commissionRate: true, businessName: true } },
      },
    });

    // Group by seller
    const sellerGroups = new Map<string, typeof eligibleItems>();
    for (const item of eligibleItems) {
      const sellerId = item.sellerProfileId!;
      if (!sellerGroups.has(sellerId)) sellerGroups.set(sellerId, []);
      sellerGroups.get(sellerId)!.push(item);
    }

    const payouts = [];

    for (const [sellerId, items] of sellerGroups) {
      const seller = items[0].sellerProfile!;
      let totalOrderValue = 0;
      let totalCommission = 0;
      const lineItems: any[] = [];

      for (const item of items) {
        const itemAmount = item.totalPriceInCents;
        const commission = Math.round((itemAmount * seller.commissionRate) / 10000);
        const net = itemAmount - commission;

        totalOrderValue += itemAmount;
        totalCommission += commission;

        lineItems.push({
          orderItemId: item.id,
          orderNumber: item.order.orderNumber,
          itemAmountInCents: itemAmount,
          commissionAmountInCents: commission,
          adjustmentAmountInCents: 0,
          netAmountInCents: net,
        });
      }

      const netPayout = totalOrderValue - totalCommission;

      // Minimum payout threshold: ₹500 (50000 paise)
      if (netPayout < 50000) {
        log.info(`Payout below threshold for seller ${seller.businessName}: ₹${netPayout / 100}`);
        continue;
      }

      const payout = await prisma.payout.create({
        data: {
          payoutNumber: generatePayoutNumber(),
          sellerProfileId: sellerId,
          cycleStart,
          cycleEnd,
          totalOrderValueInCents: totalOrderValue,
          commissionAmountInCents: totalCommission,
          netPayoutInCents: netPayout,
          status: 'DRAFT',
          lineItems: { create: lineItems },
        },
        include: { lineItems: true, sellerProfile: { select: { businessName: true } } },
      });

      payouts.push(payout);

      log.info(`Payout generated: ${payout.payoutNumber} for ${seller.businessName}`, {
        netPayout,
        itemCount: items.length,
      });
    }

    await writeAuditLog({
      userId: adminId,
      action: 'payout.cycle_generated',
      auditableType: 'PayoutCycle',
      auditableId: 'batch',
      newValues: { cycleStart: data.cycleStart, cycleEnd: data.cycleEnd, payoutCount: payouts.length },
    });

    return { payouts, count: payouts.length };
  }

  async listPayouts(filters: { status?: string; sellerId?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.sellerId) where.sellerProfileId = filters.sellerId;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: { sellerProfile: { select: { id: true, businessName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);
    return { payouts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getPayoutDetail(payoutId: string, sellerId?: string) {
    const where: any = { id: payoutId };
    if (sellerId) where.sellerProfileId = sellerId;

    const payout = await prisma.payout.findFirst({
      where,
      include: {
        lineItems: { orderBy: { createdAt: 'asc' } },
        sellerProfile: { select: { id: true, businessName: true, commissionRate: true } },
      },
    });
    if (!payout) throw new AppError('Payout not found', 404);
    return payout;
  }

  async approvePayout(payoutId: string, adminId: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new AppError('Payout not found', 404);
    if (payout.status !== 'DRAFT') throw new AppError('Payout is not in draft status', 400);

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'APPROVED', approvedBy: adminId },
    });

    await writeAuditLog({
      userId: adminId,
      action: 'payout.approved',
      auditableType: 'Payout',
      auditableId: payoutId,
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'APPROVED' },
    });

    return updated;
  }

  async markPaid(payoutId: string, adminId: string, paymentReference: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new AppError('Payout not found', 404);
    if (payout.status !== 'APPROVED') throw new AppError('Payout must be approved first', 400);

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'PAID', paidAt: new Date(), paymentReference },
    });

    log.info(`Payout paid: ${payout.payoutNumber}`, { adminId, paymentReference });

    await writeAuditLog({
      userId: adminId,
      action: 'payout.paid',
      auditableType: 'Payout',
      auditableId: payoutId,
      newValues: { status: 'PAID', paymentReference },
    });

    return updated;
  }

  // Seller: list own payouts
  async listSellerPayouts(sellerProfileId: string, page = 1, limit = 10) {
    return this.listPayouts({ sellerId: sellerProfileId, page, limit });
  }
}

export const payoutService = new PayoutService();
