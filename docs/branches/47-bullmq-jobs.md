# Branch 47: BullMQ Job Queues

**Date:** 2026-03-27
**Scope:** Backend only (`apps/api`)

## Overview

Adds BullMQ-based background job processing for recurring platform operations. All jobs use the existing Redis connection from `config/redis.ts` and degrade gracefully when Redis is unavailable.

## Job Queues

| Queue | Schedule | Purpose |
|---|---|---|
| `sla-check` | Every 15 min | Detect orders stuck in CONFIRMED (>2d), IN_PRODUCTION (>7d), DISPATCHED (>10d) and create SlaRecord breaches |
| `quote-expiry` | Every hour | Expire PENDING quotes past `validUntil`, expire OnDemandRequests when all quotes are expired |
| `return-window-expiry` | Daily midnight UTC | Move DELIVERED orders past 7-day return window to COMPLETED, mark items payout-eligible |
| `payout-generation` | Manual (admin API) | Generate payout cycles for all approved sellers |

## Files Created

- `apps/api/src/jobs/queue.ts` — Shared queue/worker factory with default job options (retry 3x exponential, auto-cleanup)
- `apps/api/src/jobs/payout-generation.job.ts` — Payout cycle generation processor
- `apps/api/src/jobs/sla-check.job.ts` — SLA breach detection processor
- `apps/api/src/jobs/quote-expiry.job.ts` — Quote and request expiry processor
- `apps/api/src/jobs/return-window-expiry.job.ts` — Return window closure processor
- `apps/api/src/jobs/index.ts` — Job system initializer, exports `initializeJobs()`, `shutdownJobs()`, `getPayoutQueue()`

## Files Modified

- `apps/api/src/server.ts` — Calls `initializeJobs()` on startup (when Redis available), graceful shutdown on SIGTERM/SIGINT
- `apps/api/src/routes/admin.routes.ts` — Added `POST /api/v1/admin/payouts/generate-cycle` route (enqueues job or falls back to sync)

## API Endpoint

**POST** `/api/v1/admin/payouts/generate-cycle`

- **Auth:** Admin only
- **Body:** `{ cycleStart: string, cycleEnd: string }`
- **Response (202):** `{ message, jobId, cycleStart, cycleEnd }` when queued
- **Response (201):** Sync payout result when Redis unavailable (fallback)

## Default Job Options

- `removeOnComplete`: keep last 100
- `removeOnFail`: keep last 50
- `attempts`: 3
- `backoff`: exponential, 1s base delay

## Graceful Degradation

- If Redis is unavailable at startup, job queues are not initialized (warning logged)
- The payout generation admin route falls back to synchronous execution
- SLA checks, quote expiry, and return window expiry simply don't run (they catch up when Redis reconnects)

## Dependencies Added

- `bullmq` ^5.71.1
