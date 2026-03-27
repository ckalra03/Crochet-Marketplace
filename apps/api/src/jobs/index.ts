/**
 * Job System Initializer
 *
 * Sets up all BullMQ queues, workers, and repeating schedules.
 * Call initializeJobs() once on server startup (only when Redis is available).
 *
 * Queues:
 *   - sla-check:            every 15 minutes
 *   - quote-expiry:         every hour
 *   - return-window-expiry: daily at midnight (UTC)
 *   - payout-generation:    triggered manually via admin API
 */

import type { Queue, Worker } from 'bullmq';
import {
  createQueue,
  createWorker,
  PAYOUT_GENERATION,
  SLA_CHECK,
  QUOTE_EXPIRY,
  RETURN_WINDOW_EXPIRY,
} from './queue';
import { processPayoutGeneration } from './payout-generation.job';
import { processSlaCheck } from './sla-check.job';
import { processQuoteExpiry } from './quote-expiry.job';
import { processReturnWindowExpiry } from './return-window-expiry.job';
import { isRedisAvailable } from '../config/redis';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('jobs');

// Keep references so we can export the payout queue for the admin route
let payoutQueue: Queue | null = null;
let slaQueue: Queue | null = null;
let quoteQueue: Queue | null = null;
let returnWindowQueue: Queue | null = null;

const workers: Worker[] = [];

/**
 * Initialize all job queues, workers, and repeating schedules.
 * Gracefully skips initialization when Redis is not available.
 */
export async function initializeJobs(): Promise<void> {
  if (!isRedisAvailable()) {
    log.warn('Redis not available — skipping job queue initialization');
    return;
  }

  try {
    // ─── Create Queues ──────────────────────────────
    payoutQueue = createQueue(PAYOUT_GENERATION);
    slaQueue = createQueue(SLA_CHECK);
    quoteQueue = createQueue(QUOTE_EXPIRY);
    returnWindowQueue = createQueue(RETURN_WINDOW_EXPIRY);

    // ─── Create Workers ─────────────────────────────
    workers.push(createWorker(PAYOUT_GENERATION, processPayoutGeneration));
    workers.push(createWorker(SLA_CHECK, processSlaCheck));
    workers.push(createWorker(QUOTE_EXPIRY, processQuoteExpiry));
    workers.push(createWorker(RETURN_WINDOW_EXPIRY, processReturnWindowExpiry));

    // ─── Register Repeating Jobs ────────────────────
    // SLA check: every 15 minutes
    await slaQueue.upsertJobScheduler(
      'sla-check-repeat',
      { every: 15 * 60 * 1000 },
      { name: 'sla-check', data: {} },
    );

    // Quote expiry: every hour
    await quoteQueue.upsertJobScheduler(
      'quote-expiry-repeat',
      { every: 60 * 60 * 1000 },
      { name: 'quote-expiry', data: {} },
    );

    // Return window expiry: daily at midnight UTC
    await returnWindowQueue.upsertJobScheduler(
      'return-window-expiry-repeat',
      { pattern: '0 0 * * *' },
      { name: 'return-window-expiry', data: {} },
    );

    // Payout generation is NOT repeating — triggered manually via admin API

    log.info('All job queues and workers initialized successfully');
  } catch (err: any) {
    log.error(`Failed to initialize job queues: ${err.message}`);
  }
}

/**
 * Get the payout generation queue (used by the admin route to enqueue jobs).
 * Returns null if jobs haven't been initialized (e.g. Redis unavailable).
 */
export function getPayoutQueue(): Queue | null {
  return payoutQueue;
}

/**
 * Gracefully shut down all workers and close queues.
 * Called during server shutdown.
 */
export async function shutdownJobs(): Promise<void> {
  log.info('Shutting down job queues...');

  // Close workers first (stop processing)
  await Promise.all(workers.map((w) => w.close()));

  // Then close queues
  const queues = [payoutQueue, slaQueue, quoteQueue, returnWindowQueue];
  await Promise.all(queues.filter(Boolean).map((q) => q!.close()));

  log.info('All job queues shut down');
}
