import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('disputes');

function generateDisputeNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DSP-${date}-${rand}`;
}

export class DisputeService {
  async createDispute(userId: string, data: {
    orderId: string;
    type: string;
    description: string;
    againstSellerId?: string;
  }) {
    const order = await prisma.order.findFirst({ where: { id: data.orderId, userId } });
    if (!order) throw new AppError('Order not found', 404);

    const dispute = await prisma.dispute.create({
      data: {
        disputeNumber: generateDisputeNumber(),
        orderId: data.orderId,
        raisedBy: userId,
        type: data.type as any,
        description: data.description,
        againstSellerId: data.againstSellerId,
      },
    });

    log.info(`Dispute created: ${dispute.disputeNumber}`, { userId });

    await writeAuditLog({
      userId,
      action: 'dispute.created',
      auditableType: 'Dispute',
      auditableId: dispute.id,
      newValues: { disputeNumber: dispute.disputeNumber, type: data.type },
    });

    return dispute;
  }

  async listAllDisputes(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          raiser: { select: { name: true, email: true } },
          againstSeller: { select: { businessName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);
    return { disputes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async resolveDispute(disputeId: string, adminId: string, data: {
    resolutionSummary: string;
  }) {
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new AppError('Dispute not found', 404);

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolutionSummary: data.resolutionSummary,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    log.info(`Dispute resolved: ${dispute.disputeNumber}`, { adminId });

    await writeAuditLog({
      userId: adminId,
      action: 'dispute.resolved',
      auditableType: 'Dispute',
      auditableId: disputeId,
      oldValues: { status: dispute.status },
      newValues: { status: 'RESOLVED', resolutionSummary: data.resolutionSummary },
    });

    return updated;
  }
}

export const disputeService = new DisputeService();
