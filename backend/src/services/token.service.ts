/**
 * Token Service
 * Task 1.1, 1.8: JWT token generation, validation, rotation, and revocation
 * 
 * Uses Postgres for session persistence via sessionRepository.
 * Uses Redis for revoked token tracking (fast lookup).
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  Session,
} from '../models/auth.model.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { userManagementRepository } from '../repositories/user-management.repository.js';
import { cacheGet, cacheSet } from '../db/redis.js';
import { config } from '../config/index.js';

// Revoked token cache TTL (match max token lifetime)
const REVOKED_TOKEN_TTL_MS = config.jwt.refreshTokenTtlSeconds * 1000;
const REVOKED_TOKEN_PREFIX = 'revoked:';

/**
 * Check if a token JTI is revoked (cached in Redis)
 */
async function isTokenRevoked(jti: string): Promise<boolean> {
  const revoked = await cacheGet<boolean>(`${REVOKED_TOKEN_PREFIX}${jti}`);
  return revoked === true;
}

/**
 * Mark a token JTI as revoked in Redis
 */
async function revokeTokenJti(jti: string): Promise<void> {
  await cacheSet(`${REVOKED_TOKEN_PREFIX}${jti}`, true, REVOKED_TOKEN_TTL_MS);
}

export class TokenService {
  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    userId: string,
    userType: 'user' | 'candidate',
    deviceInfo?: string,
    ipAddress?: string,
    tenantId?: string
  ): Promise<{ tokenPair: TokenPair; session: Session }> {
    const sessionId = uuidv4();
    const accessTokenJti = uuidv4();
    const refreshTokenJti = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    const accessPayload: AccessTokenPayload = {
      sub: userId,
      type: userType,
      ...(tenantId && { tenantId }),
      iat: now,
      exp: now + config.jwt.accessTokenTtlSeconds,
      jti: accessTokenJti,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      type: userType,
      sessionId,
      iat: now,
      exp: now + config.jwt.refreshTokenTtlSeconds,
      jti: refreshTokenJti,
    };

    const accessToken = jwt.sign(accessPayload, config.jwt.accessTokenSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshTokenSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    const session: Session = {
      id: sessionId,
      userId,
      userType,
      refreshToken,
      refreshTokenHash: this.hashToken(refreshToken),
      deviceInfo,
      ipAddress,
      expiresAt: new Date((now + config.jwt.refreshTokenTtlSeconds) * 1000),
      createdAt: new Date(),
    };

    await sessionRepository.create(session);

    return {
      tokenPair: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessTokenTtlSeconds,
        tokenType: 'Bearer',
      },
      session,
    };
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<AccessTokenPayload | null> {
    try {
      const payload = jwt.verify(token, config.jwt.accessTokenSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as AccessTokenPayload;

      if (await isTokenRevoked(payload.jti)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Validate refresh token and return session
   */
  async validateRefreshToken(token: string): Promise<{ payload: RefreshTokenPayload; session: Session } | null> {
    try {
      const payload = jwt.verify(token, config.jwt.refreshTokenSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as RefreshTokenPayload;

      if (await isTokenRevoked(payload.jti)) {
        return null;
      }

      const session = await sessionRepository.findById(payload.sessionId);
      if (!session || session.revokedAt) {
        return null;
      }

      return { payload, session };
    } catch {
      return null;
    }
  }

  /**
   * Rotate refresh token (Task 1.8)
   * Issues new token pair and revokes the prior refresh token
   */
  async rotateToken(
    oldRefreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ tokenPair: TokenPair; session: Session } | null> {
    const validated = await this.validateRefreshToken(oldRefreshToken);
    if (!validated) {
      return null;
    }

    const { payload, session: oldSession } = validated;

    // Revoke old refresh token in Redis cache
    await revokeTokenJti(payload.jti);
    
    // Mark old session as revoked
    oldSession.revokedAt = new Date();
    await sessionRepository.update(oldSession);

    // Fetch tenantId for user type from managed_users
    let tenantId: string | undefined;
    if (payload.type === 'user') {
      const managedUser = await userManagementRepository.findByIdWithoutTenantScope(payload.sub);
      tenantId = managedUser?.tenantId;
    }

    // Generate new token pair with tenantId
    const result = await this.generateTokenPair(
      payload.sub,
      payload.type,
      deviceInfo ?? oldSession.deviceInfo,
      ipAddress ?? oldSession.ipAddress,
      tenantId
    );

    // Link to old session for audit trail
    result.session.rotatedFromId = oldSession.id;
    await sessionRepository.update(result.session);

    return result;
  }

  /**
   * Revoke session and all associated tokens
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    return sessionRepository.revoke(sessionId);
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string, userType: 'user' | 'candidate'): Promise<number> {
    return sessionRepository.revokeAllForUser(userId, userType);
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string, userType: 'user' | 'candidate'): Promise<Session[]> {
    return sessionRepository.findActiveByUser(userId, userType);
  }
}

export const tokenService = new TokenService();
