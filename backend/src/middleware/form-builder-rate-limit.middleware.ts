/**
 * Form Builder Rate Limiting Middleware
 * Task 1.6: Rate limiting for form builder endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { metricsService, FORM_BUILDER_METRICS } from '../services/metrics.service.js';

/**
 * In-memory fallback rate limiter for form builder endpoints
 */
class FormBuilderRateLimiter {
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

const memoryLimiter = new FormBuilderRateLimiter();

// Rate limit configuration for form builder endpoints
const FORM_BUILDER_RATE_LIMIT = {
  // Read operations (list, get)
  read: {
    windowMs: 60000, // 1 minute
    maxRequests: 120, // 120 requests per minute per IP
  },
  // Write operations (create, update, delete)
  write: {
    windowMs: 60000, // 1 minute
    maxRequests: 30, // 30 requests per minute per IP
  },
};

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Rate limiter middleware for form builder read operations
 * Task 1.6: Applies rate limiting with Redis backend and memory fallback
 */
export async function formBuilderReadRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:form-builder:read:${ip}`;
  const config = FORM_BUILDER_RATE_LIMIT.read;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker
  if (redisCircuitOpen) {
    if (Date.now() > circuitResetAt) {
      redisCircuitOpen = false;
      redisErrorCount = 0;
    } else {
      result = memoryLimiter.check(key, config.maxRequests, config.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Try Redis if circuit is closed
  if (!redisCircuitOpen) {
    try {
      result = await checkRateLimit(key, config.maxRequests, config.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[FormBuilderRateLimiter] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(`[FormBuilderRateLimiter] Circuit breaker opened`);
      }

      result = memoryLimiter.check(key, config.maxRequests, config.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', config.maxRequests);
  res.setHeader('RateLimit-Remaining', result!.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

  if (!result!.allowed) {
    // Log excessive form builder requests
    auditService.logAnomaly({
      description: 'Excessive form builder read requests',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    metricsService.incrementCounter(FORM_BUILDER_METRICS.RATE_LIMIT_HIT, { endpoint: 'form-builder-read' });

    res.status(429).json({
      error: 'Too many form requests, please try again later',
      code: 'FORM_BUILDER_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter middleware for form builder write operations
 * Task 1.6: Applies stricter rate limiting for mutations
 */
export async function formBuilderWriteRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:form-builder:write:${ip}`;
  const config = FORM_BUILDER_RATE_LIMIT.write;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker
  if (redisCircuitOpen) {
    if (Date.now() > circuitResetAt) {
      redisCircuitOpen = false;
      redisErrorCount = 0;
    } else {
      result = memoryLimiter.check(key, config.maxRequests, config.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Try Redis if circuit is closed
  if (!redisCircuitOpen) {
    try {
      result = await checkRateLimit(key, config.maxRequests, config.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[FormBuilderRateLimiter] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(`[FormBuilderRateLimiter] Circuit breaker opened`);
      }

      result = memoryLimiter.check(key, config.maxRequests, config.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', config.maxRequests);
  res.setHeader('RateLimit-Remaining', result!.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

  if (!result!.allowed) {
    // Log excessive form builder requests
    auditService.logAnomaly({
      description: 'Excessive form builder write requests',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    metricsService.incrementCounter(FORM_BUILDER_METRICS.RATE_LIMIT_HIT, { endpoint: 'form-builder-write' });

    res.status(429).json({
      error: 'Too many form modification requests, please try again later',
      code: 'FORM_BUILDER_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Configuration for form builder rate limits
 */
export const formBuilderRateLimitConfig = {
  read: FORM_BUILDER_RATE_LIMIT.read,
  write: FORM_BUILDER_RATE_LIMIT.write,
};
