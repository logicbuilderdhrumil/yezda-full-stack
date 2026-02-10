/**
 * Theme Rate Limiting Middleware
 * Task 1.6: Add rate limiting for theme operations
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { THEME_SLOS } from '../models/theme.model.js';
import { themeMetricsService } from '../services/theme-metrics.service.js';

/**
 * In-memory fallback rate limiter for theme operations
 */
class ThemeMemoryRateLimiter {
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

const memoryLimiter = new ThemeMemoryRateLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Rate limiter for theme read operations
 * More lenient than write operations
 */
export async function themeReadRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `theme:read:${ip}`;

  const windowMs = THEME_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxRequests = THEME_SLOS.DEFAULT_READ_RATE_LIMIT_MAX_REQUESTS;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker
  if (redisCircuitOpen && Date.now() <= circuitResetAt) {
    result = memoryLimiter.check(key, maxRequests, windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    if (redisCircuitOpen) {
      redisCircuitOpen = false;
      redisErrorCount = 0;
    }

    try {
      result = await checkRateLimit(key, maxRequests, windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[Theme RateLimit] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn('[Theme RateLimit] Circuit breaker opened');
      }

      result = memoryLimiter.check(key, maxRequests, windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  res.setHeader('RateLimit-Limit', maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    themeMetricsService.recordRateLimitHit(req.path);
    res.status(429).json({
      error: 'Too many theme read requests, please try again later',
      code: 'THEME_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter for theme write operations
 * Stricter than read operations
 */
export async function themeWriteRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `theme:write:${ip}`;

  const windowMs = THEME_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxRequests = THEME_SLOS.DEFAULT_WRITE_RATE_LIMIT_MAX_REQUESTS;

  let result: { allowed: boolean; remaining: number; resetAt: number };

  if (redisCircuitOpen && Date.now() <= circuitResetAt) {
    result = memoryLimiter.check(key, maxRequests, windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    if (redisCircuitOpen) {
      redisCircuitOpen = false;
      redisErrorCount = 0;
    }

    try {
      result = await checkRateLimit(key, maxRequests, windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[Theme RateLimit] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
      }

      result = memoryLimiter.check(key, maxRequests, windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  res.setHeader('RateLimit-Limit', maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    themeMetricsService.recordRateLimitHit(req.path);
    res.status(429).json({
      error: 'Too many theme write requests, please try again later',
      code: 'THEME_RATE_LIMITED',
    });
    return;
  }

  next();
}
