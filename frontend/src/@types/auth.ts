/**
 * Authentication-related types for the frontend.
 * Aligned with backend contract (route-guards.middleware.ts, auth.model.ts).
 */

/** Supported user roles - matches backend UserRole (hierarchical RBAC). */
export type UserRole = 'platform_admin' | 'platform_manager' | 'platform_agent' | 'platform_viewer' | 'org_admin' | 'org_manager' | 'org_viewer';

/** User space - platform staff vs organization users. */
export type UserSpace = 'platform' | 'organization';

/** Platform-level roles. */
export const PLATFORM_ROLES: UserRole[] = ['platform_admin', 'platform_manager', 'platform_agent', 'platform_viewer'];

/** Organization-level roles. */
export const ORG_ROLES: UserRole[] = ['org_admin', 'org_manager', 'org_viewer'];

/** User profile returned after successful authentication - aligned with backend. */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
  tenantId?: string;
  userSpace?: UserSpace;
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
  const rolePriority: UserRole[] = ['platform_admin', 'platform_manager', 'platform_agent', 'platform_viewer', 'org_admin', 'org_manager', 'org_viewer'];
  for (const role of rolePriority) {
    if (user.roles.includes(role)) return role;
  }
  return user.roles[0];
}

/** Check if the user belongs to the platform space. */
export function isPlatformUser(user: User | null | undefined): boolean {
  return user?.userSpace === 'platform';
}

/** Check if the user belongs to the organization space. */
export function isOrgUser(user: User | null | undefined): boolean {
  return user?.userSpace === 'organization';
}

/** Get human-readable display name for a role. */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    platform_admin: 'Admin',
    platform_manager: 'Manager',
    platform_agent: 'Agent',
    platform_viewer: 'Viewer',
    org_admin: 'Org Admin',
    org_manager: 'Org Manager',
    org_viewer: 'Org Viewer',
  };
  return names[role] || role;
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
