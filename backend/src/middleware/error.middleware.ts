/**
 * Error Handling Middleware
 * Centralized error handling with correlation IDs, audit logging, and rate limiting.
 * Implements access pages spec for standardized access denied and not-found responses.
 *
 * @see shared/src/contracts/error-envelope.ts for contract definition
 */

import type { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type {
  ErrorCode,
  ValidationErrorDetail,
  ApiErrorEnvelope,
} from '@yezda/shared/contracts';
import { isApiErrorEnvelope } from '@yezda/shared/contracts';

/** Maximum allowed length for correlation IDs to prevent header injection */
const MAX_CORRELATION_ID_LENGTH = 128;
/** Regex pattern for valid correlation ID format (UUID-like or alphanumeric with dashes) */
const CORRELATION_ID_PATTERN = /^[a-zA-Z0-9-]+$/;

import { auditService } from '../services/audit.service.js';
import { metricsService } from '../services/metrics.service.js';
import { getClientIp } from '../utils/ip.util.js';
import { checkRateLimit } from '../db/redis.js';

/**
 * Extended API error with envelope support.
 */
export interface ApiError extends Error {
  statusCode?: number;
  code?: ErrorCode | string;
  details?: ValidationErrorDetail[];
  correlationId?: string;
}

// Re-export shared types for convenience
export type { ErrorCode, ValidationErrorDetail, ApiErrorEnvelope };
export { isApiErrorEnvelope };

// Rate limit settings for access errors
const ACCESS_ERROR_WINDOW_MS = 60000; // 1 minute
const ACCESS_ERROR_MAX_ATTEMPTS = 30; // 30 access errors per minute before throttling

// In-memory fallback rate limiter for access errors
class AccessErrorLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    this.cleanupInterval.unref();
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

const accessErrorLimiter = new AccessErrorLimiter();

/**
 * Graceful shutdown for access error limiter
 * Call this on process termination to clean up resources
 */
export function shutdownAccessErrorLimiter(): void {
  accessErrorLimiter.destroy();
}

/**
 * Async handler wrapper for Express 4.x
 * Catches rejected promises and forwards to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Check rate limiting for access errors
 */
async function checkAccessErrorRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const key = `access:error:${ip}`;

  try {
    return await checkRateLimit(key, ACCESS_ERROR_MAX_ATTEMPTS, ACCESS_ERROR_WINDOW_MS);
  } catch {
    // Fall back to in-memory limiter on Redis error
    return accessErrorLimiter.check(key, ACCESS_ERROR_MAX_ATTEMPTS, ACCESS_ERROR_WINDOW_MS);
  }
}

/**
 * Generate or reuse correlation ID from request
 * Validates length and format to prevent header injection
 */
function getCorrelationId(req: Request): string {
  // Check if correlation ID already exists on request (set by upstream)
  const existingId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  if (
    typeof existingId === 'string' &&
    existingId.length > 0 &&
    existingId.length <= MAX_CORRELATION_ID_LENGTH &&
    CORRELATION_ID_PATTERN.test(existingId)
  ) {
    return existingId;
  }
  return uuidv4();
}

/**
 * Global error handler with correlation ID, audit logging, and consistent error envelope.
 */
