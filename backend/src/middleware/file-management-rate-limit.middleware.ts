/**
 * File Management Rate Limiting Middleware
 * Task 1.8: Rate limiting for file endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { fileStorageConfig } from '../config/file-storage.config.js';
import { auditService } from '../services/audit.service.js';
import { fileMetricsService } from '../services/file-management-metrics.service.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
 */
class MemoryFileLimiter {
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

const memoryLimiter = new MemoryFileLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/**
 * Factory for creating file rate limiting middleware
 */
function createFileRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message: { error: string; code: string };
  onLimitHit?: (req: Request) => void;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) || 'unknown';
    const key = `${options.keyPrefix}:${tenantId}:${ip}`;

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
        console.error('[FileRateLimit] Redis error, falling back to memory:', error);

        if (redisErrorCount >= CIRCUIT_THRESHOLD) {
          redisCircuitOpen = true;
          circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
          console.warn(
            `[FileRateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`
          );
        }

        result = memoryLimiter.check(key, options.max, options.windowMs);
        res.setHeader('X-RateLimit-Fallback', 'memory');
      }
    }

    // Set rate limit headers
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
 * Rate limiter for file upload endpoints
 */
export const fileUploadRateLimiter = createFileRateLimiter({
  windowMs: fileStorageConfig.rateLimit.windowMs,
  max: fileStorageConfig.rateLimit.maxUploads,
  keyPrefix: 'rl:file-upload',
  message: {
    error: 'Too many upload attempts, please try again later',
    code: 'FILE_UPLOAD_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;
    const tenantId = req.headers['x-tenant-id'] as string;

    auditService.log({
      eventType: 'FILE_RATE_LIMITED' as any,
      channel: 'api',
      ipAddress: ip,
      metadata: {
        tenantId,
        endpoint: req.path,
        method: req.method,
        type: 'upload',
      },
      success: false,
    });

    fileMetricsService.recordRateLimitHit(req.path, tenantId);
  },
});

/**
 * Rate limiter for file download endpoints
 */
export const fileDownloadRateLimiter = createFileRateLimiter({
  windowMs: fileStorageConfig.rateLimit.windowMs,
  max: fileStorageConfig.rateLimit.maxDownloads,
  keyPrefix: 'rl:file-download',
  message: {
    error: 'Too many download attempts, please try again later',
    code: 'FILE_DOWNLOAD_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const ip = req.ip || req.socket.remoteAddress;
    const tenantId = req.headers['x-tenant-id'] as string;

    auditService.log({
      eventType: 'FILE_RATE_LIMITED' as any,
      channel: 'api',
      ipAddress: ip,
      metadata: {
        tenantId,
        endpoint: req.path,
        method: req.method,
        type: 'download',
      },
      success: false,
    });

    fileMetricsService.recordRateLimitHit(req.path, tenantId);
  },
});

/**
 * Rate limiter for file metadata endpoints
 */
export const fileMetadataRateLimiter = createFileRateLimiter({
  windowMs: fileStorageConfig.rateLimit.windowMs,
  max: fileStorageConfig.rateLimit.maxMetadataRequests,
  keyPrefix: 'rl:file-metadata',
  message: {
    error: 'Too many requests, please try again later',
    code: 'FILE_METADATA_RATE_LIMITED',
  },
  onLimitHit: (req) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    fileMetricsService.recordRateLimitHit(req.path, tenantId);
  },
});
