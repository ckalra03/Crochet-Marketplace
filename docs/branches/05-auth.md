# Branch 5: Authentication System

**Branch:** `feature/auth` (merged to `main`)
**Date:** 2026-03-21
**Commits:** 4

## What was built

Complete JWT-based authentication with registration, login, token refresh rotation, RBAC middleware, and profile/address management.

## Architecture Decisions

- **JWT over sessions:** Stateless auth works across decoupled Next.js frontend and Express backend without shared session store.
- **Access + Refresh tokens:** Short-lived access (15min) for security, long-lived refresh (7d) for UX. Refresh rotation revokes old token on each use.
- **bcrypt 12 rounds:** Balance between security and performance. 12 rounds takes ~250ms — good protection against brute force.
- **Rate limiting on auth:** 20 requests / 15 minutes per IP on login/register to prevent credential stuffing.

## Auth Flow

```
1. POST /auth/register → Creates user (BUYER role), returns access + refresh tokens
2. POST /auth/login → Verifies credentials, returns tokens + user profile
3. Request with: Authorization: Bearer <accessToken>
4. POST /auth/refresh → Sends refreshToken, gets new pair (old token revoked)
5. POST /auth/logout → Revokes refresh token
```

## Middleware Stack

| Middleware | Purpose | Usage |
|-----------|---------|-------|
| `authenticate` | Verifies JWT, attaches `req.user` | Protected routes |
| `optionalAuth` | Tries JWT but doesn't fail | Catalog (show personalized data) |
| `requireRole('ADMIN')` | Checks `req.user.role` | Admin routes |
| `validate(schema)` | Zod validation on `req.body` | All mutation routes |
| `errorHandler` | Catches `AppError`, logs unhandled | Global (last middleware) |

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /auth/register | Public | Buyer registration |
| POST | /auth/login | Public | Login |
| POST | /auth/refresh | Public | Rotate tokens |
| POST | /auth/logout | Bearer | Revoke refresh token |
| GET | /profile | Bearer | View profile |
| PUT | /profile | Bearer | Update name/phone |
| GET | /profile/addresses | Bearer | List addresses |
| POST | /profile/addresses | Bearer | Add address |
| PUT | /profile/addresses/:id | Bearer | Update address |
| DELETE | /profile/addresses/:id | Bearer | Delete address |

## Playwright Tests (`apps/web/tests/e2e/auth.spec.ts`)

- Registers new buyer → 201 with tokens
- Rejects duplicate email → 409
- Rejects invalid data → 400 with field errors
- Logs in with correct credentials → 200 with ADMIN role
- Rejects wrong password → 401
- Accesses profile with token → 200
- Rejects profile without token → 401
- Refreshes token → 200 with new pair
