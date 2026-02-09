/**
 * Shared API HTTP client for the app.
 * Provides unified request handling with timeout, error parsing, and optional auth token injection.
 */

import { getStoredTokens } from '@/utils/secureStorage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'test' ? 'http://localhost:6312/api' : undefined);

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is required');
}

export const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Base error class for API errors.
 * Domain-specific error classes (e.g., AuthApiError) should extend this.
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Constructor signature for API error subclasses. */
export type ApiErrorConstructor = new (
  code: string,
  message: string,
  status: number
) => ApiError;

/** Configuration for individual apiRequest calls. */
export interface ApiRequestConfig {
  /** Override the default request timeout (ms). */
  timeoutMs?: number;
  /** Error class constructor to use for thrown errors. Defaults to ApiError. */
  ErrorClass?: ApiErrorConstructor;
  /** Fallback message when server error response body cannot be parsed. */
  fallbackErrorMessage?: string;
  /** Message for timeout and network errors. Falls back to fallbackErrorMessage. */
  networkErrorMessage?: string;
  /**
   * When true, automatically inject a Bearer token from secure storage.
   * Throws ErrorClass with code 'UNAUTHORIZED' if no stored token is found.
   */
  authenticated?: boolean;
}

/**
 * Generic fetch wrapper with timeout, error handling, and optional auth injection.
 *
 * @param endpoint - API path appended to API_BASE_URL (e.g., '/v1/auth/sign-in').
 * @param options  - Standard fetch RequestInit (method, headers, body, etc.).
 * @param config   - Optional configuration for timeout, error class, auth, etc.
 * @returns Parsed JSON response of type T.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {}
): Promise<T> {
  const {
    timeoutMs = REQUEST_TIMEOUT_MS,
    ErrorClass = ApiError,
    fallbackErrorMessage = 'An unexpected error occurred.',
    networkErrorMessage,
    authenticated = false,
  } = config;

  const netErrMsg = networkErrorMessage ?? fallbackErrorMessage;
  const url = `${API_BASE_URL}${endpoint}`;

  // Build headers: defaults → auth → caller overrides
  const builtHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authenticated) {
    const tokens = await getStoredTokens();
    if (!tokens?.accessToken) {
      throw new ErrorClass('UNAUTHORIZED', 'Not authenticated', 401);
    }
    builtHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  // Caller-provided headers take highest precedence
  const finalHeaders: HeadersInit = {
    ...builtHeaders,
    ...(options.headers as Record<string, string> | undefined),
  };

  // Timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: fallbackErrorMessage,
      }));
      throw new ErrorClass(
        errorData.code ?? 'UNKNOWN_ERROR',
        errorData.message ?? errorData.error ?? fallbackErrorMessage,
        response.status
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ErrorClass('REQUEST_TIMEOUT', netErrMsg, 0);
    }
    if (error instanceof TypeError) {
      throw new ErrorClass('NETWORK_ERROR', netErrMsg, 0);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
