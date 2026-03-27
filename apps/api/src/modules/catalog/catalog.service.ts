import prisma from '../../config/database';
import { Prisma } from '@prisma/client';
import { wishlistService } from '../wishlist/wishlist.service';

export class CatalogService {
  async getProducts(params: {
    search?: string;
    categoryId?: string;
    productType?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const { page = 1, limit = 12, sort = 'newest' } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: 'APPROVED',
      isActive: true,
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.productType) where.productType = params.productType as any;
    if (params.sellerId) where.sellerProfileId = params.sellerId;

    if (params.minPrice || params.maxPrice) {
      where.priceInCents = {};
      if (params.minPrice) where.priceInCents.gte = params.minPrice;
      if (params.maxPrice) where.priceInCents.lte = params.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price_asc'
        ? { priceInCents: 'asc' }
        : sort === 'price_desc'
          ? { priceInCents: 'desc' }
          : sort === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          sellerProfile: { select: { id: true, businessName: true } },
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
          _count: { select: { ratings: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductBySlug(slug: string, userId?: string) {
    const product = await prisma.product.findFirst({
      where: { slug, status: 'APPROVED', isActive: true, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        sellerProfile: { select: { id: true, businessName: true, description: true } },
        media: { orderBy: { sortOrder: 'asc' } },
        ratings: {
          where: { isVisible: true },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { ratings: true } },
      },
    });

    if (!product) return null;

    // Calculate avg rating
    const avgRating = await prisma.rating.aggregate({
      where: { productId: product.id, isVisible: true },
      _avg: { score: true },
    });

    // Check wishlist status if user is authenticated
    const isWishlisted = userId
      ? await wishlistService.isWishlisted(userId, product.id)
      : false;

    return { ...product, avgRating: avgRating._avg.score || 0, isWishlisted };
  }

  async getCategories() {
    return prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategoryBySlug(slug: string) {
    return prisma.category.findFirst({
      where: { slug, isActive: true },
      include: { children: { where: { isActive: true } } },
    });
  }
}

export const catalogService = new CatalogService();
