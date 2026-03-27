import { Request, Response, NextFunction } from 'express';
import { redis, isRedisAvailable } from '../config/redis';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('cache');

/**
 * Cache middleware for GET endpoints.
 * Stores JSON responses in Redis with the given TTL (time-to-live).
 *
 * - On cache HIT: returns cached JSON immediately, sets X-Cache: HIT header
 * - On cache MISS: intercepts res.json(), caches the response, sets X-Cache: MISS
 * - If Redis is unavailable: skips caching entirely (graceful degradation)
 *
 * @param ttlSeconds - How long to cache the response (in seconds)
 */
export function cacheMiddleware(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is down
    if (!isRedisAvailable()) {
      res.setHeader('X-Cache', 'SKIP');
      return next();
    }

    // Use the full original URL (including query params) as the cache key
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Check if we have a cached response
      const cached = await redis.get(cacheKey);

      if (cached) {
        // Cache HIT — return the stored JSON
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cached);
      }
    } catch (err) {
      // Redis read failed — continue without cache
      log.warn(`Cache read error for ${cacheKey}: ${(err as Error).message}`);
    }

    // Cache MISS — intercept res.json() to capture and store the response
    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Store the response in Redis (fire-and-forget, don't block the response)
      try {
        const serialized = JSON.stringify(body);
        redis.set(cacheKey, serialized, 'EX', ttlSeconds).catch((err) => {
          log.warn(`Cache write error for ${cacheKey}: ${err.message}`);
        });
      } catch (err) {
        log.warn(`Cache serialization error: ${(err as Error).message}`);
      }

      // Send the original response
      return originalJson(body);
    };

    next();
  };
}
