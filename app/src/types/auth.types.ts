/**
 * Auth types for app login and session management.
 * Task 1.1: Define login form fields, validation rules, and error copy.
 */

/** Login form field values */
export interface LoginFormValues {
  email: string;
  password: string;
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

/** Sign-in request payload */
export interface SignInRequest {
  email: string;
  password: string;
}

/** Sign-in response from backend */
export interface SignInResponse {
  tokens?: SessionTokens;
  user?: AuthUser;
  mfaChallenge?: MfaChallenge;
}

/** Token refresh response */
export interface RefreshResponse {
  tokens: SessionTokens;
}
