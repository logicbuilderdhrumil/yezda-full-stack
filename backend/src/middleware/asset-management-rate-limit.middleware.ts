/**
 * Asset Management Rate Limiting Middleware
 * Task 1.6: Add rate limiting for asset operations
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { ASSET_SLOS } from '../models/asset-management.model.js';
import { assetMetricsService } from '../services/asset-management-metrics.service.js';

/**
 * In-memory fallback rate limiter for asset operations
 */
class AssetMemoryRateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
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

const memoryLimiter = new AssetMemoryRateLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Rate limiter for asset read operations
 * More lenient for general asset retrieval
 */
export async function assetReadRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `asset:read:${ip}`;

  const windowMs = ASSET_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxRequests = ASSET_SLOS.DEFAULT_READ_RATE_LIMIT_MAX_REQUESTS;

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
      console.error('[Asset RateLimit] Redis error:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn('[Asset RateLimit] Circuit breaker opened');
      }

      result = memoryLimiter.check(key, maxRequests, windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  res.setHeader('RateLimit-Limit', maxRequests);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    assetMetricsService.recordRateLimitHit(req.path);
    res.status(429).json({
      error: 'Too many asset requests, please try again later',
      code: 'ASSET_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter for catalog operations
 * Stricter than individual asset reads
 */
export async function assetCatalogRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `asset:catalog:${ip}`;

  const windowMs = ASSET_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxRequests = ASSET_SLOS.DEFAULT_CATALOG_RATE_LIMIT_MAX_REQUESTS;

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
      console.error('[Asset RateLimit] Redis error:', error);

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
    assetMetricsService.recordRateLimitHit(req.path);
    res.status(429).json({
      error: 'Too many catalog requests, please try again later',
      code: 'ASSET_RATE_LIMITED',
    });
    return;
  }

  next();
}
