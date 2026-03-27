# Branch 24: `feature/auth-password-reset` — Forgot / Reset Password

## Overview

Adds forgot-password and reset-password functionality to the auth system, both backend API endpoints and frontend pages.

## Backend Changes

### Prisma Schema

Added two fields to the `User` model:
- `passwordResetToken` (`String?`) — stores a SHA-256 hashed reset token
- `passwordResetExpiry` (`DateTime?`) — 1-hour expiry window

> A database migration is required: `npx prisma migrate dev --name add-password-reset-fields`

### Auth Service (`auth.service.ts`)

Two new methods on `AuthService`:

1. **`forgotPassword(email)`**
   - Looks up user by email
   - Generates a 32-byte random token via `crypto.randomBytes`
   - Stores SHA-256 hash of token + 1h expiry in the User record
   - In development, logs the plain token to console for testing
   - Always returns a generic success message (does not leak user existence)

2. **`resetPassword(token, newPassword)`**
   - Hashes the incoming plain token with SHA-256
   - Finds user where hashed token matches AND expiry is in the future
   - Updates password (bcrypt, 12 rounds) and clears reset token fields
   - Revokes all refresh tokens (forces re-login on all devices)
   - Returns success message

### Auth Routes (`auth.routes.ts`)

- `POST /api/v1/auth/forgot-password` — validates email via `forgotPasswordSchema`, rate-limited to 3/hour/IP
- `POST /api/v1/auth/reset-password` — validates token + password via `resetPasswordSchema`, same rate limit

### Shared Validators

`forgotPasswordSchema` and `resetPasswordSchema` already existed in `@crochet-hub/shared` (from Branch 3). No changes needed.

## Frontend Changes

### API Layer

- Added `forgotPassword()` and `resetPassword()` functions to `lib/api/auth.ts`
- Added `useForgotPassword()` and `useResetPassword()` hooks to `lib/hooks/use-auth.ts`

### Pages

1. **`/forgot-password`** — Email input form, shows success message after submission
2. **`/reset-password?token=...`** — New password + confirm password form, redirects to login on success

Both pages match the existing login page design (split layout with brand panel).

### Login Page

Added a "Forgot password?" link next to the password label.

## E2E Tests

`apps/web/tests/e2e/password-reset.spec.ts`:
- Forgot-password returns success for valid email
- Forgot-password returns success for non-existent email (no info leak)
- Reset-password with invalid token returns 400 error
- Reset-password with missing token returns 400 validation error

## Key Files

- `apps/api/prisma/schema.prisma` (User model updated)
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/routes/auth.routes.ts`
- `apps/web/src/app/forgot-password/page.tsx`
- `apps/web/src/app/reset-password/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/lib/api/auth.ts`
- `apps/web/src/lib/hooks/use-auth.ts`
- `apps/web/tests/e2e/password-reset.spec.ts`
