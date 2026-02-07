/**
 * Authentication-related types for the frontend.
 * Aligned with backend contract (route-guards.middleware.ts, auth.model.ts).
 */

/** Supported user roles - matches backend UserRole. */
export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer' | 'client' | 'client_admin';

/** User profile returned after successful authentication - aligned with backend. */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
  tenantId?: string;
  type: 'user' | 'candidate';
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper to check if user has any of the required roles.
 */
export function hasRole(user: User | null | undefined, ...requiredRoles: UserRole[]): boolean {
  if (!user || !user.roles) return false;
  return requiredRoles.some((role) => user.roles.includes(role));
}

/**
 * Helper to get the primary role for display purposes.
 * Returns the highest-priority role.
 */
export function getPrimaryRole(user: User): UserRole | undefined {
  const rolePriority: UserRole[] = ['admin', 'manager', 'agent', 'viewer'];
  for (const role of rolePriority) {
    if (user.roles.includes(role)) return role;
  }
  return user.roles[0];
}

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
  userType?: 'user' | 'candidate';
}

/** Credentials for sign-up. */
export interface SignUpCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
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
  userType?: 'user' | 'candidate';
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
