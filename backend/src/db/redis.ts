/**
 * Redis Connection
 * Provides Redis client for caching and rate limiting
 */

import Redis from 'ioredis';
import { config } from '../config/index.js';

let redis: Redis | null = null;

/**
 * Get Redis client (singleton)
 */
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }
  return redis;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Check Redis connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getRedis();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

// Rate limiting helpers
const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Check and increment rate limit counter
 * Returns remaining attempts (-1 if exceeded)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const client = getRedis();
  const fullKey = `${RATE_LIMIT_PREFIX}${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use sorted set with timestamp as score for sliding window
  const pipeline = client.pipeline();
  
  // Remove old entries
  pipeline.zremrangebyscore(fullKey, 0, windowStart);
  
  // Count current entries
  pipeline.zcard(fullKey);
  
  // Add new entry
  pipeline.zadd(fullKey, now, `${now}:${Math.random()}`);
  
  // Set TTL
  pipeline.pexpire(fullKey, windowMs);

  const results = await pipeline.exec();
  
  // Get count from zcard result (index 1)
  const count = (results?.[1]?.[1] as number) ?? 0;
  const remaining = Math.max(0, limit - count - 1);
  const allowed = count < limit;

  return {
    allowed,
    remaining,
    resetAt: now + windowMs,
  };
}

/**
 * Clear rate limit for a key
 */
export async function clearRateLimit(key: string): Promise<void> {
  const client = getRedis();
  await client.del(`${RATE_LIMIT_PREFIX}${key}`);
}

// Cache helpers
const CACHE_PREFIX = 'cache:';

/**
 * Get cached value
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  const value = await client.get(`${CACHE_PREFIX}${key}`);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Set cached value with TTL
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlMs: number
): Promise<void> {
  const client = getRedis();
  await client.set(`${CACHE_PREFIX}${key}`, JSON.stringify(value), 'PX', ttlMs);
}

/**
 * Delete cached value
 */
export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  await client.del(`${CACHE_PREFIX}${key}`);
}

// MFA session helpers (transient, stored in Redis)
const MFA_SESSION_PREFIX = 'mfa_session:';
const MFA_SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface MfaSession {
  userId: string;
  userType: 'user' | 'candidate';
  expiresAt: number;
}

/**
 * Store MFA session
 */
export async function storeMfaSession(
  token: string,
  session: MfaSession
): Promise<void> {
  const client = getRedis();
  await client.set(
    `${MFA_SESSION_PREFIX}${token}`,
    JSON.stringify(session),
    'PX',
    MFA_SESSION_TTL_MS
  );
}

/**
 * Get and delete MFA session (one-time use)
 */
export async function consumeMfaSession(token: string): Promise<MfaSession | null> {
  const client = getRedis();
  const key = `${MFA_SESSION_PREFIX}${token}`;
  const value = await client.get(key);
  if (!value) return null;
  
  await client.del(key);
  
  try {
    return JSON.parse(value) as MfaSession;
  } catch {
    return null;
  }
}

export default {
  getRedis,
  closeRedis,
  healthCheck,
  checkRateLimit,
  clearRateLimit,
  cacheGet,
  cacheSet,
  cacheDel,
  storeMfaSession,
  consumeMfaSession,
};
