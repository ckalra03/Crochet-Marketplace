# Branch 25: `feature/backend-gaps` — Backend Gaps

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Addressed several missing backend features: response compression, on-demand seller assignment, return refund initiation, and soft-delete middleware via Prisma Client Extensions.

## Changes

### 1. Compression Middleware

Added `compression` middleware to `app.ts` after CORS but before body parsing. This enables gzip/deflate compression on all HTTP responses.

> **Install required:** `pnpm add compression @types/compression` (in `apps/api`)

### 2. Assign Seller to On-Demand Request

New `OnDemandService.assignSeller(requestId, sellerProfileId, adminId)` method:
- Validates the request exists and is in `UNDER_REVIEW` or `QUOTED` status
- Validates the seller profile exists and is `APPROVED`
- Updates any unassigned quotes for the request with the seller
- Logs via audit logger with action `on_demand.seller_assigned`

New admin route: `POST /api/v1/admin/on-demand-requests/:id/assign-seller`
- Body: `{ sellerProfileId: string (uuid) }`

### 3. Return Refund Initiation

New `ReturnService.initiateRefund(returnId, refundReference, adminId)` method:
- Validates the return is in `APPROVED` status
- Updates return status to `REFUND_INITIATED`
- Stores refund reference in `adminNotes` field (appended)
- Logs via audit logger with action `return.refund_initiated`

New admin route: `POST /api/v1/admin/returns/:id/initiate-refund`
- Body: `{ refundReference: string }`

### 4. Soft-Delete Prisma Extension

Created `middleware/soft-delete.ts` using Prisma Client Extensions (replaces the removed `$use()` API):
- **Models covered:** `User`, `Product` (both have `deletedAt DateTime?` in schema)
- `findMany` / `findFirst` / `findUnique` automatically add `deletedAt: null` filter unless the caller explicitly provides a `deletedAt` filter
- Applied to the Prisma client in `config/database.ts`

## Key Files

- `apps/api/src/app.ts` — compression middleware added
- `apps/api/src/modules/on-demand/on-demand.service.ts` — `assignSeller` method
- `apps/api/src/modules/returns/return.service.ts` — `initiateRefund` method
- `apps/api/src/routes/admin.routes.ts` — two new admin routes
- `apps/api/src/middleware/soft-delete.ts` — Prisma soft-delete extension
- `apps/api/src/config/database.ts` — applies soft-delete extension
