/**
 * Rate Limiting Middleware
 * Task 1.6: Rate limiting and abuse protection for auth endpoints
 * 
 * Uses Redis for distributed rate limiting across multiple instances.
 * Falls back to in-memory limiting on Redis errors.
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { config } from '../config/index.js';
import { auditService } from '../services/audit.service.js';
import { metricsService } from '../services/metrics.service.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
 * Uses a simple sliding window approach with automatic cleanup
 */
class MemoryRateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
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
      // New window
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

// Track consecutive Redis errors for circuit breaker
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000; // 30 seconds

/**
 * Factory for creating rate limiting middleware with Redis backend
 * Falls back to in-memory limiting on Redis errors with circuit breaker
 */
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message: { error: string; code: string };
  onLimitHit?: (req: Request) => void;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;

    let result: { allowed: boolean; remaining: number; resetAt: number };

    // Check circuit breaker
    if (redisCircuitOpen) {
      if (Date.now() > circuitResetAt) {
        // Try to reset circuit
        redisCircuitOpen = false;
        redisErrorCount = 0;
      } else {
        // Circuit is open, use memory fallback
        result = memoryLimiter.check(key, options.max, options.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Try Redis if circuit is closed
    if (!redisCircuitOpen) {
      try {
        result = await checkRateLimit(key, options.max, options.windowMs);
        // Success - reset error count
        redisErrorCount = 0;
      } catch (error) {
        // Redis error - increment error count
        redisErrorCount += 1;
        metricsService.recordRedisError('rate_limit');
        
        console.error('[RateLimit] Redis error, falling back to memory:', error);
        
        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          // Open circuit breaker
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
          console.warn(`[RateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`);
        }
        
        // Fall back to in-memory rate limiting
        result = memoryLimiter.check(key, options.max, options.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Set standard rate limit headers
    res.setHeader('RateLimit-Limit', options.max);
    res.setHeader('RateLimit-Remaining', result!.remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

    if (!result!.allowed) {
      options.onLimitHit?.(req);
      
      res.status(429).json(options.message);
      return;
    }

    next();
  };
}

/**
 * Standard rate limiter for general API endpoints
 */
export const standardRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  keyPrefix: 'rl:standard',
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxAuthRequests,
  keyPrefix: 'rl:auth',
  message: { error: 'Too many authentication attempts, please try again later', code: 'AUTH_RATE_LIMITED' },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;
    
    // Log anomaly for excessive auth attempts
    auditService.logAnomaly({
      description: 'Excessive authentication attempts detected',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    metricsService.recordRateLimitHit(req.path);
  },
});

/**
 * Stricter rate limiter for password reset
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per 15 minutes
  keyPrefix: 'rl:password-reset',
  message: { error: 'Too many password reset attempts, please try again later', code: 'RESET_RATE_LIMITED' },
});
