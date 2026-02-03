/**
 * Authentication-related types for the frontend.
 */

/** User profile returned after successful authentication. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Supported user roles. */
export type UserRole = 'admin' | 'manager' | 'user' | 'candidate';

/** Session data including tokens and user profile. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

/** Credentials for sign-in. */
export interface SignInCredentials {
  email: string;
  password: string;
}

/** Credentials for sign-up. */
export interface SignUpCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
}

/** Sign-in response which may require MFA. */
export interface SignInResponse {
  requiresMfa: boolean;
  mfaToken?: string;
  session?: AuthSession;
}

/** Password reset request payload. */
export interface PasswordResetRequest {
  email: string;
}

/** Password reset completion payload. */
export interface PasswordResetPayload {
  token: string;
  password: string;
}

/** Candidate password reset completion payload. */
export interface CandidatePasswordResetPayload {
  token: string;
  candidateId: string;
  password: string;
}

/** TOTP verification payload. */
export interface TotpVerifyPayload {
  mfaToken: string;
  totpCode: string;
}

/** Generic authentication error. */
export interface AuthError {
  code: string;
  message: string;
  field?: string | undefined;
}

/** Auth state for stores and context. */
export interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  mfaPending: boolean;
  mfaToken: string | null;
}
