import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Standard API error structure.
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  status?: number;
}

/**
 * Error codes for common API errors.
 */
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/** Error code type. */
type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Default error messages for common error codes.
 */
const defaultMessages: Record<ErrorCode, string> = {
  [ErrorCodes.NETWORK_ERROR]: 'Unable to connect to the server. Please check your connection.',
  [ErrorCodes.TIMEOUT_ERROR]: 'The request timed out. Please try again.',
  [ErrorCodes.UNAUTHORIZED]: 'Your session has expired. Please sign in again.',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.SERVER_ERROR]: 'An unexpected server error occurred. Please try again later.',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred.',
};

const FALLBACK_MESSAGE = 'An unexpected error occurred.';

/**
 * Gets the default message for an error code.
 */
function getDefaultMessage(code: string): string {
  return (defaultMessages as Record<string, string>)[code] ?? FALLBACK_MESSAGE;
}

/**
 * Extracts an ApiError from an unknown error value.
 * @param error - The error to extract from
 * @returns A standardized ApiError object
 */
export function extractApiError(error: unknown): ApiError {
  // Already an ApiError
  if (isApiError(error)) {
    return error;
  }

  // Axios error
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as Partial<ApiError> | undefined;

    // Network error (no response)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          code: ErrorCodes.TIMEOUT_ERROR,
          message: defaultMessages[ErrorCodes.TIMEOUT_ERROR],
        };
      }
      return {
        code: ErrorCodes.NETWORK_ERROR,
        message: defaultMessages[ErrorCodes.NETWORK_ERROR],
      };
    }

    // Server provided error details
    if (data?.code && data?.message) {
      const result: ApiError = {
        code: data.code,
        message: data.message,
      };
      if (data.field !== undefined) {
        result.field = data.field;
      }
      if (status !== undefined) {
        result.status = status;
      }
      return result;
    }

    // Map HTTP status to error code
    const code = mapStatusToErrorCode(status);
    const result: ApiError = {
      code,
      message: data?.message ?? getDefaultMessage(code),
    };
    if (status !== undefined) {
      result.status = status;
    }
    return result;
  }

  // Standard Error
  if (error instanceof Error) {
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error.message,
    };
  }

  // Fallback
  return {
    code: ErrorCodes.UNKNOWN_ERROR,
    message: FALLBACK_MESSAGE,
  };
}

/**
 * Maps HTTP status codes to error codes.
 */
function mapStatusToErrorCode(status: number | undefined): string {
  if (!status) return ErrorCodes.UNKNOWN_ERROR;

  if (status === 401) return ErrorCodes.UNAUTHORIZED;
  if (status === 403) return ErrorCodes.FORBIDDEN;
  if (status === 404) return ErrorCodes.NOT_FOUND;
  if (status === 422 || status === 400) return ErrorCodes.VALIDATION_ERROR;
  if (status >= 500) return ErrorCodes.SERVER_ERROR;

  return ErrorCodes.UNKNOWN_ERROR;
}

/**
 * Type guard for ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as ApiError).code === 'string' &&
    typeof (error as ApiError).message === 'string'
  );
}

/**
 * Type guard for AxiosError.
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Shows an error toast with the API error message.
 * @param error - The error to display
 * @param options - Optional toast configuration
 */
export function showErrorToast(
  error: unknown,
  options?: { duration?: number; id?: string }
): void {
  const apiError = extractApiError(error);
  const toastOptions: { duration: number; id?: string } = {
    duration: options?.duration ?? 4000,
  };
  if (options?.id !== undefined) {
    toastOptions.id = options.id;
  }
  toast.error(apiError.message, toastOptions);
}

/**
 * Shows a success toast.
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export function showSuccessToast(
  message: string,
  options?: { duration?: number; id?: string }
): void {
  const toastOptions: { duration: number; id?: string } = {
    duration: options?.duration ?? 3000,
  };
  if (options?.id !== undefined) {
    toastOptions.id = options.id;
  }
  toast.success(message, toastOptions);
}

/**
 * Hook-like utility for error handling with automatic toast display.
 * Use in try/catch blocks for consistent error handling.
 */
export function handleApiError(
  error: unknown,
  options?: { silent?: boolean; onError?: (error: ApiError) => void }
): ApiError {
  const apiError = extractApiError(error);

  if (!options?.silent) {
    showErrorToast(apiError);
  }

  if (options?.onError) {
    options.onError(apiError);
  }

  return apiError;
}
