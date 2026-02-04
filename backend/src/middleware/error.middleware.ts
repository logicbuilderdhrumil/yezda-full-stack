/**
 * Error Handling Middleware
 * Centralized error handling with consistent error envelope.
 *
 * @see shared/src/contracts/error-envelope.ts for contract definition
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { randomUUID } from 'crypto';

/**
 * Standard error codes aligned with shared contracts.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_REQUEST'
  | 'AUTH_ERROR'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID'
  | 'NETWORK_ERROR';

/**
 * Validation error detail for field-level errors.
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  rule?: string;
}

/**
 * Extended API error with envelope support.
 */
export interface ApiError extends Error {
  statusCode?: number;
  code?: ErrorCode | string;
  details?: ValidationErrorDetail[];
  correlationId?: string;
}

/**
 * API error envelope response structure.
 * All foundation API errors conform to this structure.
 */
export interface ApiErrorEnvelope {
  code: ErrorCode | string;
  message: string;
  details?: ValidationErrorDetail[];
  correlationId: string;
  timestamp: string;
}

/**
 * Get or create correlation ID from request.
 */
function getCorrelationId(req: Request): string {
  // Check for existing correlation ID in headers
  const existing = req.get('x-correlation-id') || req.get('x-request-id');
  if (existing) {
    return existing;
  }
  // Generate new correlation ID
  return randomUUID();
}

/**
 * Global error handler with consistent error envelope.
 */
export const errorHandler: ErrorRequestHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = err.correlationId || getCorrelationId(req);
  const statusCode = err.statusCode || 500;
  const code: ErrorCode | string = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  // Log error with correlation ID for tracing
  console.error(`[${correlationId}] Error:`, {
    code,
    message: err.message,
    statusCode,
    stack: err.stack,
  });

  const envelope: ApiErrorEnvelope = {
    code,
    message,
    correlationId,
    timestamp: new Date().toISOString(),
  };

  if (err.details && err.details.length > 0) {
    envelope.details = err.details;
  }

  // Set correlation ID in response header
  res.setHeader('x-correlation-id', correlationId);
  res.status(statusCode).json(envelope);
};

/**
 * Not found handler with consistent error envelope.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const correlationId = getCorrelationId(req);

  const envelope: ApiErrorEnvelope = {
    code: 'NOT_FOUND',
    message: `Not found: ${req.path}`,
    correlationId,
    timestamp: new Date().toISOString(),
  };

  res.setHeader('x-correlation-id', correlationId);
  res.status(404).json(envelope);
}

/**
 * Create an API error with consistent structure.
 */
export function createError(
  message: string,
  statusCode: number,
  code: ErrorCode | string,
  details?: ValidationErrorDetail[]
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
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
