/**
 * OAuth Rate Limiting Middleware
 * Task 1.7: Rate limiting for OAuth callbacks and token refresh endpoints
 *
 * Uses Redis for distributed rate limiting with in-memory fallback.
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { config } from '../config/index.js';
import { auditService } from '../services/audit.service.js';
import { metricsService, OAUTH_METRICS } from '../services/metrics.service.js';

/**
 * In-memory fallback rate limiter (same pattern as rate-limit.middleware.ts)
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

let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Create OAuth rate limiter middleware
 */
function createOAuthRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message: { error: string; code: string };
  onLimitHit?: (req: Request) => void;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const provider = req.params.provider || 'unknown';
    const key = `${options.keyPrefix}:${provider}:${ip}`;

    let result: { allowed: boolean; remaining: number; resetAt: number };

    // Check circuit breaker
    if (redisCircuitOpen) {
      if (Date.now() > circuitResetAt) {
        redisCircuitOpen = false;
        redisErrorCount = 0;
      } else {
        result = memoryLimiter.check(key, options.max, options.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Try Redis if circuit is closed
    if (!redisCircuitOpen) {
      try {
        result = await checkRateLimit(key, options.max, options.windowMs);
        redisErrorCount = 0;
      } catch (error) {
        redisErrorCount += 1;
        metricsService.recordRedisError('oauth_rate_limit');

        console.error('[OAuthRateLimit] Redis error, falling back to memory:', error);

        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
          console.warn(
            `[OAuthRateLimit] Circuit breaker opened, will retry at ${new Date(
              circuitResetAt
            ).toISOString()}`
          );
        }

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
 * Rate limiter for general OAuth endpoints (authorize, status, disconnect)
 */
export const oauthRateLimiter = createOAuthRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxOAuthRequests,
  keyPrefix: 'rl:oauth',
  message: {
    error: 'Too many OAuth requests, please try again later',
    code: 'OAUTH_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;
    const provider = req.params.provider || 'unknown';

    auditService.logAnomaly({
      description: 'OAuth endpoint rate limit exceeded',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        provider,
        endpoint: req.path,
        method: req.method,
      },
    });

    metricsService.incrementCounter(OAUTH_METRICS.CALLBACK_FAILURE, {
      provider,
      reason: 'rate_limited',
    });
  },
});

/**
 * Stricter rate limiter for OAuth callbacks
 * More restrictive to prevent callback abuse attacks
 */
export const oauthCallbackRateLimiter = createOAuthRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: Math.ceil(config.rateLimit.maxOAuthRequests / 2), // Stricter limit for callbacks
  keyPrefix: 'rl:oauth-callback',
  message: {
    error: 'Too many OAuth callback attempts, please try again later',
    code: 'OAUTH_CALLBACK_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;
    const provider = req.params.provider || 'unknown';

    auditService.logAnomaly({
      description: 'OAuth callback rate limit exceeded - potential abuse',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        provider,
        endpoint: req.path,
      },
    });

    metricsService.incrementCounter(OAUTH_METRICS.INVALID_STATE, {
      provider,
      reason: 'rate_limited',
    });
  },
});

/**
 * Rate limiter for token refresh operations
 */
export const oauthRefreshRateLimiter = createOAuthRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 refresh attempts per 5 minutes
  keyPrefix: 'rl:oauth-refresh',
  message: {
    error: 'Too many token refresh attempts, please try again later',
    code: 'OAUTH_REFRESH_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;
    const provider = req.params.provider || 'unknown';

    auditService.logAnomaly({
      description: 'OAuth token refresh rate limit exceeded',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        provider,
        endpoint: req.path,
      },
    });

    metricsService.incrementCounter(OAUTH_METRICS.TOKEN_REFRESH_FAILURE, {
      provider,
      reason: 'rate_limited',
    });
  },
});
