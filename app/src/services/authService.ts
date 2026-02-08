/**
 * Auth API service for sign-in, refresh, and sign-out.
 * Task 1.3: Implement app auth API service.
 * Integration: Aligned with backend auth.routes.ts, auth.controller.ts contracts.
 */

import {
  SignInRequest,
  SignInResponse,
  RefreshResponse,
  SessionTokens,
  authErrorMessages,
} from '../types/auth.types';
import type { MfaVerifyRequestDto } from '../types/api.types';
import { apiRequest, ApiError, type ApiRequestConfig } from './apiClient';

/**
 * Custom error class for auth API errors.
 */
export class AuthApiError extends ApiError {
  constructor(code: string, message: string, status: number) {
    super(code, message, status);
    this.name = 'AuthApiError';
  }
}

/** Shared request config for auth API calls. */
const authRequestConfig: ApiRequestConfig = {
  ErrorClass: AuthApiError,
  fallbackErrorMessage: authErrorMessages.unknownError,
  networkErrorMessage: authErrorMessages.networkError,
};

/**
 * Sign in with email and password.
 * Returns tokens on success, or MFA challenge if required.
 */
export async function signIn(request: SignInRequest): Promise<SignInResponse> {
  try {
    return await apiRequest<SignInResponse>('/v1/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(request),
    }, authRequestConfig);
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
 * Aligned with POST /api/v1/auth/mfa/verify
 */
export async function verifyMfa(request: MfaVerifyRequestDto): Promise<SignInResponse> {
  try {
    return await apiRequest<SignInResponse>('/v1/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    }, authRequestConfig);
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
    }, authRequestConfig);
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
    await apiRequest<void>('/v1/auth/sign-out', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }, authRequestConfig);
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
