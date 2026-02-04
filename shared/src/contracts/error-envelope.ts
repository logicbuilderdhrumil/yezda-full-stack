/**
 * API Error Envelope
 * Consistent error response format across all foundation APIs.
 *
 * @see openspec/changes/integration-frontend-backend-foundations/specs/frontend-backend-integration/spec.md
 */

/**
 * Standard error codes for foundation APIs.
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
 * All foundation API errors MUST conform to this structure.
 */
export interface ApiErrorEnvelope {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Field-level validation errors (for VALIDATION_ERROR) */
  details?: ValidationErrorDetail[];
  /** Correlation ID for request tracing */
  correlationId: string;
  /** Optional timestamp of when the error occurred */
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
 * Creates an API error envelope with the given properties.
 */
export function createApiError(
  code: ErrorCode,
  message: string,
  correlationId: string,
  details?: ValidationErrorDetail[]
): ApiErrorEnvelope {
  return {
    code,
    message,
    correlationId,
    details,
    timestamp: new Date().toISOString(),
  };
}
