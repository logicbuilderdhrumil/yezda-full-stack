/**
 * Screening Pipeline Rate Limit Middleware
 * Rate limiting for screening pipeline endpoints
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRoleRequest } from './route-guards.middleware.js';
import { checkRateLimit } from '../db/redis.js';
import { auditService } from '../services/audit.service.js';
import { metricsService } from '../services/metrics.service.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
 */
class MemoryRateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000) as unknown as NodeJS.Timeout;
    this.cleanupInterval!.unref();
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
}

const memoryLimiter = new MemoryRateLimiter();

// Track Redis errors for circuit breaker
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

// Rate limit configuration for screening pipeline endpoints
const SCREENING_PIPELINE_RATE_LIMITS = {
  list: { windowMs: 60000, max: 100 },       // 100 requests per minute for list
  read: { windowMs: 60000, max: 100 },       // 100 reads per minute
  create: { windowMs: 60000, max: 30 },      // 30 creates per minute
  update: { windowMs: 60000, max: 60 },      // 60 updates per minute
  delete: { windowMs: 60000, max: 10 },      // 10 deletes per minute
  assign: { windowMs: 60000, max: 50 },      // 50 assignments per minute
  progress: { windowMs: 60000, max: 100 },   // 100 progress checks per minute
} as const;

/**
 * Factory for creating rate limiting middleware
 */
function createScreeningPipelineRateLimiter(operation: keyof typeof SCREENING_PIPELINE_RATE_LIMITS) {
  const config = SCREENING_PIPELINE_RATE_LIMITS[operation];

  return async (req: AuthenticatedRoleRequest, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const tenantId = req.user?.tenantId || 'unknown';
    const key = `rl:screening-pipeline:${operation}:${tenantId}:${ip}`;

    let result: { allowed: boolean; remaining: number; resetAt: number };

    // Check circuit breaker
    if (redisCircuitOpen) {
      if (Date.now() > circuitResetAt) {
        redisCircuitOpen = false;
        redisErrorCount = 0;
      } else {
        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Try Redis if circuit is closed
    if (!redisCircuitOpen) {
      try {
        result = await checkRateLimit(key, config.max, config.windowMs);
        redisErrorCount = 0;
      } catch (error) {
        redisErrorCount += 1;
        metricsService.recordRedisError('screening_pipeline_rate_limit');

        console.error('[ScreeningPipeline] Rate limit Redis error:', error);

        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        }

        result = memoryLimiter.check(key, config.max, config.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Set rate limit headers
    res.setHeader('RateLimit-Limit', config.max);
    res.setHeader('RateLimit-Remaining', result!.remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

    if (!result!.allowed) {
      // Log rate limit hit
      auditService.logAnomaly({
        description: `Screening pipeline ${operation} rate limit exceeded`,
        channel: 'api',
        ipAddress: ip,
        metadata: {
          operation,
          tenantId,
          endpoint: req.path,
        },
      });

      metricsService.incrementCounter('screening_pipeline_rate_limit_hit', { operation });

      res.status(429).json({
        error: 'Too many requests, please try again later',
        code: 'SCREENING_PIPELINE_RATE_LIMITED',
      });
      return;
    }

    next();
  };
}

// Export rate limiters for different operations
export const screeningPipelineListRateLimiter = createScreeningPipelineRateLimiter('list');
export const screeningPipelineReadRateLimiter = createScreeningPipelineRateLimiter('read');
export const screeningPipelineCreateRateLimiter = createScreeningPipelineRateLimiter('create');
export const screeningPipelineUpdateRateLimiter = createScreeningPipelineRateLimiter('update');
export const screeningPipelineDeleteRateLimiter = createScreeningPipelineRateLimiter('delete');
export const screeningPipelineAssignRateLimiter = createScreeningPipelineRateLimiter('assign');
export const screeningPipelineProgressRateLimiter = createScreeningPipelineRateLimiter('progress');
