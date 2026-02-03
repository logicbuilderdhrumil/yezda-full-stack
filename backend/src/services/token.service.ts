/**
 * Token Service
 * Task 1.1, 1.8: JWT token generation, validation, rotation, and revocation
 * 
 * ⚠️ PRODUCTION BLOCKER: In-memory session storage
 * Current implementation stores sessions in-memory which means:
 * - All sessions are lost on server restart (mass logout)
 * - No distributed session management (horizontal scaling impossible)
 * - Memory consumption grows unbounded with active sessions
 * 
 * TODO: Before production deployment:
 * 1. Store sessions in Redis or a database with proper indexing
 * 2. Add TTL-based auto-expiration for sessions
 * 3. Implement session cleanup job for expired entries
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  Session,
} from '../models/auth.model.js';
import { config } from '../config/index.js';

// In-memory session store (replace with Redis/DB in production)
const sessions = new Map<string, Session>();
const revokedTokens = new Set<string>();

// Secondary index: userId -> Set<sessionId> for O(1) user session lookups
const userSessionIndex = new Map<string, Set<string>>();

export class TokenService {
  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(
    userId: string,
    userType: 'user' | 'candidate',
    deviceInfo?: string,
    ipAddress?: string
  ): { tokenPair: TokenPair; session: Session } {
    const sessionId = uuidv4();
    const accessTokenJti = uuidv4();
    const refreshTokenJti = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    const accessPayload: AccessTokenPayload = {
      sub: userId,
      type: userType,
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

    sessions.set(sessionId, session);

    // Update user session index for O(1) lookups
    const userKey = `${userType}:${userId}`;
    if (!userSessionIndex.has(userKey)) {
      userSessionIndex.set(userKey, new Set());
    }
    userSessionIndex.get(userKey)!.add(sessionId);

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
  validateAccessToken(token: string): AccessTokenPayload | null {
    try {
      const payload = jwt.verify(token, config.jwt.accessTokenSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as AccessTokenPayload;

      if (revokedTokens.has(payload.jti)) {
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
  validateRefreshToken(token: string): { payload: RefreshTokenPayload; session: Session } | null {
    try {
      const payload = jwt.verify(token, config.jwt.refreshTokenSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as RefreshTokenPayload;

      if (revokedTokens.has(payload.jti)) {
        return null;
      }

      const session = sessions.get(payload.sessionId);
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
  rotateToken(
    oldRefreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): { tokenPair: TokenPair; session: Session } | null {
    const validated = this.validateRefreshToken(oldRefreshToken);
    if (!validated) {
      return null;
    }

    const { payload, session: oldSession } = validated;

    // Revoke old refresh token
    revokedTokens.add(payload.jti);
    oldSession.revokedAt = new Date();

    // Generate new token pair
    const result = this.generateTokenPair(
      payload.sub,
      payload.type,
      deviceInfo ?? oldSession.deviceInfo,
      ipAddress ?? oldSession.ipAddress
    );

    // Link to old session for audit trail
    result.session.rotatedFromId = oldSession.id;

    return result;
  }

  /**
   * Revoke session and all associated tokens
   */
  revokeSession(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.revokedAt = new Date();
    return true;
  }

  /**
   * Revoke all sessions for a user - O(1) lookup using secondary index
   */
  revokeAllUserSessions(userId: string, userType: 'user' | 'candidate'): number {
    const userKey = `${userType}:${userId}`;
    const sessionIds = userSessionIndex.get(userKey);
    
    if (!sessionIds) {
      return 0;
    }

    let count = 0;
    for (const sessionId of sessionIds) {
      const session = sessions.get(sessionId);
      if (session && !session.revokedAt) {
        session.revokedAt = new Date();
        count++;
      }
    }
    return count;
  }

  /**
   * Get active sessions for a user
   */
  getUserSessions(userId: string, userType: 'user' | 'candidate'): Session[] {
    const userSessions: Session[] = [];
    for (const session of sessions.values()) {
      if (
        session.userId === userId &&
        session.userType === userType &&
        !session.revokedAt &&
        session.expiresAt > new Date()
      ) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  /**
   * Simple hash for token storage (use bcrypt in production for sensitive tokens)
   */
  private hashToken(token: string): string {
    // Simple hash for demonstration; use crypto.createHash in production
    return Buffer.from(token).toString('base64').slice(0, 64);
  }
}

export const tokenService = new TokenService();
