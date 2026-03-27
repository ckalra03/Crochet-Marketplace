# Branch 46: Redis Integration

## Overview

Adds Redis as an optional caching layer for the Crochet Hub API. The app gracefully degrades when Redis is unavailable — all endpoints continue to work, just without caching.

## What was added

### 1. Redis Client (`apps/api/src/config/redis.ts`)

- Singleton ioredis client configured from `REDIS_URL` environment variable
- Exponential backoff retry strategy (gives up after ~30 seconds)
- Lazy connection — does not block app startup
- Exports `redis` instance and `isRedisAvailable()` helper
- Logs connection events via the existing winston logger

### 2. Cache Middleware (`apps/api/src/middleware/cache.ts`)

- `cacheMiddleware(ttlSeconds)` — Express middleware factory
- Uses the full request URL (with query params) as cache key
- Sets `X-Cache` response header: `HIT`, `MISS`, or `SKIP`
- Intercepts `res.json()` on cache miss to store the response
- Fire-and-forget writes — caching never blocks the response
- Gracefully skips if Redis is unavailable

### 3. Cached Catalog Routes

| Route | TTL |
|-------|-----|
| `GET /catalog/products` | 30 seconds |
| `GET /catalog/products/:slug` | 60 seconds |
| `GET /catalog/categories` | 5 minutes |
| `GET /catalog/categories/:slug/products` | 30 seconds |

### 4. Environment Config

- Added `REDIS_URL` to the Zod env schema (optional, defaults to `redis://localhost:6379`)
- Updated `.env.example` with the new variable

## Dependencies Added

- `ioredis` ^5.10.1

## Files Changed

- `apps/api/src/config/env.ts` — added REDIS_URL to schema
- `apps/api/src/config/redis.ts` — new Redis client singleton
- `apps/api/src/middleware/cache.ts` — new cache middleware
- `apps/api/src/routes/catalog.routes.ts` — applied cache middleware to GET routes
- `apps/api/package.json` — added ioredis dependency
- `.env.example` — added REDIS_URL

## Testing

1. Start Redis locally: `redis-server` (or use Docker: `docker run -d -p 6379:6379 redis`)
2. Start the API: `pnpm dev`
3. Hit any catalog endpoint twice — second request should have `X-Cache: HIT` header
4. Stop Redis — endpoints should still work with `X-Cache: SKIP` header
