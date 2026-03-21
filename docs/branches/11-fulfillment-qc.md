# Branch 11: Fulfillment & QC

**Branch:** `feature/fulfillment-qc` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 1

## What was built

Warehouse receiving, crochet-specific quality check inspection, and dispatch with tracking — per BR-012/BR-013.

## Warehouse Item Lifecycle

```
AWAITING_ARRIVAL → QC_PENDING (admin receives)
QC_PENDING → QC_PASSED (QC pass) / QC_FAILED (QC fail)
QC_PASSED → DISPATCHED (admin dispatches with tracking)
QC_FAILED → RETURNED_TO_SELLER
```

## QC Checklist (Crochet-Specific)

Per BR-013, every item is inspected against:

| Check | Description |
|-------|-------------|
| `looseEnds` | No loose yarn ends visible |
| `finishingConsistency` | Even stitching throughout |
| `correctDimensions` | Matches listed dimensions |
| `colorMatch` | Colors match product listing |
| `stitchQuality` | Stitch tension and pattern are consistent |
| `packagingAdequate` | Properly packaged for shipping |

Stored as `JSONB` in `qc_records.checklist`.

## API Endpoints (Admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | /admin/warehouse | List warehouse items (filter by status) |
| POST | /admin/warehouse/:id/receive | Mark item received → QC_PENDING |
| POST | /admin/warehouse/:id/qc | Submit QC result (PASS/FAIL + checklist + notes) |
| POST | /admin/warehouse/:id/dispatch | Dispatch with tracking number + carrier |

## Audit Trail

Every operation logged: `warehouse.item_received`, `warehouse.qc_pass`, `warehouse.qc_fail`, `warehouse.dispatched`
