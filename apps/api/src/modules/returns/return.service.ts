import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';
import { RETURN_ELIGIBILITY, RETURN_WINDOW_DAYS } from '@crochet-hub/shared';

const log = createModuleLogger('returns');

function generateReturnNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RET-${date}-${rand}`;
}

export class ReturnService {
  async submitReturn(userId: string, data: {
    orderId: string;
    orderItemId?: string;
    reason: string;
    description?: string;
  }) {
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, userId },
      include: { items: true },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
      throw new AppError('Returns only accepted for delivered orders', 400);
    }

    // Check return window
    if (order.deliveredAt) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
        throw new AppError(`Return window of ${RETURN_WINDOW_DAYS} days has expired`, 400);
      }
    }

    // Check eligibility via policy matrix
    const orderItem = data.orderItemId
      ? order.items.find((i) => i.id === data.orderItemId)
      : order.items[0];

    if (!orderItem) throw new AppError('Order item not found', 404);

    const eligible = RETURN_ELIGIBILITY[orderItem.productType] || [];
    if (!eligible.includes(data.reason)) {
      throw new AppError(
        `${data.reason} returns are not eligible for ${orderItem.productType} products`,
        400,
      );
    }

    const returnRecord = await prisma.return.create({
      data: {
        returnNumber: generateReturnNumber(),
        orderId: data.orderId,
        orderItemId: data.orderItemId,
        userId,
        reason: data.reason as any,
        description: data.description,
      },
    });

    log.info(`Return submitted: ${returnRecord.returnNumber}`, { userId, orderId: data.orderId });

    await writeAuditLog({
      userId,
      action: 'return.submitted',
      auditableType: 'Return',
      auditableId: returnRecord.id,
      newValues: { returnNumber: returnRecord.returnNumber, reason: data.reason, status: 'REQUESTED' },
    });

    return returnRecord;
  }

  async listBuyerReturns(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where: { userId },
        include: {
          order: { select: { orderNumber: true } },
          orderItem: { select: { productName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.return.count({ where: { userId } }),
    ]);
    return { returns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getReturnDetail(returnNumber: string, userId?: string) {
    const where: any = { returnNumber };
    if (userId) where.userId = userId;

    const returnRecord = await prisma.return.findFirst({
      where,
      include: {
        order: { select: { orderNumber: true, totalInCents: true } },
        orderItem: { select: { productName: true, totalPriceInCents: true, productType: true } },
        resolver: { select: { name: true } },
      },
    });
    if (!returnRecord) throw new AppError('Return not found', 404);
    return returnRecord;
  }

  // Admin
  async listAllReturns(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          user: { select: { name: true, email: true } },
          orderItem: { select: { productName: true, productType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.return.count({ where }),
    ]);
    return { returns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async reviewReturn(returnId: string, adminId: string, data: {
    resolution: string;
    refundAmountInCents?: number;
    adminNotes?: string;
  }) {
    const returnRecord = await prisma.return.findUnique({ where: { id: returnId } });
    if (!returnRecord) throw new AppError('Return not found', 404);

    const newStatus = data.resolution === 'REJECTED' ? 'REJECTED' : 'APPROVED';

    const updated = await prisma.return.update({
      where: { id: returnId },
      data: {
        status: newStatus as any,
        resolution: data.resolution as any,
        refundAmountInCents: data.refundAmountInCents,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        adminNotes: data.adminNotes,
      },
    });

    log.info(`Return ${newStatus}: ${returnRecord.returnNumber}`, { adminId, resolution: data.resolution });

    await writeAuditLog({
      userId: adminId,
      action: `return.${newStatus.toLowerCase()}`,
      auditableType: 'Return',
      auditableId: returnId,
      oldValues: { status: returnRecord.status },
      newValues: { status: newStatus, resolution: data.resolution },
    });

    return updated;
  }
}

export const returnService = new ReturnService();
