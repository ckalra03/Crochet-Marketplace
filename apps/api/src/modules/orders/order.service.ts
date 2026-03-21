import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';
import { ORDER_TRANSITIONS } from '@crochet-hub/shared';

const log = createModuleLogger('orders');

export class OrderService {
  async listBuyerOrders(userId: string, status?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { media: { take: 1, orderBy: { sortOrder: 'asc' } } } },
            },
          },
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getOrderByNumber(orderNumber: string, userId?: string) {
    const where: any = { orderNumber };
    if (userId) where.userId = userId;

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: { include: { media: { take: 1 } } },
            sellerProfile: { select: { id: true, businessName: true } },
            warehouseItem: { include: { qcRecords: true } },
          },
        },
        payments: true,
        shippingAddress: true,
        returns: true,
      },
    });

    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async cancelOrder(orderNumber: string, userId: string, reason: string) {
    const order = await prisma.order.findFirst({ where: { orderNumber, userId } });
    if (!order) throw new AppError('Order not found', 404);

    const cancellable = ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'];
    if (!cancellable.includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason },
      });
      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: 'CANCELLED' },
      });

      // Restore stock for ready_stock items
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        if (item.productType === 'READY_STOCK') {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
    });

    log.info(`Order cancelled: ${orderNumber}`, { userId, reason });

    await writeAuditLog({
      userId,
      action: 'order.cancelled',
      auditableType: 'Order',
      auditableId: order.id,
      oldValues: { status: order.status },
      newValues: { status: 'CANCELLED', reason },
    });

    return this.getOrderByNumber(orderNumber);
  }

  // Admin: update order status
  async updateOrderStatus(orderNumber: string, adminId: string, newStatus: string, notes?: string) {
    const order = await prisma.order.findFirst({ where: { orderNumber } });
    if (!order) throw new AppError('Order not found', 404);

    const allowedTransitions = ORDER_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`,
        400,
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'DISPATCHED') updateData.shippedAt = new Date();
    if (newStatus === 'DELIVERED') updateData.deliveredAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: updateData });
      await tx.orderItem.updateMany({ where: { orderId: order.id }, data: { status: newStatus as any } });
    });

    log.info(`Order status updated: ${orderNumber} -> ${newStatus}`, { adminId });

    await writeAuditLog({
      userId: adminId,
      action: 'order.status_updated',
      auditableType: 'Order',
      auditableId: order.id,
      oldValues: { status: order.status },
      newValues: { status: newStatus, notes },
    });

    return this.getOrderByNumber(orderNumber);
  }

  // Admin: list all orders
  async listAllOrders(filters: { status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { sellerProfile: { select: { id: true, businessName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // Seller: list allocated order items
  async listSellerOrders(sellerProfileId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { sellerProfileId };

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, status: true, placedAt: true, userId: true } },
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.orderItem.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const orderService = new OrderService();
