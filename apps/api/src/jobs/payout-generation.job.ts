/**
 * Payout Generation Job
 *
 * Triggered manually by an admin via the API.
 * Finds all approved sellers and generates payouts for the given billing cycle.
 *
 * Job data: { cycleStart: string, cycleEnd: string, adminId: string }
 */

import type { Job } from 'bullmq';
import { payoutService } from '../modules/seller-finance/payout.service';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('job:payout-generation');

export interface PayoutGenerationData {
  cycleStart: string;
  cycleEnd: string;
  adminId: string;
}

/**
 * Processor: generate payouts for a billing cycle.
 * Delegates to the existing PayoutService which handles all the logic
 * (finding eligible items, grouping by seller, applying thresholds, etc.).
 */
export async function processPayoutGeneration(job: Job<PayoutGenerationData>) {
  const { cycleStart, cycleEnd, adminId } = job.data;

  log.info(`Starting payout generation for cycle ${cycleStart} — ${cycleEnd}`);

  const result = await payoutService.generatePayoutCycle(adminId, {
    cycleStart,
    cycleEnd,
  });

  log.info(`Payout generation complete: ${result.count} payouts created`);

  return {
    payoutsCreated: result.count,
    cycleStart,
    cycleEnd,
  };
}
