# Branch 12: On-Demand / Custom Orders

**Branch:** `feature/on-demand` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 1

## What was built

Custom order request workflow: buyer submits requirements, admin issues quotes, buyer accepts/rejects.

## Flow

```
1. Buyer POST /on-demand → submits request (description, category, budget, timeline)
2. Admin sees request in /admin/on-demand-requests
3. Admin POST /admin/on-demand-requests/:id/quote → creates quote with price, timeline, validity
4. Buyer sees quote with countdown timer
5. Buyer POST /on-demand/:id/quotes/:quoteId/accept → quote accepted
   OR /reject → quote rejected (admin may re-quote)
6. If accepted: order created, follows standard order lifecycle
```

## State Machine

```
SUBMITTED → UNDER_REVIEW (admin opens)
UNDER_REVIEW → QUOTED (admin creates quote)
QUOTED → ACCEPTED (buyer accepts) / REJECTED (buyer rejects)
QUOTED → EXPIRED (validity window passes)
ACCEPTED → IN_PRODUCTION → COMPLETED
```

## Quote Validity

- Default: 72 hours (configurable via `validityHours` parameter)
- Expiry checked on accept: returns 400 if past `validUntil`
- Frontend shows countdown timer

## Number Formats

- Request: `ODR-YYYYMMDD-XXXX`
- Quotes linked to requests with `onDemandRequestId` FK

## API Endpoints

| Actor | Method | Path | Purpose |
|-------|--------|------|---------|
| Buyer | POST | /on-demand | Submit request |
| Buyer | GET | /on-demand | List own requests |
| Buyer | GET | /on-demand/:id | Detail with quotes |
| Buyer | POST | /on-demand/:id/quotes/:quoteId/accept | Accept |
| Buyer | POST | /on-demand/:id/quotes/:quoteId/reject | Reject |
| Admin | GET | /admin/on-demand-requests | All requests |
| Admin | POST | /admin/on-demand-requests/:id/quote | Create quote |
