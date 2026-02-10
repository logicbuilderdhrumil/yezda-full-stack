/**
 * UI Kit Rate Limiting Middleware
 * Task 1.6: Rate limiting for UI configuration endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { metricsService, UI_KIT_METRICS } from '../services/metrics.service.js';

/**
 * In-memory fallback rate limiter for UI kit endpoints
 */
class UIKitRateLimiter {
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

const memoryLimiter = new UIKitRateLimiter();

// Rate limit configuration for UI kit endpoints
const UI_KIT_RATE_LIMIT = {
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
 * Rate limiter middleware for UI kit endpoints
 * Task 1.6: Applies rate limiting with Redis backend and memory fallback
 */
export async function uiKitRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:ui-kit:${ip}`;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker
  if (redisCircuitOpen) {
    if (Date.now() > circuitResetAt) {
      redisCircuitOpen = false;
      redisErrorCount = 0;
    } else {
      result = memoryLimiter.check(key, UI_KIT_RATE_LIMIT.maxRequests, UI_KIT_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Try Redis if circuit is closed
  if (!redisCircuitOpen) {
    try {
      result = await checkRateLimit(key, UI_KIT_RATE_LIMIT.maxRequests, UI_KIT_RATE_LIMIT.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[UIKitRateLimiter] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(`[UIKitRateLimiter] Circuit breaker opened`);
      }

      result = memoryLimiter.check(key, UI_KIT_RATE_LIMIT.maxRequests, UI_KIT_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', UI_KIT_RATE_LIMIT.maxRequests);
  res.setHeader('RateLimit-Remaining', result!.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

  if (!result!.allowed) {
    // Log excessive UI kit requests
    auditService.logAnomaly({
      description: 'Excessive UI kit configuration requests',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    metricsService.incrementCounter(UI_KIT_METRICS.RATE_LIMIT_HIT, { endpoint: 'ui-kit' });

    res.status(429).json({
      error: 'Too many UI configuration requests, please try again later',
      code: 'UI_KIT_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Configuration for UI kit rate limits
 */
export const uiKitRateLimitConfig = {
  config: UI_KIT_RATE_LIMIT,
};
