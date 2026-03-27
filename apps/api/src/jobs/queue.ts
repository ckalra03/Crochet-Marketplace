/**
 * Shared BullMQ queue configuration.
 *
 * All queues and workers share the same Redis connection from config/redis.ts.
 * Default job options include automatic cleanup and retry with exponential backoff.
 */

import { Queue, Worker, type Processor, type WorkerOptions } from 'bullmq';
import { redis } from '../config/redis';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('queue');

// ─── Queue Name Constants ───────────────────────────
export const PAYOUT_GENERATION = 'payout-generation';
export const SLA_CHECK = 'sla-check';
export const QUOTE_EXPIRY = 'quote-expiry';
export const RETURN_WINDOW_EXPIRY = 'return-window-expiry';

// ─── Default Job Options ────────────────────────────
// Clean up completed/failed jobs to prevent Redis from growing unbounded.
// Retry up to 3 times with exponential backoff (1s, 2s, 4s).
const defaultJobOptions = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
};

/**
 * Create a BullMQ Queue with the shared Redis connection.
 * The queue is used to add jobs; workers consume them.
 */
export function createQueue(name: string): Queue {
  const queue = new Queue(name, {
    connection: redis,
    defaultJobOptions,
  });

  log.info(`Queue created: ${name}`);
  return queue;
}

/**
 * Create a BullMQ Worker with the shared Redis connection.
 * The worker picks up jobs from the named queue and runs the processor function.
 */
export function createWorker(
  name: string,
  processor: Processor,
  opts?: Partial<WorkerOptions>,
): Worker {
  const worker = new Worker(name, processor, {
    connection: redis,
    // Process one job at a time by default to keep things simple
    concurrency: 1,
    ...opts,
  });

  // Log worker lifecycle events
  worker.on('completed', (job) => {
    log.info(`Job completed: ${name}/${job?.id}`);
  });

  worker.on('failed', (job, err) => {
    log.error(`Job failed: ${name}/${job?.id} — ${err.message}`);
  });

  worker.on('error', (err) => {
    log.error(`Worker error (${name}): ${err.message}`);
  });

  log.info(`Worker created: ${name}`);
  return worker;
}
