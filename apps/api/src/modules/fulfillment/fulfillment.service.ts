import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('fulfillment');

export class FulfillmentService {
  async listWarehouseItems(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.warehouseItem.findMany({
        where,
        include: {
          orderItem: {
            include: {
              order: { select: { orderNumber: true, userId: true } },
              product: { select: { name: true } },
            },
          },
          sellerProfile: { select: { id: true, businessName: true } },
          qcRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.warehouseItem.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createWarehouseItems(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new AppError('Order not found', 404);

    const warehouseItems = [];
    for (const item of order.items) {
      const existing = await prisma.warehouseItem.findUnique({
        where: { orderItemId: item.id },
      });
      if (!existing) {
        const wi = await prisma.warehouseItem.create({
          data: {
            orderItemId: item.id,
            sellerProfileId: item.sellerProfileId,
            status: 'AWAITING_ARRIVAL',
          },
        });
        warehouseItems.push(wi);
      }
    }

    return warehouseItems;
  }

  async receiveItem(warehouseItemId: string, adminId: string) {
    const item = await prisma.warehouseItem.findUnique({ where: { id: warehouseItemId } });
    if (!item) throw new AppError('Warehouse item not found', 404);
    if (item.status !== 'AWAITING_ARRIVAL') throw new AppError('Item not awaiting arrival', 400);

    const updated = await prisma.warehouseItem.update({
      where: { id: warehouseItemId },
      data: { status: 'QC_PENDING', receivedAt: new Date() },
    });

    log.info(`Item received at warehouse`, { warehouseItemId, adminId });

    await writeAuditLog({
      userId: adminId,
      action: 'warehouse.item_received',
      auditableType: 'WarehouseItem',
      auditableId: warehouseItemId,
      oldValues: { status: 'AWAITING_ARRIVAL' },
      newValues: { status: 'QC_PENDING' },
    });

    return updated;
  }

  async submitQc(warehouseItemId: string, adminId: string, data: {
    result: 'PASS' | 'FAIL';
    checklist: Record<string, boolean>;
    defectNotes?: string;
  }) {
    const item = await prisma.warehouseItem.findUnique({ where: { id: warehouseItemId } });
    if (!item) throw new AppError('Warehouse item not found', 404);
    if (item.status !== 'QC_PENDING') throw new AppError('Item not pending QC', 400);

    const newStatus = data.result === 'PASS' ? 'QC_PASSED' : 'QC_FAILED';

    await prisma.$transaction(async (tx) => {
      await tx.qcRecord.create({
        data: {
          warehouseItemId,
          inspectedBy: adminId,
          result: data.result,
          checklist: data.checklist,
          defectNotes: data.defectNotes,
          inspectedAt: new Date(),
        },
      });

      await tx.warehouseItem.update({
        where: { id: warehouseItemId },
        data: { status: newStatus as any },
      });
    });

    log.info(`QC ${data.result}: ${warehouseItemId}`, { adminId });

    await writeAuditLog({
      userId: adminId,
      action: `warehouse.qc_${data.result.toLowerCase()}`,
      auditableType: 'WarehouseItem',
      auditableId: warehouseItemId,
      oldValues: { status: 'QC_PENDING' },
      newValues: { status: newStatus, checklist: data.checklist },
    });

    return prisma.warehouseItem.findUnique({
      where: { id: warehouseItemId },
      include: { qcRecords: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async dispatchItem(warehouseItemId: string, adminId: string, data: {
    trackingNumber: string;
    shippingCarrier: string;
  }) {
    const item = await prisma.warehouseItem.findUnique({ where: { id: warehouseItemId } });
    if (!item) throw new AppError('Warehouse item not found', 404);
    if (item.status !== 'QC_PASSED' && item.status !== 'PACKED') {
      throw new AppError('Item must pass QC before dispatch', 400);
    }

    const updated = await prisma.warehouseItem.update({
      where: { id: warehouseItemId },
      data: {
        status: 'DISPATCHED',
        dispatchedAt: new Date(),
        trackingNumber: data.trackingNumber,
        shippingCarrier: data.shippingCarrier,
      },
    });

    log.info(`Item dispatched: ${warehouseItemId}`, { adminId, trackingNumber: data.trackingNumber });

    await writeAuditLog({
      userId: adminId,
      action: 'warehouse.dispatched',
      auditableType: 'WarehouseItem',
      auditableId: warehouseItemId,
      newValues: { status: 'DISPATCHED', trackingNumber: data.trackingNumber },
    });

    return updated;
  }
}

export const fulfillmentService = new FulfillmentService();
