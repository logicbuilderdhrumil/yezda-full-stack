/**
 * Access Error Models
 * Standardized error response schemas for access denied and not-found cases.
 * Implements privacy-preserving error handling with correlation identifiers.
 */

/**
 * Standard error codes for access control
 */
export const ACCESS_ERROR_CODES = {
  /** Authentication required but not provided */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** Authentication valid but insufficient permissions */
  FORBIDDEN: 'FORBIDDEN',
  /** Access denied due to policy violation */
  ACCESS_DENIED: 'ACCESS_DENIED',
  /** Requested route does not exist */
  NOT_FOUND: 'NOT_FOUND',
  /** Too many access errors from client */
  ACCESS_RATE_LIMITED: 'ACCESS_RATE_LIMITED',
  /** Internal server error - do not expose details */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AccessErrorCode = typeof ACCESS_ERROR_CODES[keyof typeof ACCESS_ERROR_CODES];

/**
 * Standard error response structure
 * Privacy-preserving: never includes stack traces or internal details
 */
export interface AccessErrorResponse {
  /** Human-readable error message (sanitized) */
  error: string;
  /** Machine-readable error code */
  code: AccessErrorCode;
  /** Correlation identifier for support/debugging */
  correlationId: string;
  /** ISO timestamp of the error */
  timestamp: string;
}

/**
 * Extended error response for not-found routes
 * Does not include path to avoid information disclosure
 */
export type NotFoundErrorResponse = AccessErrorResponse;

/**
 * Internal access error with additional context for logging
 */
export interface AccessErrorContext {
  /** Correlation identifier */
  correlationId: string;
  /** Error code */
  code: AccessErrorCode;
  /** User-facing message */
  message: string;
  /** Route path */
  route: string;
  /** HTTP method */
  method: string;
  /** Client IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Actor ID (if authenticated) */
  actorId?: string;
  /** Actor type (if authenticated) */
  actorType?: 'user' | 'candidate';
  /** Additional metadata for audit */
  metadata?: Record<string, unknown>;
}

/**
 * Default error messages - sanitized for client consumption
 */
export const ACCESS_ERROR_MESSAGES = {
  [ACCESS_ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ACCESS_ERROR_CODES.FORBIDDEN]: 'Access denied',
  [ACCESS_ERROR_CODES.ACCESS_DENIED]: 'Access denied',
  [ACCESS_ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ACCESS_ERROR_CODES.ACCESS_RATE_LIMITED]: 'Too many requests. Please try again later.',
  [ACCESS_ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
} as const;

/**
 * Create a standardized access error response
 */
export function createAccessErrorResponse(
  code: AccessErrorCode,
  correlationId: string,
  customMessage?: string
): AccessErrorResponse {
  return {
    error: customMessage || ACCESS_ERROR_MESSAGES[code],
    code,
    correlationId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized not-found error response
 * Does not include path to prevent information disclosure
 */
export function createNotFoundErrorResponse(
  correlationId: string,
  customMessage?: string
): NotFoundErrorResponse {
  return {
    error: customMessage || ACCESS_ERROR_MESSAGES[ACCESS_ERROR_CODES.NOT_FOUND],
    code: ACCESS_ERROR_CODES.NOT_FOUND,
    correlationId,
    timestamp: new Date().toISOString(),
  };
}
