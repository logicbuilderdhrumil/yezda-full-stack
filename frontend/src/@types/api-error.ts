/**
 * API Error Types
 * Aligned with backend contracts via @yezda/shared.
 *
 * @see shared/src/contracts/error-envelope.ts for contract definition
 */

// Import shared types as source of truth
export type {
  ErrorCode,
  ValidationErrorDetail,
  ApiErrorEnvelope,
} from '@yezda/shared/contracts';

export { isApiErrorEnvelope } from '@yezda/shared/contracts';

// Import for local use
import type { ApiErrorEnvelope, ErrorCode } from '@yezda/shared/contracts';
import { isApiErrorEnvelope } from '@yezda/shared/contracts';

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
        code: (data.code as ErrorCode) || 'INTERNAL_ERROR',
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
