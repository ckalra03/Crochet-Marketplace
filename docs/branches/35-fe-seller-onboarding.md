# Branch 35: `feature/fe-seller-onboarding` -- Seller Registration Wizard

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

A 5-step seller registration wizard that allows authenticated BUYER users to apply for a seller account on Crochet Hub. The wizard collects business information, contact/address details, product categories, bank details, and agreement acceptance before submitting the application via the `useRegisterSeller()` mutation hook.

## Components Created

| Component | File | Purpose |
|-----------|------|---------|
| `RegistrationWizard` | `components/seller/registration-wizard.tsx` | 5-step multi-card wizard with Zod validation per step, progress indicator, and success state |
| Seller Register Page | `app/seller/register/page.tsx` | Client page with auth guards (BUYER only), breadcrumb, and wizard mount |

## Wizard Steps

| Step | Title | Fields |
|------|-------|--------|
| 1 | Business Info | Business name (required), description (textarea) |
| 2 | Contact & Address | Phone, address line 1, city, state, postal code |
| 3 | Categories | Multi-select checkboxes: Amigurumi, Blankets, Bags, Home Decor, Clothing, Accessories, Baby Items |
| 4 | Bank Details | Account holder name, account number, IFSC code, bank name |
| 5 | Agreement | Terms and conditions checkbox (required), quality standards checkbox (required), submit button |

## Technical Details

- **Validation**: Zod schemas per step -- validated on "Next" click before advancing. Errors displayed inline below each field.
- **Auth guards**: Page redirects unauthenticated users to `/login`, existing sellers to `/seller`, and non-BUYER roles to `/`.
- **State management**: Local `useState` for form data; `useRegisterSeller()` React Query mutation for API submission.
- **UI components**: Uses `Card`, `Input`, `Textarea`, `Checkbox`, `Button`, `Label` from `@/components/ui`.
- **Success state**: After successful submission, shows a confirmation card with "Application submitted -- awaiting review".
- **Step indicator**: Visual progress bar with numbered dots, connector lines, and step labels (responsive -- labels hidden on mobile).

## E2E Tests

| Test | File | What It Verifies |
|------|------|------------------|
| Valid buyer registration | `tests/e2e/seller-registration.spec.ts` | POST `/seller/register` returns 201 with PENDING status |
| Non-buyer rejection | `tests/e2e/seller-registration.spec.ts` | Admin user gets 403 when trying to register as seller |
| Duplicate rejection | `tests/e2e/seller-registration.spec.ts` | Second registration by same user returns 400 or 409 |

## Key Files

- `apps/web/src/components/seller/registration-wizard.tsx`
- `apps/web/src/app/seller/register/page.tsx`
- `apps/web/tests/e2e/seller-registration.spec.ts`
