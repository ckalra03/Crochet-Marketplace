# Crochet Hub API

Express.js backend for the Crochet Hub marketplace.

## Setup

```bash
cd apps/api
cp ../../.env.example .env    # Configure DATABASE_URL, JWT secrets
pnpm install
npx prisma db push            # Sync schema to PostgreSQL
npx tsx prisma/seed.ts         # Seed test data
pnpm dev                       # Start on http://localhost:4000
```

## Architecture

```
src/
├── app.ts              # Express app (middleware stack)
├── server.ts           # HTTP server bootstrap
├── config/
│   ├── env.ts          # Zod-validated environment variables
│   └── database.ts     # Prisma client singleton
├── middleware/
│   ├── auth.ts         # JWT authenticate, optionalAuth, requireRole
│   ├── validate.ts     # Zod schema validation
│   ├── error-handler.ts # Global error handler
│   ├── request-id.ts   # UUID per request
│   └── request-logger.ts # Morgan HTTP logging
├── modules/
│   ├── auth/           # JWT service, auth service (register/login/refresh)
│   ├── catalog/        # Product browsing, search, categories
│   ├── cart/           # Cart CRUD with stock validation
│   ├── checkout/       # Order creation, payment processing
│   ├── orders/         # Order lifecycle state machine
│   ├── on-demand/      # Custom request + quote workflow
│   ├── products/       # Seller product CRUD + admin approval
│   ├── fulfillment/    # Warehouse receiving, QC, dispatch
│   ├── returns/        # Return policy matrix engine
│   ├── disputes/       # Dispute resolution
│   ├── ratings/        # Buyer ratings (branch 15)
│   ├── seller-finance/ # Payout calculation engine
│   ├── seller-onboarding/ # Seller registration + admin approval
│   └── notifications/  # Socket.io + email (branch 16)
├── routes/             # Express route definitions
├── support/
│   ├── logger.ts       # Winston logger with module scoping
│   └── audit-logger.ts # DB audit trail writer
└── prisma/
    ├── schema.prisma   # Database schema (26 models)
    └── seed.ts         # Test data seeder
```

## Middleware Stack (order)

1. `requestIdMiddleware` — UUID per request
2. `requestLogger` — Morgan HTTP logging
3. `helmet` — Security headers
4. `cors` — Cross-origin (localhost:3000)
5. `express.json` — Body parsing (10MB limit)
6. Route-specific: `authenticate`, `requireRole`, `validate`
7. `errorHandler` — Global error catching

## Database

- **PostgreSQL 16** via Prisma ORM
- Schema: `apps/api/prisma/schema.prisma`
- All money in integer cents
- Commission rates in basis points
- Audit trail in `audit_logs` table

## Logging

| Layer | Output | Format |
|-------|--------|--------|
| Application | `logs/app.log` | JSON (timestamp, level, module, message, meta) |
| Errors | `logs/error.log` | JSON (errors only) |
| HTTP | via Winston | `METHOD /path STATUS size - time ms` |
| Console | stdout | Colored (dev only) |
| Business | `audit_logs` table | Structured (actor, action, old/new values) |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crochethub.com | admin123456 |
| Buyer | buyer@test.com | buyer123456 |
| Seller | seller@test.com | seller123456 |
