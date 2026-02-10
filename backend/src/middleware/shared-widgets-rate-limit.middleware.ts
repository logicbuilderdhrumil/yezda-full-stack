/**
 * Shared Widgets Rate Limit Middleware
 * Task 1.7: Rate limiting for widget endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { sharedWidgetsMetricsService } from '../services/shared-widgets-metrics.service.js';

/**
 * Shared widgets rate limit configuration
 */
export const sharedWidgetsRateLimitConfig = {
  /** Time window in milliseconds */
  windowMs: 60 * 1000, // 1 minute
  /** Maximum requests per window */
  maxRequests: 100,
  /** Burst limit for short spikes */
  burstLimit: 20,
};

/**
 * In-memory fallback rate limiter
 */
class MemoryRateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000) as unknown as NodeJS.Timeout;
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

/**
 * Rate limiter middleware for shared widget endpoints
 */
export async function sharedWidgetsRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:shared-widgets:${ip}`;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker
  if (redisCircuitOpen && Date.now() < circuitResetAt) {
    result = memoryLimiter.check(key, sharedWidgetsRateLimitConfig.maxRequests, sharedWidgetsRateLimitConfig.windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    if (redisCircuitOpen) {
      redisCircuitOpen = false;
      redisErrorCount = 0;
    }

    try {
      result = await checkRateLimit(
        key,
        sharedWidgetsRateLimitConfig.maxRequests,
        sharedWidgetsRateLimitConfig.windowMs
      );
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount++;
      console.error('[SharedWidgetsRateLimit] Redis error, falling back to memory:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(`[SharedWidgetsRateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`);
      }

      result = memoryLimiter.check(key, sharedWidgetsRateLimitConfig.maxRequests, sharedWidgetsRateLimitConfig.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set rate limit headers
  res.setHeader('RateLimit-Limit', sharedWidgetsRateLimitConfig.maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    // Log throttled request
    auditService.log({
      eventType: 'WIDGET_RATE_LIMITED',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
      success: false,
      errorMessage: 'Rate limit exceeded for widget endpoints',
    });

    sharedWidgetsMetricsService.recordThrottled();

    res.status(429).json({
      error: 'Too many requests to widget endpoints, please try again later',
      code: 'WIDGET_RATE_LIMITED',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
    return;
  }

  next();
}
