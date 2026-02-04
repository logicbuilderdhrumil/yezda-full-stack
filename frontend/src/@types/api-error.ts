/**
 * API Error Types
 * Shared error envelope types aligned with backend contracts.
 *
 * @see shared/src/contracts/error-envelope.ts for contract definition
 */

/**
 * Standard error codes from foundation APIs.
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
  /** Field path that failed validation (e.g., "email", "address.city") */
  field: string;
  /** Validation error message */
  message: string;
  /** Optional validation rule that failed (e.g., "required", "format") */
  rule?: string;
}

/**
 * Standard API error envelope.
 * All foundation API errors conform to this structure.
 */
export interface ApiErrorEnvelope {
  /** Machine-readable error code */
  code: ErrorCode | string;
  /** Human-readable error message */
  message: string;
  /** Field-level validation errors (for VALIDATION_ERROR) */
  details?: ValidationErrorDetail[];
  /** Correlation ID for request tracing */
  correlationId: string;
  /** Timestamp of when the error occurred */
  timestamp?: string;
}

/**
 * Type guard to check if an object is an ApiErrorEnvelope.
 */
export function isApiErrorEnvelope(obj: unknown): obj is ApiErrorEnvelope {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const envelope = obj as Partial<ApiErrorEnvelope>;
  return (
    typeof envelope.code === 'string' &&
    typeof envelope.message === 'string' &&
    typeof envelope.correlationId === 'string'
  );
}

/**
 * Extracts ApiErrorEnvelope from an axios error response.
 */
export function extractApiError(error: unknown): ApiErrorEnvelope {
  // Try to extract from axios error
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as {
      response?: {
        data?: unknown;
        headers?: Record<string, string>;
      };
    };

    if (axiosError.response?.data && isApiErrorEnvelope(axiosError.response.data)) {
      return axiosError.response.data;
    }

    // Build a fallback error envelope
    const correlationId =
      axiosError.response?.headers?.['x-correlation-id'] ||
      axiosError.response?.headers?.['x-request-id'] ||
      'unknown';

    // Check for legacy error format
    const data = axiosError.response?.data as Record<string, unknown> | undefined;
    if (data) {
      return {
        code: (data.code as string) || 'INTERNAL_ERROR',
        message: (data.message as string) || (data.error as string) || 'An unexpected error occurred',
        correlationId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Network or unknown error
  return {
    code: 'NETWORK_ERROR',
    message: 'Unable to connect to the server',
    correlationId: 'unknown',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks if an error code indicates an authentication error.
 */
export function isAuthError(code: ErrorCode | string): boolean {
  return ['UNAUTHORIZED', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'AUTH_ERROR'].includes(code);
}

/**
 * Checks if an error code indicates an MFA-related error.
 */
export function isMfaError(code: ErrorCode | string): boolean {
  return ['MFA_REQUIRED', 'MFA_INVALID'].includes(code);
}
