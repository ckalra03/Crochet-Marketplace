# Branch 4: Logging Infrastructure

**Branch:** `feature/logging` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 3

## What was built

Three-layer logging system: application logs (Winston), HTTP logs (Morgan), and business audit trail (database).

## Architecture Decisions

- **Winston over Pino:** More mature ecosystem, better Windows compatibility, built-in file rotation.
- **File + Console:** Console for dev with colors, files for production with JSON format.
- **Audit in DB not files:** Business-critical actions (approvals, payouts, disputes) need queryable, structured storage with foreign keys to actors.
- **Request ID tracing:** Every request gets a UUID, propagated through all log entries for correlation.

## Components

### 1. Winston Logger (`apps/api/src/support/logger.ts`)
- Console transport: colored, human-readable (`HH:mm:ss level [module] message`)
- File transports: JSON format, 10MB rotation, 5 files retained
  - `logs/app.log` — all levels
  - `logs/error.log` — errors only
- Module-scoped child loggers: `createModuleLogger('auth')` adds `module` field

### 2. Morgan HTTP Logger (`apps/api/src/middleware/request-logger.ts`)
- Logs: `METHOD /path STATUS content-length - response-time ms`
- Pipes through Winston's `http` module logger

### 3. Request ID (`apps/api/src/middleware/request-id.ts`)
- Reads `X-Request-ID` header or generates UUID v4
- Attached to `req.requestId` for downstream use

### 4. Audit Logger (`apps/api/src/support/audit-logger.ts`)
- Writes to `audit_logs` table
- Fields: userId, action, auditableType, auditableId, oldValues, newValues, ipAddress, userAgent
- Non-blocking: failures logged but don't crash the app
- Used by: seller approval, product approval, order state changes, payout processing, dispute resolution

## Log Output Examples

```
# Console (dev)
18:03:26 info [http] POST /api/v1/auth/login 200 750 - 45 ms
18:03:26 info [auth] User logged in: admin@crochethub.com {"userId":"abc-123"}

# File (JSON)
{"level":"info","message":"User logged in: admin@crochethub.com","module":"auth","userId":"abc-123","service":"crochet-hub-api","timestamp":"2026-03-21 18:03:26.123"}
```
