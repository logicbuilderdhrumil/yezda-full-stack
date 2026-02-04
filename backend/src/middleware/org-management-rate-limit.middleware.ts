/**
 * Organization Rate Limiting Middleware
 * Task 1.7: Rate limiting for organization list/search endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { config } from '../config/index.js';
import { orgMetricsService } from '../services/org-management-metrics.service.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
 */
class MemoryRateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    this.cleanupInterval.unref();
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

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.windows.clear();
  }
}

const memoryLimiter = new MemoryRateLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/** Rate limit configuration for organization endpoints */
const ORG_RATE_LIMIT = {
  /** Window size in milliseconds */
  windowMs: config.rateLimit.windowMs,
  /** Maximum requests per window for organization list/search */
  maxListRequests: 60, // System admins listing orgs
  /** Maximum requests per window for organization read */
  maxReadRequests: 120,
  /** Maximum requests per window for organization mutations */
  maxMutationRequests: 30,
} as const;

/**
 * Rate limiter for organization list/search endpoints
 * Uses Redis with in-memory fallback
 */
export async function orgListRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:org:list:${ip}`;
  const limit = ORG_RATE_LIMIT.maxListRequests;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker - reset if timeout elapsed
  if (redisCircuitOpen && Date.now() > circuitResetAt) {
    redisCircuitOpen = false;
    redisErrorCount = 0;
  }

  // Use memory fallback if circuit is open
  if (redisCircuitOpen) {
    result = memoryLimiter.check(key, limit, ORG_RATE_LIMIT.windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    try {
      result = await checkRateLimit(key, limit, ORG_RATE_LIMIT.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[OrgRateLimit] Redis error, falling back to memory:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(
          `[OrgRateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`
        );
      }

      result = memoryLimiter.check(key, limit, ORG_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', limit);
  res.setHeader('RateLimit-Remaining', result!.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

  if (!result!.allowed) {
    orgMetricsService.recordRateLimited();

    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'ORG_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter for organization mutation endpoints (create, update)
 */
export async function orgMutationRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:org:mutation:${ip}`;
  const limit = ORG_RATE_LIMIT.maxMutationRequests;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker - reset if timeout elapsed
  if (redisCircuitOpen && Date.now() > circuitResetAt) {
    redisCircuitOpen = false;
    redisErrorCount = 0;
  }

  // Use memory fallback if circuit is open
  if (redisCircuitOpen) {
    result = memoryLimiter.check(key, limit, ORG_RATE_LIMIT.windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    try {
      result = await checkRateLimit(key, limit, ORG_RATE_LIMIT.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[OrgRateLimit] Redis error, falling back to memory:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(
          `[OrgRateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`
        );
      }

      result = memoryLimiter.check(key, limit, ORG_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', limit);
  res.setHeader('RateLimit-Remaining', result!.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

  if (!result!.allowed) {
    orgMetricsService.recordRateLimited();

    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'ORG_RATE_LIMITED',
    });
    return;
  }

  next();
}
