# Crochet Hub

A managed multi-vendor crochet marketplace where the platform (Super Seller) owns customer-facing responsibility for payments, fulfillment, quality control, and dispute resolution.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express.js (Node.js), TypeScript |
| Database | PostgreSQL 16+ with Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.io |
| Validation | Zod (shared between frontend and backend) |
| Logging | Winston (file + console) + Morgan (HTTP) + DB audit trail |
| Testing | Playwright (E2E) |
| Monorepo | pnpm workspaces + Turborepo |

## Project Structure

```
crochet-hub/
├── apps/
│   ├── api/          # Express.js backend (port 4000)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   └── shared/       # Shared types, constants, validators, utilities
├── docs/
│   └── branches/     # Per-branch documentation
├── CHANGELOG.md      # Full changelog across all branches
├── docker-compose.yml
└── package.json      # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- PostgreSQL 16+
- Git

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/ckalra03/Crochet-Marketplace.git
cd crochet-hub

# 2. Install dependencies
pnpm install

# 3. Start PostgreSQL (Docker or local)
docker compose up -d postgres
# OR ensure PostgreSQL is running locally on port 5432

# 4. Setup environment
cp .env.example .env
cp .env.example apps/api/.env

# 5. Setup database
cd apps/api
npx prisma db push
npx tsx prisma/seed.ts
cd ../..

# 6. Start development
pnpm dev
```

### Default Test Accounts (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crochethub.com | admin123456 |
| Buyer | buyer@test.com | buyer123456 |
| Seller | seller@test.com | seller123456 |

## API Endpoints

All endpoints are prefixed with `/api/v1`. See `docs/branches/` for detailed per-feature documentation.

| Group | Base Path | Auth |
|-------|-----------|------|
| Auth | `/auth/*` | Public (rate limited) |
| Catalog | `/catalog/*` | Public |
| Cart | `/cart/*` | Buyer |
| Checkout | `/checkout/*` | Buyer |
| Orders | `/orders/*` | Buyer |
| On-Demand | `/on-demand/*` | Buyer |
| Returns | `/returns/*` | Buyer |
| Profile | `/profile/*` | Authenticated |
| Seller | `/seller/*` | Seller role |
| Admin | `/admin/*` | Admin role |

## Git Workflow

- **Main branch:** `main` — stable, only receives merges
- **Feature branches:** `feature/<name>` — one per feature
- **Commits:** Micro commits (atomic, descriptive)
- **Merge:** Feature branch → main via `--no-ff` merge

## Logging

- **Console:** Colored dev output (Winston)
- **File:** `logs/app.log` (all levels), `logs/error.log` (errors only)
- **HTTP:** Morgan request logging through Winston
- **Audit:** Business-critical actions logged to `audit_logs` DB table
- **Request Tracing:** UUID per request via `X-Request-ID` header

## Branch Documentation

See [`CHANGELOG.md`](./CHANGELOG.md) for the full history and [`docs/branches/`](./docs/branches/) for detailed per-branch documentation.

## Source Documents

- [`PRD.md`](../PRD.md) — Product Requirements Document
- [`Crochet_Marketplace_BRD.md`](../Crochet_Marketplace_BRD.md) — Business Requirements Document
