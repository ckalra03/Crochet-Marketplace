/**
 * Quote Expiry Job
 *
 * Runs every hour. Finds quotes that have passed their validUntil date
 * and are still PENDING, then marks them as EXPIRED.
 *
 * When all quotes for an OnDemandRequest have expired, the request
 * itself is updated to EXPIRED status.
 */

import type { Job } from 'bullmq';
import prisma from '../config/database';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('job:quote-expiry');

/**
 * Processor: expire overdue quotes and update parent requests.
 */
export async function processQuoteExpiry(_job: Job) {
  const now = new Date();
  log.info('Starting quote expiry check');

  // Find all pending quotes past their validity date
  const expiredQuotes = await prisma.quote.findMany({
    where: {
      status: 'PENDING',
      validUntil: { lt: now },
    },
    select: {
      id: true,
      onDemandRequestId: true,
    },
  });

  if (expiredQuotes.length === 0) {
    log.info('No expired quotes found');
    return { expiredQuotes: 0, expiredRequests: 0 };
  }

  // Batch-update all expired quotes to EXPIRED status
  const quoteIds = expiredQuotes.map((q) => q.id);
  await prisma.quote.updateMany({
    where: { id: { in: quoteIds } },
    data: { status: 'EXPIRED' },
  });

  log.info(`Expired ${quoteIds.length} quotes`);

  // Collect unique request IDs affected by these expirations
  const requestIds = [...new Set(expiredQuotes.map((q) => q.onDemandRequestId))];

  // For each affected request, check if ALL its quotes are now expired
  let expiredRequests = 0;
  for (const requestId of requestIds) {
    const pendingCount = await prisma.quote.count({
      where: {
        onDemandRequestId: requestId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });

    // If no pending/accepted quotes remain, expire the request
    if (pendingCount === 0) {
      await prisma.onDemandRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      expiredRequests++;
      log.info(`OnDemandRequest ${requestId} expired (all quotes expired)`);
    }
  }

  log.info(`Quote expiry complete: ${quoteIds.length} quotes, ${expiredRequests} requests expired`);
  return { expiredQuotes: quoteIds.length, expiredRequests };
}
