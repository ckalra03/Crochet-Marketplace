import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('products');

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class ProductService {
  // Seller methods
  async createProduct(sellerProfileId: string, data: any) {
    const slug = slugify(data.name) + '-' + Date.now().toString(36);

    const product = await prisma.product.create({
      data: {
        sellerProfileId,
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        productType: data.productType,
        priceInCents: data.priceInCents,
        compareAtPriceInCents: data.compareAtPriceInCents,
        stockQuantity: data.stockQuantity || 0,
        leadTimeDays: data.leadTimeDays,
        returnPolicy: data.returnPolicy,
        meta: data.meta,
        status: 'DRAFT',
      },
      include: { category: true, media: true },
    });

    log.info(`Product created: ${product.name}`, { productId: product.id, sellerProfileId });
    return product;
  }

  async updateProduct(productId: string, sellerProfileId: string, data: any) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerProfileId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);
    if (product.status === 'APPROVED') {
      // Re-set to draft if editing an approved product
      data.status = 'DRAFT';
    }

    return prisma.product.update({
      where: { id: productId },
      data,
      include: { category: true, media: true },
    });
  }

  async deleteProduct(productId: string, sellerProfileId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerProfileId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);

    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async submitForApproval(productId: string, sellerProfileId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerProfileId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);
    if (product.status !== 'DRAFT' && product.status !== 'REJECTED') {
      throw new AppError('Product can only be submitted from draft or rejected status', 400);
    }

    return prisma.product.update({
      where: { id: productId },
      data: { status: 'PENDING_APPROVAL' },
    });
  }

  /** Fetch a single product by ID, scoped to the given seller. Includes category and all media. */
  async getSellerProduct(productId: string, sellerProfileId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerProfileId, deletedAt: null },
      include: {
        category: true,
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async listSellerProducts(sellerProfileId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { sellerProfileId, deletedAt: null };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, media: { take: 1, orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async addMedia(productId: string, sellerProfileId: string, filePath: string, type: 'IMAGE' | 'VIDEO') {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerProfileId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);

    const count = await prisma.productMedia.count({ where: { productId } });

    return prisma.productMedia.create({
      data: {
        productId,
        filePath,
        type,
        sortOrder: count,
        isPrimary: count === 0,
      },
    });
  }

  async removeMedia(productId: string, mediaId: string, sellerProfileId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerProfileId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404);

    const media = await prisma.productMedia.findFirst({
      where: { id: mediaId, productId },
    });
    if (!media) throw new AppError('Media not found', 404);

    await prisma.productMedia.delete({ where: { id: mediaId } });
  }

  // Admin methods
  async listPendingProducts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { status: 'PENDING_APPROVAL' as const, deletedAt: null };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          sellerProfile: { select: { id: true, businessName: true } },
          media: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async approveProduct(productId: string, adminId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'PENDING_APPROVAL', deletedAt: null },
    });
    if (!product) throw new AppError('Product not found or not pending', 404);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { status: 'APPROVED', approvedBy: adminId, approvedAt: new Date(), isActive: true },
    });

    log.info(`Product approved: ${product.name}`, { productId, adminId });

    await writeAuditLog({
      userId: adminId,
      action: 'product.approved',
      auditableType: 'Product',
      auditableId: productId,
      oldValues: { status: 'PENDING_APPROVAL' },
      newValues: { status: 'APPROVED' },
    });

    return updated;
  }

  async rejectProduct(productId: string, adminId: string, reason: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'PENDING_APPROVAL', deletedAt: null },
    });
    if (!product) throw new AppError('Product not found or not pending', 404);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { status: 'REJECTED' },
    });

    await writeAuditLog({
      userId: adminId,
      action: 'product.rejected',
      auditableType: 'Product',
      auditableId: productId,
      oldValues: { status: 'PENDING_APPROVAL' },
      newValues: { status: 'REJECTED', reason },
    });

    return updated;
  }
}

export const productService = new ProductService();
