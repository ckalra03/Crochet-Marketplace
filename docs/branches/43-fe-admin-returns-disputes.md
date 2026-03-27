# Branch 43: `feature/fe-admin-returns-disputes` -- Admin Returns + Disputes

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Admin-facing returns management and disputes management pages with supporting components. All pages use `'use client'` components, React Query hooks from `use-admin.ts`, and reusable components (DataTable, StatusBadge, EvidenceGallery, Breadcrumb).

## New Components

| Component | File | Purpose |
|-----------|------|---------|
| `EvidenceGallery` | `components/admin/evidence-gallery.tsx` | Grid of evidence images with lightbox dialog on click. Handles empty state with placeholder icon. Accepts `images: string[]` prop. |
| `ResolutionForm` | `components/admin/resolution-form.tsx` | Dispute resolution form with required summary textarea. Uses `useResolveDispute()` mutation. Toast feedback on success/error. |
| `ReturnReviewForm` | `components/admin/return-review-form.tsx` | Return review form with resolution type radio (FULL_REFUND, PARTIAL_REFUND, REPLACEMENT, REJECTED), optional refund amount input (INR to cents conversion), admin notes textarea. Uses `useReviewReturn()` mutation. |

## Updated Components

| Component | File | Change |
|-----------|------|--------|
| `StatusBadge` | `components/feedback/status-badge.tsx` | Added `UNDER_REVIEW` to return colors, added `INVESTIGATING` to dispute colors. |

## New Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin/returns` | `app/admin/returns/page.tsx` | DataTable with columns (Return Number, Order Number, Buyer, Reason, Status, Date, Actions), status filter tabs (All, Requested, Approved, Rejected, Received, Refunded, Cancelled), search by return number. |
| `/admin/returns/[id]` | `app/admin/returns/[id]/page.tsx` | Return detail with breadcrumb, return info, order/item info, evidence gallery, ReturnReviewForm (for REQUESTED/UNDER_REVIEW), resolution info (for resolved returns). |
| `/admin/disputes` | `app/admin/disputes/page.tsx` | DataTable with columns (Dispute Number, Order Number, Type, Status, Raised By, Date, Actions), status filter tabs (All, Open, Investigating, Resolved, Closed). |
| `/admin/disputes/[id]` | `app/admin/disputes/[id]/page.tsx` | Dispute detail with breadcrumb, dispute info, raised by (buyer), against seller (if applicable), evidence gallery, ResolutionForm (for OPEN/INVESTIGATING), resolution summary (if resolved). |

## Hooks Used (from `use-admin.ts`)

| Hook | Purpose |
|------|---------|
| `useAdminReturns(params?)` | Fetch return requests list |
| `useReviewReturn()` | Mutation to review/decide on a return |
| `useAdminDisputes(params?)` | Fetch disputes list |
| `useResolveDispute()` | Mutation to resolve a dispute |

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/returns` | List returns with optional status filter |
| POST | `/admin/returns/:id/review` | Submit return review decision |
| GET | `/admin/disputes` | List disputes with optional status filter |
| POST | `/admin/disputes/:id/resolve` | Resolve a dispute |

## Testing

E2E tests in `apps/web/tests/e2e/admin-returns-disputes.spec.ts`:
- Admin returns list API
- Admin disputes list API
- Review return API
- Resolve dispute API
