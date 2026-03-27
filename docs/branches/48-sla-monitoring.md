# Branch 48: SLA Monitoring, Auto-Penalties & Seller Performance

## Overview

Adds backend services and API routes for SLA breach monitoring, penalty management with auto-penalty generation, and seller performance metrics calculation. Also adds corresponding frontend API functions and React Query hooks.

## Backend Services

### SLA Service (`apps/api/src/modules/sla/sla.service.ts`)

- **getSlaBreaches(params?)** -- Paginated list of SLA breaches with seller info. Filterable by `slaType` and `sellerProfileId`.
- **getSlaDashboard()** -- Summary dashboard: total breaches, breaches grouped by type, top 10 offending sellers by breach count.
- **createSlaRecord(data)** -- Creates an SLA record entry. If `isBreached` is true and the seller has a profile, triggers auto-penalty check.
- **checkAndCreatePenalty(slaRecord)** -- If a seller has more than 3 SLA breaches in the last 30 days, automatically creates an `SLA_BREACH` penalty of 500 cents ($5).

### Penalty Service (`apps/api/src/modules/penalties/penalty.service.ts`)

- **getPenalties(params?)** -- Paginated list of all penalties with seller and creator info. Filterable by `status`.
- **createPenalty(data, adminId)** -- Creates a penalty. Types: `QC_FAILURE`, `SLA_BREACH`, `RETURN_LIABILITY`, `OTHER`.
- **waivePenalty(id, adminId)** -- Changes penalty status to `WAIVED`.
- **getSellerPenalties(sellerProfileId, params?)** -- Seller-scoped paginated penalty list.

### Performance Service (`apps/api/src/modules/performance/performance.service.ts`)

- **calculateMetrics(sellerProfileId)** -- Calculates and upserts metrics: `avgRating` (x100), `totalOrders`, `qcPassRate` (basis points), `onTimeDeliveryRate`, `returnRate`, `disputeRate`, `violationsCount`.
- **getPerformanceMetrics(sellerProfileId)** -- Returns cached metrics (auto-calculates if not yet computed).
- **getAllSellerPerformance(params?)** -- All sellers ranked by performance. Supports sorting and pagination.

## API Routes

### Admin Routes (all under `/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/sla/dashboard` | SLA overview dashboard |
| GET | `/admin/sla/breaches` | Paginated SLA breaches |
| GET | `/admin/penalties` | All penalties (filterable) |
| POST | `/admin/penalties` | Create a penalty |
| POST | `/admin/penalties/:id/waive` | Waive a penalty |
| GET | `/admin/performance/sellers` | Seller performance rankings |

### Seller Routes (all under `/seller`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/seller/performance` | Own performance metrics |
| GET | `/seller/penalties` | Own penalties |
| GET | `/seller/sla/breaches` | Own SLA breaches |

## Frontend

### API Functions

- `apps/web/src/lib/api/admin.ts` -- Added: `getSlaDashboard`, `getSlaBreaches`, `getAdminPenalties`, `createPenalty`, `waivePenalty`, `getSellerPerformance`
- `apps/web/src/lib/api/seller.ts` -- Added: `getSellerPerformance`, `getSellerPenalties`, `getSellerSlaBreaches`

### React Query Hooks

- `apps/web/src/lib/hooks/use-admin.ts` -- Added: `useSlaDashboard`, `useSlaBreaches`, `useAdminPenalties`, `useCreatePenalty`, `useWaivePenalty`, `useAdminSellerPerformance`
- `apps/web/src/lib/hooks/use-seller.ts` -- Added: `useSellerPerformance`, `useSellerPenalties`, `useSellerSlaBreaches`

### Query Keys

- `apps/web/src/lib/api/query-keys.ts` -- Added keys for SLA, penalties, and performance under both `admin` and `seller` namespaces.

## Database Models Used

- `SlaRecord` -- SLA tracking with breach detection
- `SellerPenalty` -- Penalty records with status lifecycle
- `SellerPerformanceMetrics` -- Cached performance scores

## Testing

Playwright E2E tests in `apps/web/tests/e2e/sla-penalties.spec.ts` cover:
- SLA dashboard API
- SLA breaches list API
- Penalties CRUD (list, create, waive)
- Seller performance rankings API
