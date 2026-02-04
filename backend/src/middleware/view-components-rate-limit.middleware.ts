/**
 * View Components Rate Limiting Middleware
 * Task 1.6: Rate limiting for view component endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { metricsService, VIEW_COMPONENTS_METRICS } from '../services/metrics.service.js';

/**
 * In-memory fallback rate limiter for view component endpoints
 * Bounded to prevent memory exhaustion
 */
const MAX_RATE_LIMIT_ENTRIES = 10000;

class ViewComponentsRateLimiter {
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
      // Enforce maximum entries to prevent unbounded growth
      if (this.windows.size >= MAX_RATE_LIMIT_ENTRIES) {
        this.cleanup();
        // If still at max after cleanup, evict oldest entries
        if (this.windows.size >= MAX_RATE_LIMIT_ENTRIES) {
          const entriesToRemove = Math.floor(MAX_RATE_LIMIT_ENTRIES * 0.1);
          const iterator = this.windows.keys();
          for (let i = 0; i < entriesToRemove; i++) {
            const keyToRemove = iterator.next().value;
            if (keyToRemove) this.windows.delete(keyToRemove);
          }
        }
      }
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

const memoryLimiter = new ViewComponentsRateLimiter();

// Rate limit configuration for view component endpoints
const VIEW_COMPONENTS_RATE_LIMIT = {
  windowMs: 60000, // 1 minute
  maxRequests: 120, // 120 requests per minute per IP
};

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Rate limiter middleware for view component endpoints
 * Task 1.6: Applies rate limiting with Redis backend and memory fallback
 */
export async function viewComponentsRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:view-components:${ip}`;

  // Initialize with memory fallback default to avoid non-null assertion
  let result: { allowed: boolean; remaining: number; resetAt: number } = memoryLimiter.check(
    key,
    VIEW_COMPONENTS_RATE_LIMIT.maxRequests,
    VIEW_COMPONENTS_RATE_LIMIT.windowMs
  );

  // Check circuit breaker
  if (redisCircuitOpen) {
    if (Date.now() > circuitResetAt) {
      redisCircuitOpen = false;
      redisErrorCount = 0;
    } else {
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Try Redis if circuit is closed
  if (!redisCircuitOpen) {
    try {
      result = await checkRateLimit(key, VIEW_COMPONENTS_RATE_LIMIT.maxRequests, VIEW_COMPONENTS_RATE_LIMIT.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[ViewComponentsRateLimiter] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(`[ViewComponentsRateLimiter] Circuit breaker opened`);
      }

      result = memoryLimiter.check(key, VIEW_COMPONENTS_RATE_LIMIT.maxRequests, VIEW_COMPONENTS_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', VIEW_COMPONENTS_RATE_LIMIT.maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    // Log excessive view component requests
    auditService.logAnomaly({
      description: 'Excessive view component requests',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    metricsService.incrementCounter(VIEW_COMPONENTS_METRICS.RATE_LIMIT_HIT, { endpoint: 'view-components' });

    res.status(429).json({
      error: 'Too many view component requests, please try again later',
      code: 'VIEW_COMPONENTS_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Configuration for view component rate limits
 */
export const viewComponentsRateLimitConfig = {
  config: VIEW_COMPONENTS_RATE_LIMIT,
};
