/**
 * Screening Pipeline Rate Limit Middleware
 * Rate limiting for screening pipeline endpoints.
 * Moved from legacy middleware/ into the module interface layer.
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRoleRequest } from '../../../../shared/infrastructure/middleware/index.js';
import { checkRateLimit } from '../../../../shared/infrastructure/database/index.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
 */
class MemoryRateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  check(
    key: string,
    limit: number,
    windowMs: number,
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
}

const memoryLimiter = new MemoryRateLimiter();

let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

const SCREENING_PIPELINE_RATE_LIMITS = {
  list: { windowMs: 60000, max: 100 },
  read: { windowMs: 60000, max: 100 },
  create: { windowMs: 60000, max: 30 },
  update: { windowMs: 60000, max: 60 },
  delete: { windowMs: 60000, max: 10 },
  assign: { windowMs: 60000, max: 50 },
  progress: { windowMs: 60000, max: 100 },
} as const;

/**
 * Factory for creating rate limiting middleware.
 * Accepts injected audit / metrics services so the middleware stays decoupled.
 */
export function createScreeningPipelineRateLimiter(
  operation: keyof typeof SCREENING_PIPELINE_RATE_LIMITS,
  audit: IAuditService,
  metrics: IMetricsService,
) {
  const config = SCREENING_PIPELINE_RATE_LIMITS[operation];

  return async (req: AuthenticatedRoleRequest, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const tenantId = req.user?.tenantId || 'unknown';
    const key = `rl:screening-pipeline:${operation}:${tenantId}:${ip}`;

    let result: { allowed: boolean; remaining: number; resetAt: number } | undefined;

    if (redisCircuitOpen) {
      if (Date.now() > circuitResetAt) {
        redisCircuitOpen = false;
        redisErrorCount = 0;
      } else {
        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    if (!redisCircuitOpen && !result) {
      try {
        result = await checkRateLimit(key, config.max, config.windowMs);
        redisErrorCount = 0;
      } catch (err) {
        redisErrorCount += 1;
        metrics.recordRedisError('screening_pipeline_rate_limit');
        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        }
        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    res.setHeader('RateLimit-Limit', config.max);
    res.setHeader('RateLimit-Remaining', result!.remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

    if (!result!.allowed) {
      audit.logAnomaly({
        description: `Screening pipeline ${operation} rate limit exceeded`,
        channel: 'api',
        ipAddress: ip,
        metadata: { operation, tenantId, endpoint: req.path },
      });
      metrics.incrementCounter('screening_pipeline_rate_limit_hit', { operation });
      res.status(429).json({
        error: 'Too many requests, please try again later',
        code: 'SCREENING_PIPELINE_RATE_LIMITED',
      });
      return;
    }

    next();
  };
}
