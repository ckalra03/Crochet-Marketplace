import Redis from 'ioredis';
import { env } from './env';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('redis');

// Create a Redis client singleton using the REDIS_URL from environment.
// The app works fine without Redis — caching is an optional optimization.
const redis = new Redis(env.REDIS_URL, {
  // Retry connecting with exponential backoff, give up after ~30 seconds
  retryStrategy(times) {
    if (times > 10) {
      log.warn('Redis retry limit reached — disabling reconnection');
      return null; // stop retrying
    }
    return Math.min(times * 500, 3000);
  },
  // Don't block app startup waiting for Redis
  lazyConnect: true,
  // Timeout for individual commands (5 seconds)
  commandTimeout: 5000,
  // Don't throw errors when Redis is unavailable
  enableOfflineQueue: false,
});

// Track connection state
let redisConnected = false;

redis.on('connect', () => {
  redisConnected = true;
  log.info('Redis connected');
});

redis.on('error', (err) => {
  redisConnected = false;
  log.warn(`Redis error: ${err.message}`);
});

redis.on('close', () => {
  redisConnected = false;
  log.info('Redis connection closed');
});

// Attempt initial connection (non-blocking)
redis.connect().catch((err) => {
  log.warn(`Redis initial connection failed: ${err.message}`);
});

/**
 * Check if Redis is currently available.
 * Used by cache middleware to gracefully skip caching when Redis is down.
 */
export function isRedisAvailable(): boolean {
  return redisConnected;
}

export { redis };
