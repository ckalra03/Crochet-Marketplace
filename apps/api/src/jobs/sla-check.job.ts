/**
 * SLA Check Job
 *
 * Runs every 15 minutes. Finds orders stuck in certain statuses longer
 * than the allowed SLA thresholds and creates SlaRecord entries for breaches.
 *
 * Thresholds:
 *   CONFIRMED  > 2 days  (should move to PROCESSING)
 *   IN_PRODUCTION > 7 days  (should be at warehouse)
 *   DISPATCHED > 10 days  (should be delivered)
 */

import type { Job } from 'bullmq';
import prisma from '../config/database';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('job:sla-check');

// SLA thresholds in hours
const SLA_THRESHOLDS = [
  {
    status: 'CONFIRMED' as const,
    slaType: 'DISPATCH' as const,
    targetHours: 48, // 2 days
  },
  {
    status: 'IN_PRODUCTION' as const,
    slaType: 'DISPATCH' as const,
    targetHours: 168, // 7 days
  },
  {
    status: 'DISPATCHED' as const,
    slaType: 'DELIVERY' as const,
    targetHours: 240, // 10 days
  },
];

/**
 * Processor: check all orders against SLA thresholds.
 * For each order that has exceeded its threshold, create an SlaRecord
 * if one doesn't already exist for this order + slaType combination.
 */
export async function processSlaCheck(_job: Job) {
  log.info('Starting SLA check');
  let totalBreaches = 0;

  for (const threshold of SLA_THRESHOLDS) {
    // Calculate the cutoff time — orders updated before this are overdue
    const cutoff = new Date(Date.now() - threshold.targetHours * 60 * 60 * 1000);

    // Find orders stuck in this status longer than allowed
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: threshold.status,
        updatedAt: { lt: cutoff },
      },
      select: {
        id: true,
        orderNumber: true,
        updatedAt: true,
        items: {
          select: { sellerProfileId: true },
          take: 1,
        },
      },
    });

    for (const order of overdueOrders) {
      // Check if we already recorded this breach (avoid duplicates)
      const existing = await prisma.slaRecord.findFirst({
        where: {
          referenceType: 'Order',
          referenceId: order.id,
          slaType: threshold.slaType,
          isBreached: true,
        },
      });

      if (existing) continue; // Already flagged

      // Get the seller from the first order item (if any)
      const sellerProfileId = order.items[0]?.sellerProfileId ?? null;

      await prisma.slaRecord.create({
        data: {
          slaType: threshold.slaType,
          referenceType: 'Order',
          referenceId: order.id,
          sellerProfileId,
          targetHours: threshold.targetHours,
          startedAt: order.updatedAt,
          isBreached: true,
        },
      });

      totalBreaches++;
      log.warn(`SLA breach: Order ${order.orderNumber} in ${threshold.status} for >${threshold.targetHours}h`);
    }
  }

  log.info(`SLA check complete: ${totalBreaches} new breaches found`);
  return { breaches: totalBreaches };
}
