import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('seller');

export class SellerService {
  async register(userId: string, data: { businessName: string; description?: string; address?: any }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== 'BUYER') throw new AppError('Only buyers can register as sellers', 400);

    const existing = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (existing) throw new AppError('Seller application already exists', 409);

    const profile = await prisma.sellerProfile.create({
      data: {
        userId,
        businessName: data.businessName,
        description: data.description,
        address: data.address,
      },
    });

    // Update user role to SELLER
    await prisma.user.update({ where: { id: userId }, data: { role: 'SELLER' } });

    log.info(`Seller registered: ${data.businessName}`, { userId, profileId: profile.id });

    await writeAuditLog({
      userId,
      action: 'seller.registered',
      auditableType: 'SellerProfile',
      auditableId: profile.id,
      newValues: { businessName: data.businessName, status: 'PENDING' },
    });

    return profile;
  }

  async getProfile(userId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!profile) throw new AppError('Seller profile not found', 404);
    return profile;
  }

  async updateProfile(userId: string, data: { businessName?: string; description?: string; address?: any }) {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError('Seller profile not found', 404);

    return prisma.sellerProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  // Admin methods
  async listSellers(status?: string, page = 1, limit = 20) {
    const where = status ? { status: status as any } : {};
    const skip = (page - 1) * limit;

    const [sellers, total] = await Promise.all([
      prisma.sellerProfile.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sellerProfile.count({ where }),
    ]);

    return { sellers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSellerById(id: string) {
    const seller = await prisma.sellerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        _count: { select: { products: true, orderItems: true, ratings: true } },
      },
    });
    if (!seller) throw new AppError('Seller not found', 404);
    return seller;
  }

  async approveSeller(sellerId: string, adminId: string) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller) throw new AppError('Seller not found', 404);
    if (seller.status !== 'PENDING') throw new AppError('Seller is not in pending status', 400);

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { status: 'APPROVED', approvedBy: adminId, approvedAt: new Date() },
    });

    log.info(`Seller approved: ${sellerId}`, { adminId });

    await writeAuditLog({
      userId: adminId,
      action: 'seller.approved',
      auditableType: 'SellerProfile',
      auditableId: sellerId,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'APPROVED' },
    });

    return updated;
  }

  async rejectSeller(sellerId: string, adminId: string, reason: string) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller) throw new AppError('Seller not found', 404);

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { status: 'REJECTED' },
    });

    log.info(`Seller rejected: ${sellerId}`, { adminId, reason });

    await writeAuditLog({
      userId: adminId,
      action: 'seller.rejected',
      auditableType: 'SellerProfile',
      auditableId: sellerId,
      oldValues: { status: seller.status },
      newValues: { status: 'REJECTED', reason },
    });

    return updated;
  }

  async suspendSeller(sellerId: string, adminId: string, reason: string) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller) throw new AppError('Seller not found', 404);

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { status: 'SUSPENDED' },
    });

    log.info(`Seller suspended: ${sellerId}`, { adminId, reason });

    await writeAuditLog({
      userId: adminId,
      action: 'seller.suspended',
      auditableType: 'SellerProfile',
      auditableId: sellerId,
      oldValues: { status: seller.status },
      newValues: { status: 'SUSPENDED', reason },
    });

    return updated;
  }
}

export const sellerService = new SellerService();
