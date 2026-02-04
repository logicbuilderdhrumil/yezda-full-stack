/**
 * Auth Token and Session Models
 * Task 1.1: Define auth token and session models
 */

/** User entity for authentication */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lockedUntil?: Date;
  failedAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Candidate entity for authentication (separate from admin users) */
export interface Candidate {
  id: string;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lockedUntil?: Date;
  failedAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Session entity for tracking active sessions */
export interface Session {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  refreshToken: string;
  refreshTokenHash: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  rotatedFromId?: string;
}

/** Access token payload claims */
export interface AccessTokenPayload {
  sub: string;
  type: 'user' | 'candidate';
  tenantId?: string;
  iat: number;
  exp: number;
  jti: string;
}

/** Refresh token payload claims */
export interface RefreshTokenPayload {
  sub: string;
  type: 'user' | 'candidate';
  sessionId: string;
  iat: number;
  exp: number;
  jti: string;
}

/** Password reset token entity */
export interface PasswordResetToken {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

/** MFA enrollment entity (pending TOTP setup) */
export interface MfaEnrollment {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  secret: string;
  verified: boolean;
  createdAt: Date;
  verifiedAt?: Date;
}

/** Token pair returned on successful authentication */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/** Token configuration */
export interface TokenConfig {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  issuer: string;
  audience: string;
}
