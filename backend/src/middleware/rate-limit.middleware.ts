/**
 * Rate Limiting Middleware
 * Task 1.6: Rate limiting and abuse protection for auth endpoints
 * 
 * Uses Redis for distributed rate limiting across multiple instances.
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { config } from '../config/index.js';
import { auditService } from '../services/audit.service.js';
import { metricsService } from '../services/metrics.service.js';

/**
 * Factory for creating rate limiting middleware with Redis backend
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

    try {
      const result = await checkRateLimit(key, options.max, options.windowMs);

      // Set standard rate limit headers
      res.setHeader('RateLimit-Limit', options.max);
      res.setHeader('RateLimit-Remaining', result.remaining);
      res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));

      if (!result.allowed) {
        options.onLimitHit?.(req);
        
        res.status(429).json(options.message);
        return;
      }

      next();
    } catch (error) {
      // On Redis error, allow the request but log the issue
      console.error('[RateLimit] Redis error, allowing request:', error);
      next();
    }
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
