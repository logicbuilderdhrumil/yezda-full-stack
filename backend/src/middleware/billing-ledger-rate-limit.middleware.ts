/**
 * Billing Ledger Rate Limit Middleware
 * Task 1.7: Rate limiting and caching for ledger reporting endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { billingLedgerMetricsService } from '../services/billing-ledger-metrics.service.js';

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
        console.error('[BillingLedger RateLimit] Redis error, falling back to memory:', error);

        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
          console.warn(
            `[BillingLedger RateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`
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
 * Rate limit configuration for billing ledger
 * Task 1.7: Rate limiting configuration
 */
export const billingLedgerRateLimitConfig = {
  ledgerList: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 list requests per minute
  },
  ledgerExport: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 export requests per minute
  },
};

/**
 * Rate limiter for billed ledger list operations
 */
export const billedLedgerRateLimiter = createRateLimiter({
  windowMs: billingLedgerRateLimitConfig.ledgerList.windowMs,
  max: billingLedgerRateLimitConfig.ledgerList.max,
  keyPrefix: 'rl:ledger:billed',
  message: {
    error: 'Too many billed ledger requests, please try again later',
    code: 'LEDGER_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;

    auditService.logAnomaly({
      description: 'Excessive billed ledger list attempts detected',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    billingLedgerMetricsService.recordRateLimitHit('billed_list');
  },
});

/**
 * Rate limiter for unbilled ledger list operations
 */
export const unbilledLedgerRateLimiter = createRateLimiter({
  windowMs: billingLedgerRateLimitConfig.ledgerList.windowMs,
  max: billingLedgerRateLimitConfig.ledgerList.max,
  keyPrefix: 'rl:ledger:unbilled',
  message: {
    error: 'Too many unbilled ledger requests, please try again later',
    code: 'LEDGER_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;

    auditService.logAnomaly({
      description: 'Excessive unbilled ledger list attempts detected',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    billingLedgerMetricsService.recordRateLimitHit('unbilled_list');
  },
});

/**
 * Rate limiter for ledger export operations
 */
export const ledgerExportRateLimiter = createRateLimiter({
  windowMs: billingLedgerRateLimitConfig.ledgerExport.windowMs,
  max: billingLedgerRateLimitConfig.ledgerExport.max,
  keyPrefix: 'rl:ledger:export',
  message: {
    error: 'Too many ledger export requests, please try again later',
    code: 'LEDGER_EXPORT_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;

    auditService.logAnomaly({
      description: 'Excessive ledger export attempts detected',
      channel: 'api',
      ipAddress: ip,
      metadata: {
        endpoint: req.path,
        method: req.method,
      },
    });

    billingLedgerMetricsService.recordRateLimitHit('export');
  },
});

/**
 * Simple in-memory cache for ledger responses
 * Task 1.7: Caching for reporting endpoints
 */
class LedgerCache {
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000) as unknown as NodeJS.Timeout;
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      billingLedgerMetricsService.recordCacheMiss(key);
      return undefined;
    }
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      billingLedgerMetricsService.recordCacheMiss(key);
      return undefined;
    }
    billingLedgerMetricsService.recordCacheHit(key);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

export const ledgerCache = new LedgerCache();
