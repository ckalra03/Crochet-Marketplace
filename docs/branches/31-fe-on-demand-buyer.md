# Branch 31: `feature/fe-on-demand-buyer` -- On-Demand / Custom Order Buyer Flow

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Complete buyer-facing flow for on-demand (custom) crochet requests. Buyers can submit a new custom request through a multi-step wizard, browse their requests with status filters, view request details, and accept or decline seller quotes.

## New Components (`components/on-demand/`)

| Component | File | Purpose |
|-----------|------|---------|
| `RequestFormWizard` | `request-form-wizard.tsx` | 3-step form: Details (description + category), Budget & Timeline (price range + date), Review & Submit. Zod validation per step, uses `useSubmitOnDemandRequest()`, redirects to `/on-demand` on success. |
| `RequestCard` | `request-card.tsx` | Compact list card showing request number, `StatusBadge`, category, budget range (`formatMoney`), date. Links to detail page. |
| `QuoteCard` | `quote-card.tsx` | Displays seller quote with price, estimated days, description, expiry countdown. "Accept & Pay" button (`useAcceptQuote`), "Decline" button with `ConfirmationDialog` (`useRejectQuote`). Shows `StatusBadge` for non-pending quotes. |

## New Pages (`app/(buyer)/on-demand/`)

| Route | File | Purpose |
|-------|------|---------|
| `/on-demand` | `page.tsx` | Lists buyer's on-demand requests using `useOnDemandRequests()`. Status filter tabs (All, Submitted, Quoted, Accepted, Completed). Loading skeletons. Empty state with CTA. |
| `/on-demand/new` | `new/page.tsx` | Hosts `RequestFormWizard` with breadcrumb navigation and page header. |
| `/on-demand/[id]` | `[id]/page.tsx` | Request detail page using `useOnDemandRequest(id)`. Shows description, category, budget, timeline. Renders `QuoteCard` list when status is QUOTED. Shows order link when ACCEPTED. Breadcrumb navigation. |

## Key Design Decisions

- **Multi-step wizard over single form**: Breaking the form into 3 steps reduces cognitive load. Each step is independently validated with Zod before advancing.
- **Budget in rupees, stored in cents**: The form accepts rupee amounts from the user and converts to cents before API submission, matching the backend convention.
- **Inline countdown**: Built a lightweight `useCountdown()` hook inside `QuoteCard` rather than a separate component, since it is only needed in this context.
- **StatusBadge reuse**: Reuses the existing `StatusBadge` component with `type="order"` colour mapping, which covers common statuses (SUBMITTED, QUOTED, ACCEPTED, COMPLETED, CANCELLED).
- **ConfirmationDialog for decline**: Prevents accidental quote rejection by requiring explicit confirmation.

## Hooks Used

- `useOnDemandRequests()` -- fetch all buyer requests
- `useOnDemandRequest(id)` -- fetch single request with quotes
- `useSubmitOnDemandRequest()` -- submit new request mutation
- `useAcceptQuote()` -- accept a seller quote mutation
- `useRejectQuote()` -- reject a seller quote mutation
- `useCategories()` -- populate category dropdown in the form

## Key Files

- `apps/web/src/components/on-demand/request-form-wizard.tsx`
- `apps/web/src/components/on-demand/request-card.tsx`
- `apps/web/src/components/on-demand/quote-card.tsx`
- `apps/web/src/app/(buyer)/on-demand/page.tsx`
- `apps/web/src/app/(buyer)/on-demand/new/page.tsx`
- `apps/web/src/app/(buyer)/on-demand/[id]/page.tsx`
- `apps/web/tests/e2e/on-demand.spec.ts`
