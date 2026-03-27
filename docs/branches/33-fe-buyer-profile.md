# Branch 33: `feature/fe-buyer-profile` -- Buyer Profile & Account Pages

**Date:** 2026-03-26 | **Commits:** 1

## What Was Built

Complete buyer profile and account management pages: personal info editing, saved address CRUD, and password change. All presented in a tabbed `'use client'` page using React Query hooks and Zod validation.

## New Components

### Profile (`components/profile/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PersonalInfoForm` | `personal-info-form.tsx` | Displays name, email (readonly), phone with edit mode toggle; validates via Zod; saves with `useUpdateProfile()` mutation; toast on success |
| `AddressManager` | `address-manager.tsx` | Lists saved addresses with label, full address, and "Default" badge; Add/Edit via dialog with Zod-validated form; Delete with confirmation dialog; Set as Default action |
| `PasswordChangeForm` | `password-change-form.tsx` | Current password, new password, confirm password fields; Zod validation (min 8 chars, match check); submits to `PUT /profile/password` via api client; clears form on success |

## New Pages

| Route | File | Purpose |
|-------|------|---------|
| `/profile` | `app/(buyer)/profile/page.tsx` | Tabbed account page with three tabs: Personal Info, Addresses, Change Password |

## Key Design Decisions

- **Edit mode toggle** on PersonalInfoForm avoids accidental edits; fields switch between read-only display and input mode
- **Email is always read-only** with a helper note -- email changes are handled via backend workflows
- **Address dialog** reused for both Add and Edit operations via `editingId` state
- **Delete confirmation** uses a separate Dialog rather than browser `confirm()` for consistent UX
- **Set as Default** sends `{ isDefault: true }` via `useUpdateAddress()` -- backend handles unsetting the previous default
- **Password change** uses the api client directly (`api.put`) since there is no dedicated hook for this endpoint
- **Zod validation** on all forms: profile (name 2-100 chars, phone regex), addresses (required fields + postal code format), password (min 8 chars + match)

## Hooks Used

- `useProfile()` -- fetch current user's profile (name, email, phone)
- `useUpdateProfile()` -- mutation to update name/phone
- `useAddresses()` -- fetch saved address list
- `useAddAddress()` -- mutation to add a new address
- `useUpdateAddress()` -- mutation to edit or set default on an address
- `useDeleteAddress()` -- mutation to delete an address

## Key Files

- `apps/web/src/components/profile/personal-info-form.tsx`
- `apps/web/src/components/profile/address-manager.tsx`
- `apps/web/src/components/profile/password-change-form.tsx`
- `apps/web/src/app/(buyer)/profile/page.tsx`
