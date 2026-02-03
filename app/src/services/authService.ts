/**
 * Auth API service for sign-in, refresh, and sign-out.
 * Task 1.3: Implement app auth API service.
 */

import {
  SignInRequest,
  SignInResponse,
  RefreshResponse,
  MfaVerifyRequest,
  SessionTokens,
  authErrorMessages,
} from '../types/auth.types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

interface ApiError {
  code: string;
  message: string;
}

/**
 * Custom error class for auth API errors.
 */
export class AuthApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * Generic fetch wrapper with error handling and timeout.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: authErrorMessages.unknownError,
      }));
      throw new AuthApiError(errorData.code, errorData.message, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AuthApiError(
        'REQUEST_TIMEOUT',
        authErrorMessages.networkError,
        0
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sign in with email and password.
 * Returns tokens on success, or MFA challenge if required.
 */
export async function signIn(request: SignInRequest): Promise<SignInResponse> {
  try {
    return await apiRequest<SignInResponse>('/v1/auth/signin', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  } catch (error) {
    if (error instanceof AuthApiError) {
      if (error.status === 401) {
        throw new AuthApiError(
          'INVALID_CREDENTIALS',
          authErrorMessages.invalidCredentials,
          401
        );
      }
      if (error.status === 423) {
        throw new AuthApiError(
          'ACCOUNT_LOCKED',
          authErrorMessages.accountLocked,
          423
        );
      }
    }
    if (error instanceof TypeError) {
      throw new AuthApiError(
        'NETWORK_ERROR',
        authErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Complete MFA verification.
 */
export async function verifyMfa(request: MfaVerifyRequest): Promise<SignInResponse> {
  try {
    return await apiRequest<SignInResponse>('/v1/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) {
      throw new AuthApiError(
        'MFA_FAILED',
        authErrorMessages.mfaFailed,
        401
      );
    }
    throw error;
  }
}

/**
 * Refresh the access token using the refresh token.
 */
export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  try {
    return await apiRequest<RefreshResponse>('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) {
      throw new AuthApiError(
        'SESSION_EXPIRED',
        authErrorMessages.sessionExpired,
        401
      );
    }
    throw error;
  }
}

/**
 * Sign out and invalidate the session on the backend.
 */
export async function signOut(accessToken: string): Promise<void> {
  try {
    await apiRequest<void>('/v1/auth/signout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    // Ignore errors on sign-out; we'll clear local tokens anyway
    console.warn('Sign-out API call failed:', error);
  }
}

/**
 * Get authenticated API headers.
 */
export function getAuthHeaders(tokens: SessionTokens): HeadersInit {
  return {
    Authorization: `Bearer ${tokens.accessToken}`,
    'Content-Type': 'application/json',
  };
}
