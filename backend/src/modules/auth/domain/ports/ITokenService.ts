/**
 * Token service port — defines contract for JWT operations and session management
 */
import type { AccessTokenPayload, RefreshTokenPayload, TokenPair } from '../value-objects/index.js';
import type { Session } from '../entities/Session.js';

export interface ITokenService {
  generateTokenPair(
    userId: string,
    userType: 'user' | 'candidate',
    deviceInfo?: string,
    ipAddress?: string,
    tenantId?: string,
  ): Promise<{ tokenPair: TokenPair; session: Session }>;

  validateAccessToken(token: string): Promise<AccessTokenPayload | null>;

  validateRefreshToken(
    token: string,
  ): Promise<{ payload: RefreshTokenPayload; session: Session } | null>;

  rotateToken(
    oldRefreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ tokenPair: TokenPair; session: Session } | null>;

  revokeSession(sessionId: string): Promise<boolean>;

  revokeAllUserSessions(
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<number>;

  getUserSessions(
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<Session[]>;
}
