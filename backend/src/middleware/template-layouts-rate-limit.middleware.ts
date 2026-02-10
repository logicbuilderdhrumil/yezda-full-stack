/**
 * Template Layouts Rate Limit Middleware
 * Task 1.7: Rate limiting for layout endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { config } from '../config/index.js';
import { auditService } from '../services/audit.service.js';
import { templateLayoutsMetricsService } from '../services/template-layouts-metrics.service.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
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

// Singleton fallback limiter
const memoryLimiter = new MemoryRateLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

// Rate limit configuration for template layout endpoints
const TEMPLATE_LAYOUT_RATE_LIMIT = {
  windowMs: config.rateLimit.windowMs,
  maxRequests: config.rateLimit.maxRequests * 2, // Higher limit for layout endpoints
};

/**
 * Rate limiter for template layout navigation endpoints
 */
export async function templateLayoutNavigationRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:template-layout-nav:${ip}`;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker
  if (redisCircuitOpen && Date.now() > circuitResetAt) {
    redisCircuitOpen = false;
    redisErrorCount = 0;
  }

  if (redisCircuitOpen) {
    result = memoryLimiter.check(key, TEMPLATE_LAYOUT_RATE_LIMIT.maxRequests, TEMPLATE_LAYOUT_RATE_LIMIT.windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    try {
      result = await checkRateLimit(
        key,
        TEMPLATE_LAYOUT_RATE_LIMIT.maxRequests,
        TEMPLATE_LAYOUT_RATE_LIMIT.windowMs
      );
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[TemplateLayoutRateLimit] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
      }

      result = memoryLimiter.check(key, TEMPLATE_LAYOUT_RATE_LIMIT.maxRequests, TEMPLATE_LAYOUT_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set rate limit headers
  res.setHeader('RateLimit-Limit', TEMPLATE_LAYOUT_RATE_LIMIT.maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    // Log anomaly
    auditService.logAnomaly({
      description: 'Excessive template layout requests',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    templateLayoutsMetricsService.recordRateLimitHit(req.path);

    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter for profile summary endpoints (slightly stricter)
 */
export async function templateLayoutProfileRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:template-layout-profile:${ip}`;
  const maxRequests = Math.floor(TEMPLATE_LAYOUT_RATE_LIMIT.maxRequests * 0.75); // Slightly lower limit

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker
  if (redisCircuitOpen && Date.now() > circuitResetAt) {
    redisCircuitOpen = false;
    redisErrorCount = 0;
  }

  if (redisCircuitOpen) {
    result = memoryLimiter.check(key, maxRequests, TEMPLATE_LAYOUT_RATE_LIMIT.windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    try {
      result = await checkRateLimit(key, maxRequests, TEMPLATE_LAYOUT_RATE_LIMIT.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[TemplateLayoutRateLimit] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
      }

      result = memoryLimiter.check(key, maxRequests, TEMPLATE_LAYOUT_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set rate limit headers
  res.setHeader('RateLimit-Limit', maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    auditService.logAnomaly({
      description: 'Excessive profile summary requests',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    templateLayoutsMetricsService.recordRateLimitHit(req.path);

    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
    });
    return;
  }

  next();
}
