import prisma from '../../config/database';
import { AppError } from '../auth/auth.service';
import { writeAuditLog } from '../../support/audit-logger';
import { createModuleLogger } from '../../support/logger';
import { cartService } from '../cart/cart.service';

const log = createModuleLogger('checkout');

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CH-${date}-${rand}`;
}

export class CheckoutService {
  async createOrder(userId: string, data: { shippingAddressId: string; notes?: string }) {
    const cart = await cartService.getCart(userId);
    if (cart.items.length === 0) throw new AppError('Cart is empty', 400);

    const address = await prisma.address.findFirst({
      where: { id: data.shippingAddressId, userId },
    });
    if (!address) throw new AppError('Shipping address not found', 404);

    // Validate stock and calculate totals in a transaction
    const order = await prisma.$transaction(async (tx) => {
      let subtotalInCents = 0;
      const orderItems: any[] = [];

      for (const item of cart.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive || product.status !== 'APPROVED') {
          throw new AppError(`Product "${item.product.name}" is no longer available`, 400);
        }

        if (product.productType === 'READY_STOCK') {
          if (product.stockQuantity < item.quantity) {
            throw new AppError(`Insufficient stock for "${product.name}"`, 400);
          }
          // Reserve stock
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        const unitPrice = product.priceInCents || 0;
        const totalPrice = unitPrice * item.quantity;
        subtotalInCents += totalPrice;

        orderItems.push({
          productId: product.id,
          sellerProfileId: product.sellerProfileId,
          productName: product.name,
          productType: product.productType,
          quantity: item.quantity,
          unitPriceInCents: unitPrice,
          totalPriceInCents: totalPrice,
        });
      }

      const shippingFeeInCents = 0; // Free shipping for MVP
      const taxAmountInCents = 0;
      const totalInCents = subtotalInCents + shippingFeeInCents + taxAmountInCents;

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          shippingAddressId: data.shippingAddressId,
          subtotalInCents,
          shippingFeeInCents,
          taxAmountInCents,
          totalInCents,
          notes: data.notes,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    log.info(`Order created: ${order.orderNumber}`, { userId, orderId: order.id, total: order.totalInCents });

    await writeAuditLog({
      userId,
      action: 'order.created',
      auditableType: 'Order',
      auditableId: order.id,
      newValues: { orderNumber: order.orderNumber, status: 'PENDING_PAYMENT', totalInCents: order.totalInCents },
    });

    // For MVP mock payment: auto-confirm
    const confirmedOrder = await this.confirmPayment(order.id, {
      gateway: 'MOCK',
      gatewayTransactionId: `mock-${Date.now()}`,
      amountInCents: order.totalInCents,
      method: 'mock',
    });

    return confirmedOrder;
  }

  async confirmPayment(orderId: string, paymentData: {
    gateway: string;
    gatewayTransactionId: string;
    amountInCents: number;
    method: string;
  }) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);

    await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          orderId,
          gateway: paymentData.gateway as any,
          gatewayTransactionId: paymentData.gatewayTransactionId,
          amountInCents: paymentData.amountInCents,
          status: 'SUCCESS',
          method: paymentData.method,
          paidAt: new Date(),
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          placedAt: new Date(),
        },
      });

      // Update order items status
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: 'CONFIRMED' },
      });
    });

    log.info(`Payment confirmed for order: ${order.orderNumber}`, { orderId });

    await writeAuditLog({
      action: 'order.payment_confirmed',
      auditableType: 'Order',
      auditableId: orderId,
      oldValues: { status: 'PENDING_PAYMENT' },
      newValues: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    });

    return prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, shippingAddress: true },
    });
  }
}

export const checkoutService = new CheckoutService();