export const errorHandler: ErrorRequestHandler = async (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const correlationId = err.correlationId || getCorrelationId(req);
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  // Log error with correlation ID
  console.error(JSON.stringify({
    level: 'error',
    type: 'error_handler',
    correlationId,
    error: err.message,
    statusCode: err.statusCode,
    code: err.code,
    path: req.path,
    method: req.method,
    ip,
  }));

  const statusCode = err.statusCode || 500;
  let code: ErrorCode | string = err.code || 'INTERNAL_ERROR';
  let message = err.message;

  // Map status codes to appropriate error codes
  if (statusCode === 401) {
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (statusCode === 403) {
    code = 'ACCESS_DENIED';
    message = 'Access denied';
  } else if (statusCode === 404) {
    code = 'NOT_FOUND';
    message = 'The requested resource was not found';
  } else if (statusCode === 429) {
    code = 'RATE_LIMITED';
    message = 'Too many requests. Please try again later.';
  } else if (statusCode >= 500) {
    // Sanitize internal errors - never expose details
    message = 'Internal server error';
    code = 'INTERNAL_ERROR';
  }

  // Record metrics for access errors
  if (statusCode === 401 || statusCode === 403) {
    metricsService.incrementCounter('access_error_denied_total', { code, path: req.path });

    // Audit log for access denied
    auditService.log({
      eventType: 'ACCESS_DENIED',
      channel: 'api',
      ipAddress: ip,
      userAgent,
      metadata: {
        correlationId,
        route: req.path,
        method: req.method,
        statusCode,
        code,
      },
      success: false,
      errorMessage: message,
    });
  }

  // Build consistent error response
  // Include both 'error' and 'message' fields for cross-contract compatibility
  const response: Record<string, unknown> = {
    error: message,
    message,
    code: code as string,
    correlationId,
    timestamp: new Date().toISOString(),
  };

  if (err.details && err.details.length > 0) {
    response.details = err.details;
  }

  // Set correlation ID header for response tracing
  res.setHeader('X-Correlation-Id', correlationId);
  res.status(statusCode).json(response);
};

/**
 * Not found handler with correlation ID, audit logging, and rate limiting.
 */
export async function notFoundHandler(req: Request, res: Response): Promise<void> {
  const correlationId = getCorrelationId(req);
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  // Check rate limit for repeated not-found requests
  const rateCheck = await checkAccessErrorRateLimit(ip);
  if (!rateCheck.allowed) {
    // Client is sending too many invalid requests - rate limit
    metricsService.incrementCounter('access_error_rate_limited_total', { type: 'not_found' });
    
    auditService.log({
      eventType: 'ACCESS_RATE_LIMITED',
      channel: 'api',
      ipAddress: ip,
      userAgent,
      metadata: {
        correlationId,
        route: req.path,
        method: req.method,
        type: 'not_found_burst',
      },
      success: false,
      errorMessage: 'Rate limited due to excessive not-found requests',
    });

    const rateLimitResponse = {
      error: 'Too many requests. Please try again later.',
      code: 'ACCESS_RATE_LIMITED',
      correlationId,
      timestamp: new Date().toISOString(),
    };

    res.setHeader('X-Correlation-Id', correlationId);
    res.setHeader('Retry-After', Math.ceil((rateCheck.resetAt - Date.now()) / 1000).toString());
    res.status(429).json(rateLimitResponse);
    return;
  }

  // Record metrics
  metricsService.incrementCounter('access_error_not_found_total', { path: req.path });

  // Audit log for not-found access
  auditService.log({
    eventType: 'ACCESS_NOT_FOUND',
    channel: 'api',
    ipAddress: ip,
    userAgent,
    metadata: {
      correlationId,
      route: req.path,
      method: req.method,
    },
    success: false,
    errorMessage: 'Route not found',
  });

  // Log for operational visibility
  console.log(JSON.stringify({
    level: 'info',
    type: 'not_found',
    correlationId,
    path: req.path,
    method: req.method,
    ip,
  }));

  // Build not-found response
  // Include both 'error' (generic) and 'message' (with path for API contract) fields
  const response = {
    error: 'The requested resource was not found',
    message: `Not found: ${req.path}`,
    code: 'NOT_FOUND',
    correlationId,
    timestamp: new Date().toISOString(),
  };

  res.setHeader('X-Correlation-Id', correlationId);
  res.status(404).json(response);
}

/**
 * Create an API error with consistent structure.
 */
export function createError(
  message: string,
  statusCode: number,
  code: ErrorCode | string,
  detailsOrCorrelationId?: ValidationErrorDetail[] | string,
  extraDetails?: ValidationErrorDetail[]
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  // Support both calling conventions:
  // createError(msg, status, code, correlationId) - string as 4th
  // createError(msg, status, code, details) - array as 4th
  if (typeof detailsOrCorrelationId === 'string') {
    error.correlationId = detailsOrCorrelationId;
    error.details = extraDetails;
  } else if (Array.isArray(detailsOrCorrelationId)) {
    error.details = detailsOrCorrelationId;
  }
  return error;
}

/**
 * Create a validation error with field-level details.
 */
export function createValidationError(
  details: ValidationErrorDetail[],
  message = 'Validation failed'
): ApiError {
  return createError(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Create access denied error with proper error code.
 */
export function createAccessDeniedError(
  message = 'Access denied',
  correlationId?: string
): ApiError {
  return createError(message, 403, 'ACCESS_DENIED', correlationId);
}

/**
 * Create unauthorized error with proper error code.
 */
export function createUnauthorizedError(
  message = 'Authentication required',
  correlationId?: string
): ApiError {
  return createError(message, 401, 'UNAUTHORIZED', correlationId);
}

/**
 * Middleware to attach correlation ID to incoming requests.
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = getCorrelationId(req);
  
  // Attach to request for use by other middleware/handlers
  (req as Request & { correlationId: string }).correlationId = correlationId;
  
  // Set response header for tracing
  res.setHeader('X-Correlation-Id', correlationId);
  
  next();
}

