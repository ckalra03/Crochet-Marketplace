/**
 * Return Window Expiry Job
 *
 * Runs daily at midnight. Finds orders that were delivered more than 7 days ago
 * and are still in DELIVERED status. Updates them to COMPLETED and marks their
 * items as eligible for payout (by setting item status to COMPLETED).
 *
 * This aligns with the RETURN_WINDOW_DAYS constant used by the return service.
 */

import type { Job } from 'bullmq';
import prisma from '../config/database';
import { createModuleLogger } from '../support/logger';
import { RETURN_WINDOW_DAYS } from '@crochet-hub/shared';

const log = createModuleLogger('job:return-window-expiry');

/**
 * Processor: close the return window on old delivered orders.
 */
export async function processReturnWindowExpiry(_job: Job) {
  log.info('Starting return window expiry check');

  // Orders delivered more than RETURN_WINDOW_DAYS ago
  const cutoff = new Date(Date.now() - RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Find delivered orders past the return window
  const overdueOrders = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: {
        not: null,
        lt: cutoff,
      },
    },
    select: {
      id: true,
      orderNumber: true,
    },
  });

  if (overdueOrders.length === 0) {
    log.info('No orders past return window');
    return { ordersCompleted: 0, itemsMarked: 0 };
  }

  const orderIds = overdueOrders.map((o) => o.id);

  // Update orders to COMPLETED
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { status: 'COMPLETED' },
  });

  // Mark all items in these orders as COMPLETED (payout-eligible)
  const itemResult = await prisma.orderItem.updateMany({
    where: {
      orderId: { in: orderIds },
      status: 'DELIVERED',
    },
    data: { status: 'COMPLETED' },
  });

  for (const order of overdueOrders) {
    log.info(`Order ${order.orderNumber} completed (return window expired)`);
  }

  log.info(`Return window expiry complete: ${orderIds.length} orders, ${itemResult.count} items marked completed`);
  return { ordersCompleted: orderIds.length, itemsMarked: itemResult.count };
}
