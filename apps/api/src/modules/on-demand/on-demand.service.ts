import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('on-demand');

function generateRequestNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ODR-${date}-${rand}`;
}

export class OnDemandService {
  // Buyer
  async submitRequest(userId: string, data: {
    description: string;
    categoryId?: string;
    budgetMinCents?: number;
    budgetMaxCents?: number;
    expectedBy?: string;
  }) {
    const request = await prisma.onDemandRequest.create({
      data: {
        requestNumber: generateRequestNumber(),
        userId,
        categoryId: data.categoryId,
        description: data.description,
        budgetMinCents: data.budgetMinCents,
        budgetMaxCents: data.budgetMaxCents,
        expectedBy: data.expectedBy ? new Date(data.expectedBy) : undefined,
      },
    });

    log.info(`On-demand request submitted: ${request.requestNumber}`, { userId });

    await writeAuditLog({
      userId,
      action: 'on_demand.submitted',
      auditableType: 'OnDemandRequest',
      auditableId: request.id,
      newValues: { requestNumber: request.requestNumber, status: 'SUBMITTED' },
    });

    return request;
  }

  async listBuyerRequests(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      prisma.onDemandRequest.findMany({
        where: { userId },
        include: { quotes: { orderBy: { createdAt: 'desc' } }, category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.onDemandRequest.count({ where: { userId } }),
    ]);
    return { requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getRequestDetail(requestId: string, userId?: string) {
    const where: any = { id: requestId };
    if (userId) where.userId = userId;

    const request = await prisma.onDemandRequest.findFirst({
      where,
      include: {
        quotes: {
          include: { sellerProfile: { select: { id: true, businessName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        category: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!request) throw new AppError('Request not found', 404);
    return request;
  }

  async acceptQuote(quoteId: string, userId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { onDemandRequest: true },
    });
    if (!quote) throw new AppError('Quote not found', 404);
    if (quote.onDemandRequest.userId !== userId) throw new AppError('Not your request', 403);
    if (quote.status !== 'PENDING') throw new AppError('Quote is no longer pending', 400);
    if (quote.validUntil < new Date()) throw new AppError('Quote has expired', 400);

    await prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
      await tx.onDemandRequest.update({
        where: { id: quote.onDemandRequestId },
        data: { status: 'ACCEPTED' },
      });
    });

    log.info(`Quote accepted: ${quoteId}`, { userId });
    return this.getRequestDetail(quote.onDemandRequestId, userId);
  }

  async rejectQuote(quoteId: string, userId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { onDemandRequest: true },
    });
    if (!quote) throw new AppError('Quote not found', 404);
    if (quote.onDemandRequest.userId !== userId) throw new AppError('Not your request', 403);

    await prisma.quote.update({ where: { id: quoteId }, data: { status: 'REJECTED' } });
    return { message: 'Quote rejected' };
  }

  // Admin
  async listAllRequests(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.onDemandRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: true,
          quotes: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.onDemandRequest.count({ where }),
    ]);
    return { requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createQuote(requestId: string, adminId: string, data: {
    priceInCents: number;
    estimatedDays: number;
    description?: string;
    validityHours?: number;
    sellerProfileId?: string;
  }) {
    const request = await prisma.onDemandRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError('Request not found', 404);

    const validUntil = new Date(Date.now() + (data.validityHours || 72) * 60 * 60 * 1000);

    const quote = await prisma.quote.create({
      data: {
        onDemandRequestId: requestId,
        quotedBy: adminId,
        priceInCents: data.priceInCents,
        estimatedDays: data.estimatedDays,
        description: data.description,
        validUntil,
        sellerProfileId: data.sellerProfileId,
      },
    });

    await prisma.onDemandRequest.update({
      where: { id: requestId },
      data: { status: 'QUOTED' },
    });

    log.info(`Quote created for request: ${request.requestNumber}`, { adminId, quoteId: quote.id });

    await writeAuditLog({
      userId: adminId,
      action: 'on_demand.quoted',
      auditableType: 'OnDemandRequest',
      auditableId: requestId,
      newValues: { quoteId: quote.id, priceInCents: data.priceInCents, estimatedDays: data.estimatedDays },
    });

    return quote;
  }
}

export const onDemandService = new OnDemandService();
