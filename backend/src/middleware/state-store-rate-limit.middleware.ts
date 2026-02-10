/**
 * State Store Rate Limiting Middleware
 * Task 1.6: Add rate limiting for state store operations
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { STATE_STORE_SLOS } from '../models/state-store.model.js';
import { stateStoreMetricsService } from '../services/state-store-metrics.service.js';

/**
 * In-memory fallback rate limiter for state store operations
 */
class StateStoreMemoryRateLimiter {
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

const memoryLimiter = new StateStoreMemoryRateLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Rate limiter for state store read operations
 * More lenient than write operations
 */
export async function stateStoreReadRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `state:read:${ip}`;

  const windowMs = STATE_STORE_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxRequests = STATE_STORE_SLOS.DEFAULT_RATE_LIMIT_MAX_REQUESTS * 2; // Double for reads

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
      console.error('[StateStore RateLimit] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn('[StateStore RateLimit] Circuit breaker opened');
      }

      result = memoryLimiter.check(key, maxRequests, windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  res.setHeader('RateLimit-Limit', maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    stateStoreMetricsService.recordRateLimitHit(req.path);
    res.status(429).json({
      error: 'Too many state read requests, please try again later',
      code: 'STATE_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter for state store write operations
 * Stricter than read operations
 */
export async function stateStoreWriteRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `state:write:${ip}`;

  const windowMs = STATE_STORE_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxRequests = STATE_STORE_SLOS.DEFAULT_RATE_LIMIT_MAX_REQUESTS;

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
      console.error('[StateStore RateLimit] Redis error:', error);

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
    stateStoreMetricsService.recordRateLimitHit(req.path);
    res.status(429).json({
      error: 'Too many state write requests, please try again later',
      code: 'STATE_RATE_LIMITED',
    });
    return;
  }

  next();
}
