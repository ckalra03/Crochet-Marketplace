# Branch 32: `feature/fe-returns-ratings` -- Returns & Ratings Buyer Flow

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Complete buyer-facing returns and ratings flow: return request submission, return list/detail pages, interactive star rating input, review form, and order item rating page. All pages are `'use client'` components using React Query hooks.

## New Components

### Returns (`components/returns/`)

| Component | File | Purpose |
|-----------|------|---------|
| `ReturnForm` | `return-form.tsx` | Full return submission form with order item selector, reason dropdown, description, evidence file input, policy eligibility callout, and Zod validation |
| `ReturnCard` | `return-card.tsx` | Compact card for return list showing return number, status badge, reason, date; links to detail page |

### Ratings (`components/ratings/`)

| Component | File | Purpose |
|-----------|------|---------|
| `StarRatingInput` | `star-rating-input.tsx` | Interactive 5-star selector with click-to-select, hover preview, keyboard navigation (arrow keys + Enter), accessible `role="radiogroup"` |
| `ReviewForm` | `review-form.tsx` | Combined rating + review form using StarRatingInput and Textarea, submits via `useSubmitRating()`, shows success state after submission |

## New Pages

| Route | File | Purpose |
|-------|------|---------|
| `/returns` | `app/(buyer)/returns/page.tsx` | List of buyer's returns with loading skeletons, empty state, and "New Return" button |
| `/returns/new` | `app/(buyer)/returns/new/page.tsx` | Return submission form; reads `orderId` and `orderItemId` from URL search params |
| `/returns/[returnNumber]` | `app/(buyer)/returns/[returnNumber]/page.tsx` | Return detail with status badge, progress timeline, details, evidence images, and resolution info |
| `/orders/[orderNumber]/rate` | `app/(buyer)/orders/[orderNumber]/rate/page.tsx` | Rate delivered order items; filters to unrated items, renders ReviewForm for each |

## Key Design Decisions

- **Zod validation** on both ReturnForm (orderItemId + reason required) and ReviewForm (score 1-5 required)
- **Policy eligibility callout** in ReturnForm adapts to product type: custom/made-to-order items are only returnable for defect-based reasons
- **Evidence images** use a simple file input storing file names as placeholders (actual upload integration deferred)
- **Return timeline** built dynamically from status; terminal states (REJECTED, CANCELLED) show a two-step timeline
- **StarRatingInput** is a controlled component with full keyboard accessibility using `role="radiogroup"` and `role="radio"` per star
- **ReviewForm** shows inline success state after submission rather than redirecting

## Hooks Used

- `useReturns()` -- fetch buyer's return list
- `useReturn(returnNumber)` -- fetch single return detail
- `useSubmitReturn()` -- mutation to submit a return request
- `useOrder(orderNumber)` -- fetch order detail (for item selection in return form and rating page)
- `useSubmitRating()` -- mutation to submit a rating + review

## Key Files

- `apps/web/src/components/returns/return-form.tsx`
- `apps/web/src/components/returns/return-card.tsx`
- `apps/web/src/components/ratings/star-rating-input.tsx`
- `apps/web/src/components/ratings/review-form.tsx`
- `apps/web/src/app/(buyer)/returns/page.tsx`
- `apps/web/src/app/(buyer)/returns/new/page.tsx`
- `apps/web/src/app/(buyer)/returns/[returnNumber]/page.tsx`
- `apps/web/src/app/(buyer)/orders/[orderNumber]/rate/page.tsx`
- `apps/web/tests/e2e/returns-ratings.spec.ts`
