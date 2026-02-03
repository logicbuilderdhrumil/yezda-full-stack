/**
 * Rate Limiting Middleware
 * Task 1.6: Rate limiting and abuse protection for auth endpoints
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { config } from '../config/index.js';
import { auditService } from '../services/audit.service.js';

/**
 * Standard rate limiter for general API endpoints
 */
export const standardRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxAuthRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later', code: 'AUTH_RATE_LIMITED' },
  handler: (req: Request, res: Response) => {
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

    res.status(429).json({
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMITED',
    });
  },
});

/**
 * Stricter rate limiter for password reset
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts, please try again later', code: 'RESET_RATE_LIMITED' },
});
