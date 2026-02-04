/**
 * Chat Rate Limiting Middleware
 * Task 1.7: Rate limiting for message send endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { config } from '../config/index.js';
import { chatMetricsService } from '../services/chat-metrics.service.js';

/**
 * In-memory fallback rate limiter for when Redis is unavailable
 */
class MemoryRateLimiter {
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

const memoryLimiter = new MemoryRateLimiter();

// Circuit breaker state
let redisErrorCount = 0;
let redisCircuitOpen = false;
let circuitResetAt = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30000;

/** Rate limit configuration for chat endpoints */
const CHAT_RATE_LIMIT = {
  /** Window size in milliseconds */
  windowMs: config.rateLimit.windowMs,
  /** Maximum message send requests per window per user */
  maxSendRequests: 30, // Stricter for message send
  /** Maximum read requests per window */
  maxReadRequests: 60,
  /** Maximum list requests per window */
  maxListRequests: 100,
} as const;

/**
 * Determine rate limit based on request type
 */
function getRateLimitConfig(req: Request): { key: string; limit: number } {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const method = req.method.toUpperCase();
  const path = req.path.toLowerCase();

  // Message send (POST to /conversations/:id/messages)
  if (method === 'POST' && path.includes('/messages')) {
    return {
      key: `rl:chat:send:${ip}`,
      limit: CHAT_RATE_LIMIT.maxSendRequests,
    };
  }

  // Read/list operations
  if (method === 'GET') {
    if (path.includes('/messages')) {
      return {
        key: `rl:chat:read:${ip}`,
        limit: CHAT_RATE_LIMIT.maxReadRequests,
      };
    }
    return {
      key: `rl:chat:list:${ip}`,
      limit: CHAT_RATE_LIMIT.maxListRequests,
    };
  }

  // Default for other operations (PATCH for status updates, etc.)
  return {
    key: `rl:chat:update:${ip}`,
    limit: CHAT_RATE_LIMIT.maxReadRequests,
  };
}

/**
 * Rate limiter for chat endpoints
 * Uses Redis with in-memory fallback
 */
export async function chatRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { key, limit } = getRateLimitConfig(req);

  let result: { allowed: boolean; remaining: number; resetAt: number };

  // Check circuit breaker - reset if timeout elapsed
  if (redisCircuitOpen && Date.now() > circuitResetAt) {
    redisCircuitOpen = false;
    redisErrorCount = 0;
  }

  // Use memory fallback if circuit is open
  if (redisCircuitOpen) {
    result = memoryLimiter.check(key, limit, CHAT_RATE_LIMIT.windowMs);
    res.setHeader('X-RateLimit-Fallback', 'memory');
  } else {
    try {
      result = await checkRateLimit(key, limit, CHAT_RATE_LIMIT.windowMs);
      redisErrorCount = 0;
    } catch (error) {
      redisErrorCount += 1;
      console.error('[ChatRateLimit] Redis error, falling back to memory:', error);

      if (redisErrorCount >= CIRCUIT_THRESHOLD) {
        redisCircuitOpen = true;
        circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
        console.warn(
          `[ChatRateLimit] Circuit breaker opened, will retry at ${new Date(circuitResetAt).toISOString()}`
        );
      }

      result = memoryLimiter.check(key, limit, CHAT_RATE_LIMIT.windowMs);
      res.setHeader('X-RateLimit-Fallback', 'memory');
    }
  }

  // Set standard rate limit headers
  res.setHeader('RateLimit-Limit', limit);
  res.setHeader('RateLimit-Remaining', result!.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result!.resetAt / 1000));

  if (!result!.allowed) {
    chatMetricsService.recordRateLimited();

    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'CHAT_RATE_LIMITED',
    });
    return;
  }

  next();
}

/**
 * Stricter rate limiter specifically for message send operations
 * This is used in addition to the general chat rate limiter
 */
export async function messageSendRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:chat:send-strict:${ip}`;
  const limit = 10; // Very strict limit for burst protection
  const windowMs = 10000; // 10 second window

  let result: { allowed: boolean; remaining: number; resetAt: number };

  if (redisCircuitOpen) {
    result = memoryLimiter.check(key, limit, windowMs);
  } else {
    try {
      result = await checkRateLimit(key, limit, windowMs);
    } catch (error) {
      result = memoryLimiter.check(key, limit, windowMs);
    }
  }

  if (!result!.allowed) {
    chatMetricsService.recordRateLimited();

    res.status(429).json({
      error: 'Message rate limit exceeded, please slow down',
      code: 'CHAT_MESSAGE_RATE_LIMITED',
    });
    return;
  }

  next();
}
