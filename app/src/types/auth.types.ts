/**
 * Auth types for app login and session management.
 * Task 1.1: Define login form fields, validation rules, and error copy.
 * Integration: Aligned with backend auth contracts.
 */

import type { UserType } from './api.types';

// Re-export aligned API contracts for service usage
export type {
  SignInRequestDto,
  SignInResponseDto,
  MfaVerifyRequestDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  UserType,
} from './api.types';

/** Login form field values */
export interface LoginFormValues {
  email: string;
  password: string;
  userType: UserType;
}

/** Login form field errors */
export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/** Validation rules for login form */
export const loginValidationRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter a valid email address',
    },
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
  },
  userType: {
    required: 'User type is required',
  },
} as const;

/** Error copy for common auth failures */
export const authErrorMessages = {
  invalidCredentials: 'Invalid email or password. Please try again.',
  accountLocked: 'Your account has been locked. Contact support for assistance.',
  networkError: 'Connection failed. Check your network and try again.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  mfaRequired: 'Additional verification required.',
  mfaFailed: 'Verification code is incorrect. Try again.',
  unknownError: 'An unexpected error occurred. Please try again later.',
} as const;

/** UI states for auth screens */
export type AuthScreenState = 'idle' | 'loading' | 'error' | 'success';

/** Session token structure */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/** Authenticated user info */
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/** Auth session state */
export interface AuthSession {
  user: AuthUser | null;
  tokens: SessionTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** MFA challenge types */
export type MfaChallengeType = 'totp' | 'sms' | 'email';

/** MFA challenge response from backend */
export interface MfaChallenge {
  challengeId: string;
  type: MfaChallengeType;
  hint?: string; // e.g. last 4 digits of phone
}

/** MFA verification request */
export interface MfaVerifyRequest {
  challengeId: string;
  code: string;
}

/** Sign-in request payload aligned with backend appSignInSchema */
export interface SignInRequest {
  email: string;
  password: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  deviceName?: string;
  osVersion?: string;
  model?: string;
  mfaCode?: string;
}

/** Sign-in response from backend (aligned with backend auth.controller) */
export interface SignInResponse {
  /** Access token on successful auth */
  accessToken?: string;
  /** Refresh token on successful auth */
  refreshToken?: string;
  /** Token expiry in seconds */
  expiresIn?: number;
  /** Token type (always 'Bearer') */
  tokenType?: 'Bearer';
  /** True if MFA challenge required */
  requiresMfa?: boolean;
  /** MFA session token for verification step */
  mfaSessionToken?: string;
}

/** Token refresh response (aligned with backend auth.controller) */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * Convert backend auth response to app session tokens
 */
export function toSessionTokens(response: SignInResponse | RefreshResponse): SessionTokens {
  const token = 'accessToken' in response ? response : null;
  if (!token?.accessToken || !token?.refreshToken) {
    throw new Error('Invalid token response');
  }
  const expiresIn = token.expiresIn ?? 3600;
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
