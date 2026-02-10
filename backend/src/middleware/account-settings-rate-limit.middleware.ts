/**
 * Account Settings Rate Limit Middleware
 * Task 1.7: Rate limiting for profile updates and integration callbacks
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { accountSettingsMetricsService } from '../services/account-settings-metrics.service.js';

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

const memoryLimiter = new MemoryRateLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Factory for creating rate limiting middleware
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
        console.error('[AccountSettings RateLimit] Redis error, falling back to memory:', error);

        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
          console.warn(
            `[AccountSettings RateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`
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
 * Rate limit configuration for account settings
 */
export const accountSettingsRateLimitConfig = {
  profileUpdate: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 profile updates per minute
  },
  profileRead: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 profile reads per minute
  },
  integrationCallback: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 integration callbacks per minute
  },
  integrationStatus: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 integration status reads per minute
  },
};

/**
 * Rate limiter for profile read operations
 */
export const profileReadRateLimiter = createRateLimiter({
  windowMs: accountSettingsRateLimitConfig.profileRead.windowMs,
  max: accountSettingsRateLimitConfig.profileRead.max,
  keyPrefix: 'rl:account:profile:read',
  message: {
    error: 'Too many profile read requests, please try again later',
    code: 'PROFILE_RATE_LIMITED',
  },
});

/**
 * Rate limiter for profile update operations
 */
export const profileUpdateRateLimiter = createRateLimiter({
  windowMs: accountSettingsRateLimitConfig.profileUpdate.windowMs,
  max: accountSettingsRateLimitConfig.profileUpdate.max,
  keyPrefix: 'rl:account:profile:update',
  message: {
    error: 'Too many profile update requests, please try again later',
    code: 'PROFILE_UPDATE_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;

    auditService.logAnomaly({
      description: 'Excessive profile update attempts detected',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    accountSettingsMetricsService.recordRateLimitHit('profile_update');
  },
});

/**
 * Rate limiter for integration status read operations
 */
export const integrationStatusRateLimiter = createRateLimiter({
  windowMs: accountSettingsRateLimitConfig.integrationStatus.windowMs,
  max: accountSettingsRateLimitConfig.integrationStatus.max,
  keyPrefix: 'rl:account:integration:status',
  message: {
    error: 'Too many integration status requests, please try again later',
    code: 'INTEGRATION_STATUS_RATE_LIMITED',
  },
});

/**
 * Rate limiter for integration verification callbacks
 */
export const integrationCallbackRateLimiter = createRateLimiter({
  windowMs: accountSettingsRateLimitConfig.integrationCallback.windowMs,
  max: accountSettingsRateLimitConfig.integrationCallback.max,
  keyPrefix: 'rl:account:integration:callback',
  message: {
    error: 'Too many integration verification attempts, please try again later',
    code: 'INTEGRATION_CALLBACK_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;

    auditService.logAnomaly({
      description: 'Excessive integration verification attempts detected',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
        provider: req.params.provider,
      },
    });

    accountSettingsMetricsService.recordRateLimitHit('integration_callback');
  },
});
