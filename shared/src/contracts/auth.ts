/**
 * Authentication Contracts
 * Shared DTOs for authentication flows between frontend and backend.
 */

/**
 * Supported user types for authentication.
 */
export type UserType = 'user' | 'candidate';

/**
 * User roles supported by the system.
 */
export type UserRole = 'admin' | 'manager' | 'user' | 'candidate' | 'client' | 'client_admin';

/**
 * Token pair returned on successful authentication.
 */
export interface TokenPair {
  /** JWT access token */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Time in seconds until access token expires */
  expiresIn: number;
  /** Token type (always "Bearer") */
  tokenType: 'Bearer';
}

/**
 * Sign-up request payload.
 */
export interface SignUpRequest {
  email: string;
  password: string;
  userType?: UserType;
  firstName?: string;
  lastName?: string;
  termsAccepted?: boolean;
}

/**
 * Sign-up response.
 */
export interface SignUpResponse {
  message: string;
}

/**
 * Sign-in request payload.
 */
export interface SignInRequest {
  email: string;
  password: string;
  userType?: UserType;
  /** MFA code if MFA is enabled */
  mfaCode?: string;
}

/**
 * Sign-in response - either tokens or MFA challenge.
 */
export interface SignInResponse {
  /** True if MFA verification is required */
  requiresMfa?: boolean;
  /** Session token for completing MFA (when requiresMfa is true) */
  mfaSessionToken?: string;
  /** Access token (when authentication is complete) */
  accessToken?: string;
  /** Refresh token (when authentication is complete) */
  refreshToken?: string;
  /** Expiration time in seconds */
  expiresIn?: number;
  /** Token type */
  tokenType?: 'Bearer';
}

/**
 * MFA verification request.
 */
export interface MfaVerifyRequest {
  mfaSessionToken: string;
  mfaCode: string;
}

/**
 * Token refresh request.
 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

/**
 * Token refresh response.
 */
export interface TokenRefreshResponse extends TokenPair {}

/**
 * Password reset request.
 */
export interface PasswordResetRequest {
  email: string;
  userType?: UserType;
}

/**
 * Password reset completion request.
 */
export interface PasswordResetCompleteRequest {
  token: string;
  newPassword: string;
}

/**
 * Current user response (GET /auth/me).
 */
export interface CurrentUserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  userType: UserType;
  mfaEnabled: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sign-out request parameters.
 */
export interface SignOutParams {
  /** Revoke all sessions when true */
  all?: boolean;
}

/**
 * MFA enrollment start response.
 */
export interface MfaEnrollmentResponse {
  enrollmentId: string;
  qrCodeUrl: string;
  secret: string;
}

/**
 * MFA enrollment completion request.
 */
export interface MfaEnrollmentCompleteRequest {
  enrollmentId: string;
  code: string;
}

/**
 * MFA enrollment completion response.
 */
export interface MfaEnrollmentCompleteResponse {
  message: string;
  backupCodes: string[];
}
