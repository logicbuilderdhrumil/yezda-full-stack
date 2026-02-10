/**
 * Candidate Management Rate Limit Middleware
 * Task 1.7: Rate limiting for candidate management endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRoleRequest } from './route-guards.middleware.js';
import { checkRateLimit, cacheGet, cacheSet } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { metricsService } from '../services/metrics.service.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
 */
class MemoryRateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000) as unknown as NodeJS.Timeout;
    this.cleanupInterval!.unref();
  }

  check(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const window = this.windows.get(key);

    if (!window || window.resetAt < now) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    window.count += 1;
    const remaining = Math.max(0, limit - window.count);
    const allowed = window.count <= limit;

    return { allowed, remaining, resetAt: window.resetAt };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows.entries()) {
      if (window.resetAt < now) {
        this.windows.delete(key);
      }
    }
  }
}

/**
 * In-memory fallback cache for when Redis is unavailable
 */
class MemoryCache {
  private cache: Map<string, { value: unknown; expiresAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000) as unknown as NodeJS.Timeout;
    this.cleanupInterval!.unref();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

const memoryLimiter = new MemoryRateLimiter();
const memoryCache = new MemoryCache();

// Track Redis errors for circuit breaker
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

// Rate limit configuration for candidate management
const CANDIDATE_MANAGEMENT_RATE_LIMITS = {
  list: { windowMs: 60000, max: 100 },      // 100 requests per minute for list/search
  create: { windowMs: 60000, max: 30 },     // 30 creates per minute
  update: { windowMs: 60000, max: 60 },     // 60 updates per minute
  delete: { windowMs: 60000, max: 10 },     // 10 deletes per minute
  bulk: { windowMs: 60000, max: 10 },       // 10 bulk creates per minute
  submission: { windowMs: 60000, max: 20 }, // 20 submissions per minute per IP
} as const;

// Cache configuration
const CANDIDATE_CACHE_CONFIG = {
  LIST_TTL_MS: 30000, // 30 seconds cache for list results
} as const;

/**
 * Factory for creating rate limiting middleware
 */
function createCandidateManagementRateLimiter(operation: keyof typeof CANDIDATE_MANAGEMENT_RATE_LIMITS) {
  const config = CANDIDATE_MANAGEMENT_RATE_LIMITS[operation];

  return async (req: AuthenticatedRoleRequest, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    // Get tenantId from authenticated user context (validated by auth middleware)
    const tenantId = req.user?.tenantId || 'unknown';
    const key = `rl:candidate-mgmt:${operation}:${tenantId}:${ip}`;

    let result: { allowed: boolean; remaining: number; resetAt: number };

    // Check circuit breaker
    if (redisCircuitOpen) {
      if (Date.now() > circuitResetAt) {
        redisCircuitOpen = false;
        redisErrorCount = 0;
      } else {
        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Try Redis if circuit is closed
    if (!redisCircuitOpen) {
      try {
        result = await checkRateLimit(key, config.max, config.windowMs);
        redisErrorCount = 0;
      } catch (error) {
        redisErrorCount += 1;
        metricsService.recordRedisError('candidate_management_rate_limit');

        console.error('[CandidateManagement] Rate limit Redis error:', error);

        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        }

        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Set rate limit headers
    res.setHeader('RateLimit-Limit', config.max);
    res.setHeader('RateLimit-Remaining', result!.remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

    if (!result!.allowed) {
      // Log rate limit hit
      auditService.logAnomaly({
        description: `Candidate management ${operation} rate limit exceeded`,
        channel: 'api',
        ipAddress: ip,
        metadata: {
          operation,
          tenantId,
          endpoint: req.path,
        },
      });

      metricsService.incrementCounter('candidate_management_rate_limit_hit', { operation });

      res.status(429).json({
        error: 'Too many requests, please try again later',
        code: 'CANDIDATE_MANAGEMENT_RATE_LIMITED',
      });
      return;
    }

    next();
  };
}

/**
 * Rate limiter for public submission endpoint (no auth required)
 */
function createSubmissionRateLimiter() {
  const config = CANDIDATE_MANAGEMENT_RATE_LIMITS.submission;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const tenantId = req.params.tenantId || 'unknown';
    const key = `rl:candidate-mgmt:submission:${tenantId}:${ip}`;

    let result: { allowed: boolean; remaining: number; resetAt: number };

    // Check circuit breaker
    if (redisCircuitOpen) {
      if (Date.now() > circuitResetAt) {
        redisCircuitOpen = false;
        redisErrorCount = 0;
      } else {
        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Try Redis if circuit is closed
    if (!redisCircuitOpen) {
      try {
        result = await checkRateLimit(key, config.max, config.windowMs);
        redisErrorCount = 0;
      } catch (error) {
        redisErrorCount += 1;
        metricsService.recordRedisError('candidate_submission_rate_limit');

        console.error('[CandidateManagement] Submission rate limit Redis error:', error);

        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        }

        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Set rate limit headers
    res.setHeader('RateLimit-Limit', config.max);
    res.setHeader('RateLimit-Remaining', result!.remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

    if (!result!.allowed) {
      // Log rate limit hit
      auditService.logAnomaly({
        description: 'Candidate submission rate limit exceeded',
        channel: 'api',
        ipAddress: ip,
        metadata: {
          operation: 'submission',
          tenantId,
          endpoint: req.path,
        },
      });

      metricsService.incrementCounter('candidate_management_rate_limit_hit', { operation: 'submission' });

      res.status(429).json({
        error: 'Too many submissions, please try again later',
        code: 'SUBMISSION_RATE_LIMITED',
      });
      return;
    }

    next();
  };
}

/**
 * Cache middleware for candidate list endpoint
 * Task 1.7: Add caching for candidate list/search endpoints
 */
export async function candidateListCacheMiddleware(
  req: AuthenticatedRoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only cache GET requests
  if (req.method !== 'GET') {
    next();
    return;
  }

  const tenantId = req.user?.tenantId || 'unknown';
  const queryString = JSON.stringify(req.query);
  const cacheKey = `cache:candidates:${tenantId}:${Buffer.from(queryString).toString('base64')}`;

  try {
    // Try to get from cache
    let cached: unknown = null;

    if (!redisCircuitOpen) {
      try {
        cached = await cacheGet(cacheKey);
      } catch (error) {
        console.error('[CandidateManagement] Cache get error:', error);
        cached = memoryCache.get(cacheKey);
      }
    } else {
      cached = memoryCache.get(cacheKey);
    }

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.status(200).json(cached);
      return;
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Cache successful responses
      if (res.statusCode === 200) {
        res.setHeader('X-Cache', 'MISS');

        // Store in cache
        if (!redisCircuitOpen) {
          cacheSet(cacheKey, body, CANDIDATE_CACHE_CONFIG.LIST_TTL_MS).catch((err) => {
            console.error('[CandidateManagement] Cache set error:', err);
          });
        }
        memoryCache.set(cacheKey, body, CANDIDATE_CACHE_CONFIG.LIST_TTL_MS);
      }

      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('[CandidateManagement] Cache middleware error:', error);
    next();
  }
}

// Export rate limiters for different operations
export const candidateManagementListRateLimiter = createCandidateManagementRateLimiter('list');
export const candidateManagementCreateRateLimiter = createCandidateManagementRateLimiter('create');
export const candidateManagementUpdateRateLimiter = createCandidateManagementRateLimiter('update');
export const candidateManagementDeleteRateLimiter = createCandidateManagementRateLimiter('delete');
export const candidateManagementBulkRateLimiter = createCandidateManagementRateLimiter('bulk');
export const candidateSubmissionRateLimiter = createSubmissionRateLimiter();
