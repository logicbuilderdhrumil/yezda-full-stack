/**
 * Custom Components Rate Limiting Middleware
 * Task 1.7: Rate limiting for preference update endpoints (10 req/min)
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { config } from '../config/index.js';
import { customComponentsMetricsService } from '../services/custom-components-metrics.service.js';

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

/** Rate limit configuration for custom component endpoints */
const CUSTOM_COMPONENTS_RATE_LIMIT = {
  /** Window size in milliseconds */
  windowMs: config.rateLimit.windowMs,
  /** Maximum read requests per window */
  maxReadRequests: 60,
  /** Maximum update requests per window (10 per minute per spec) */
  maxUpdateRequests: 10,
} as const;

/**
 * Apply rate limiting with Redis + in-memory fallback
 */
async function applyRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
  keyPrefix: string,
  limit: number
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:components:${keyPrefix}:${ip}`;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker - reset if timeout elapsed
  if (redisCircuitOpen && Date.now() > circuitResetAt) {
    redisCircuitOpen = false;
    redisErrorCount = 0;
  }

  // Use memory fallback if circuit is open
  if (redisCircuitOpen) {
    result = memoryLimiter.check(key, limit, CUSTOM_COMPONENTS_RATE_LIMIT.windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    try {
      result = await checkRateLimit(key, limit, CUSTOM_COMPONENTS_RATE_LIMIT.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[ComponentsRateLimit] Redis error, falling back to memory:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(
          `[ComponentsRateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`
        );
      }

      result = memoryLimiter.check(key, limit, CUSTOM_COMPONENTS_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', limit);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    customComponentsMetricsService.recordRateLimited();

    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'COMPONENT_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter for component read endpoints (organizations list, theme get)
 */
export async function componentsReadRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await applyRateLimit(req, res, next, 'read', CUSTOM_COMPONENTS_RATE_LIMIT.maxReadRequests);
}

/**
 * Rate limiter for component update endpoints (active org switch, theme update)
 * Task 1.7: 10 requests per minute
 */
export async function componentsUpdateRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await applyRateLimit(req, res, next, 'update', CUSTOM_COMPONENTS_RATE_LIMIT.maxUpdateRequests);
}
