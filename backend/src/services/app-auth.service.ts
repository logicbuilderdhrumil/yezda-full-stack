/**
 * App Auth Service
 * Task 1.2, 1.3, 1.4: App-specific authentication business logic for mobile flows
 * 
 * Handles app sign-in, session refresh with rotation, and sign-out.
 * Tracks device metadata for fraud controls and session management.
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type {
  AppSession,
  AppAuthResult,
  AppSignInRequest,
  AppRefreshRequest,
  AppSessionInfo,
} from '../models/app-auth.model.js';
import type {
  AccessTokenPayload,
  Candidate,
  RefreshTokenPayload,
  TokenPair,
} from '../models/auth.model.js';
import { userRepository } from '../repositories/user.repository.js';
import { appSessionRepository } from '../repositories/app-session.repository.js';
import { passwordService } from './password.service.js';
import { mfaService } from './mfa.service.js';
import { auditService } from './audit.service.js';
import { storeMfaSession, consumeMfaSession, cacheGet, cacheSet } from '../db/redis.js';
import { config } from '../config/index.js';

const REVOKED_TOKEN_TTL_MS = config.jwt.refreshTokenTtlSeconds * 1000;
const REVOKED_TOKEN_PREFIX = 'revoked:app:';
const MAX_SESSIONS_PER_USER = 5;
// Dummy hash for timing attack mitigation when user not found
const DUMMY_HASH = '$2b$12$dummy.salt.for.timing.attack.mitigation.hash';

/**
 * Hash a token for secure storage using SHA-256
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

export class AppAuthService {
  /**
   * App sign-in: Authenticate candidate and issue session tokens
   * Task 1.2: Sign-in session issuance
   */
  async signIn(input: AppSignInRequest, ipAddress?: string): Promise<AppAuthResult> {
    const { email, password, deviceId, deviceName, platform, appVersion, osVersion, model, mfaCode } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // Find candidate (app auth is for candidates only)
    const candidate = await userRepository.findEntityByEmail(normalizedEmail, 'candidate');
    if (!candidate) {
      // Timing attack mitigation: run dummy bcrypt compare to normalize response time
      await passwordService.verify(password, DUMMY_HASH);
      auditService.logAppSignInFailure({
        email: normalizedEmail,
        reason: 'Candidate not found',
        deviceId,
        platform,
        appVersion,
        ipAddress,
      });
      return { success: false, error: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' };
    }

    // Check account lockout
    if (candidate.lockedUntil && candidate.lockedUntil > new Date()) {
      auditService.logAppSignInFailure({
        email: normalizedEmail,
        reason: 'Account locked',
        deviceId,
        platform,
        appVersion,
        ipAddress,
      });
      return { success: false, error: 'Account is locked. Try again later.', errorCode: 'ACCOUNT_LOCKED' };
    }

    // Verify password
    const passwordValid = await passwordService.verify(password, candidate.passwordHash);
    if (!passwordValid) {
      await this.handleFailedAttempt(candidate, deviceId, platform, appVersion, ipAddress);
      auditService.logAppSignInFailure({
        email: normalizedEmail,
        reason: 'Invalid password',
        deviceId,
        platform,
        appVersion,
        ipAddress,
      });
      return { success: false, error: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' };
    }

    // Check MFA requirement
    if (candidate.mfaEnabled) {
      if (!mfaCode) {
        const mfaSessionToken = uuidv4();
        await storeMfaSession(mfaSessionToken, {
          userId: candidate.id,
          userType: 'candidate',
          expiresAt: Date.now() + 5 * 60 * 1000,
          deviceId,
          platform,
          appVersion,
        });
        return { success: true, requiresMfa: true, mfaSessionToken };
      }

      if (!candidate.mfaSecret || !mfaService.verifyCode(candidate.mfaSecret, mfaCode)) {
        auditService.logAppSignInFailure({
          email: normalizedEmail,
          reason: 'Invalid MFA code',
          deviceId,
          platform,
          appVersion,
          ipAddress,
        });
        return { success: false, error: 'Invalid MFA code', errorCode: 'INVALID_MFA' };
      }
    }

    // Reset failed attempts on successful login
    candidate.failedAttempts = 0;
    candidate.lockedUntil = undefined;
    candidate.updatedAt = new Date();
    await userRepository.updateEntity(candidate, 'candidate');

    // Revoke existing sessions on this device (single session per device)
    await appSessionRepository.revokeAllForDevice(candidate.id, deviceId);

    // Enforce max sessions limit
    await this.enforceSessionLimit(candidate.id);

    // Generate tokens and create app session
    const { tokenPair, session } = await this.generateAppTokenPair(
      candidate.id,
      { deviceId, deviceName, platform, appVersion, osVersion, model },
      ipAddress,
      (candidate as Candidate).tenantId
    );

    auditService.logAppSignInSuccess({
      userId: candidate.id,
      deviceId,
      platform,
      appVersion,
      sessionId: session.id,
      ipAddress,
    });

    return {
      success: true,
      tokenPair,
      userId: candidate.id,
      sessionId: session.id,
    };
  }

  /**
   * Complete MFA verification for pending app sign-in
   */
  async completeMfaSignIn(
    mfaSessionToken: string,
    mfaCode: string,
    ipAddress?: string
  ): Promise<AppAuthResult> {
    const session = await consumeMfaSession(mfaSessionToken);
    if (!session || session.expiresAt < Date.now()) {
      return { success: false, error: 'MFA session expired', errorCode: 'MFA_SESSION_EXPIRED' };
    }

    // Validate app-specific session data exists
    if (!session.deviceId || !session.platform || !session.appVersion) {
      return { success: false, error: 'Invalid MFA session', errorCode: 'INVALID_MFA_SESSION' };
    }

    const candidate = await userRepository.findEntityById(session.userId, 'candidate');
    if (!candidate || !candidate.mfaSecret) {
      return { success: false, error: 'User not found', errorCode: 'USER_NOT_FOUND' };
    }

    if (!mfaService.verifyCode(candidate.mfaSecret, mfaCode)) {
      auditService.logAppSignInFailure({
        email: candidate.email,
        reason: 'Invalid MFA code',
        deviceId: session.deviceId,
        platform: session.platform,
        appVersion: session.appVersion,
        ipAddress,
      });
      return { success: false, error: 'Invalid MFA code', errorCode: 'INVALID_MFA' };
    }

    // Revoke existing sessions on this device
    await appSessionRepository.revokeAllForDevice(candidate.id, session.deviceId);

    // Enforce max sessions limit
    await this.enforceSessionLimit(candidate.id);

    // Generate tokens
    const { tokenPair, session: appSession } = await this.generateAppTokenPair(
      candidate.id,
      {
        deviceId: session.deviceId,
        platform: session.platform,
        appVersion: session.appVersion,
      },
      ipAddress,
      (candidate as Candidate).tenantId
    );

    auditService.logAppSignInSuccess({
      userId: candidate.id,
      deviceId: session.deviceId,
      platform: session.platform,
      appVersion: session.appVersion,
      sessionId: appSession.id,
      ipAddress,
    });

    return {
      success: true,
      tokenPair,
      userId: candidate.id,
      sessionId: appSession.id,
    };
  }

  /**
   * Refresh tokens with rotation
   * Task 1.3: Refresh token rotation and revocation
   */
  async refreshTokens(input: AppRefreshRequest, ipAddress?: string): Promise<AppAuthResult> {
    const { refreshToken, deviceId, appVersion } = input;

    // Validate refresh token
    const validated = await this.validateRefreshToken(refreshToken);
    if (!validated) {
      auditService.logAppTokenRefreshFailure({
        reason: 'Invalid refresh token',
        deviceId,
        appVersion,
        ipAddress,
      });
      return { success: false, error: 'Invalid refresh token', errorCode: 'INVALID_REFRESH_TOKEN' };
    }

    const { payload, session: oldSession } = validated;

    // Verify device ID matches
    if (oldSession.deviceId !== deviceId) {
      auditService.logAppTokenRefreshFailure({
        userId: payload.sub,
        reason: 'Device mismatch',
        deviceId,
        appVersion,
        ipAddress,
      });
      await this.revokeSession(oldSession.id);
      return { success: false, error: 'Session invalid for this device', errorCode: 'DEVICE_MISMATCH' };
    }

    // Revoke old refresh token
    await revokeTokenJti(payload.jti);
    oldSession.revokedAt = new Date();
    await appSessionRepository.update(oldSession);

    // Look up candidate's current tenantId for refreshed token
    const candidateRecord = await userRepository.findCandidateById(payload.sub);

    // Generate new token pair
    const { tokenPair, session: newSession } = await this.generateAppTokenPair(
      payload.sub,
      {
        deviceId: oldSession.deviceId,
        deviceName: oldSession.deviceName,
        platform: oldSession.platform,
        appVersion: appVersion || oldSession.appVersion,
        osVersion: oldSession.osVersion,
        model: oldSession.model,
      },
      ipAddress ?? oldSession.ipAddress,
      candidateRecord?.tenantId
    );

    // Link to old session for audit trail
    newSession.rotatedFromId = oldSession.id;
    await appSessionRepository.update(newSession);

    auditService.logAppTokenRefresh({
      userId: payload.sub,
      sessionId: newSession.id,
      deviceId,
      platform: oldSession.platform,
      appVersion,
      ipAddress,
    });

    return {
      success: true,
      tokenPair,
      sessionId: newSession.id,
    };
  }

  /**
   * Sign out and revoke session
   * Task 1.4: Sign-out and token invalidation
   */
  async signOut(
    userId: string,
    sessionId?: string,
    revokeAll = false
  ): Promise<{ success: boolean; revokedCount: number }> {
    let revokedCount = 0;

    if (revokeAll) {
      revokedCount = await appSessionRepository.revokeAllForUser(userId);
    } else if (sessionId) {
      const revoked = await appSessionRepository.revoke(sessionId);
      revokedCount = revoked ? 1 : 0;
    }

    auditService.logAppSignOut({
      userId,
      sessionId,
      revokeAll,
      revokedCount,
    });

    return { success: true, revokedCount };
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    return appSessionRepository.revoke(sessionId);
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string, currentSessionId?: string): Promise<AppSessionInfo[]> {
    return appSessionRepository.getSessionInfoForUser(userId, currentSessionId);
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
  private async validateRefreshToken(
    token: string
  ): Promise<{ payload: RefreshTokenPayload; session: AppSession } | null> {
    try {
      const payload = jwt.verify(token, config.jwt.refreshTokenSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as RefreshTokenPayload;

      if (await isTokenRevoked(payload.jti)) {
        return null;
      }

      const session = await appSessionRepository.findById(payload.sessionId);
      if (!session || session.revokedAt) {
        return null;
      }

      return { payload, session };
    } catch {
      return null;
    }
  }

  /**
   * Generate access and refresh token pair for app session
   */
  private async generateAppTokenPair(
    userId: string,
    metadata: {
      deviceId: string;
      deviceName?: string;
      platform: 'ios' | 'android' | 'web';
      appVersion: string;
      osVersion?: string;
      model?: string;
    },
    ipAddress?: string,
    tenantId?: string
  ): Promise<{ tokenPair: TokenPair; session: AppSession }> {
    const sessionId = uuidv4();
    const accessTokenJti = uuidv4();
    const refreshTokenJti = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    const accessPayload: AccessTokenPayload = {
      sub: userId,
      type: 'candidate',
      tenantId,
      iat: now,
      exp: now + config.jwt.accessTokenTtlSeconds,
      jti: accessTokenJti,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      type: 'candidate',
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

    const session: AppSession = {
      id: sessionId,
      userId,
      userType: 'candidate',
      refreshTokenHash: hashToken(refreshToken),
      deviceId: metadata.deviceId,
      deviceName: metadata.deviceName,
      platform: metadata.platform,
      appVersion: metadata.appVersion,
      osVersion: metadata.osVersion,
      model: metadata.model,
      ipAddress,
      expiresAt: new Date((now + config.jwt.refreshTokenTtlSeconds) * 1000),
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    await appSessionRepository.create(session);

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
   * Handle failed login attempt
   */
  private async handleFailedAttempt(
    candidate: { id: string; email: string; failedAttempts: number; lockedUntil?: Date; updatedAt: Date },
    deviceId: string,
    platform: 'ios' | 'android' | 'web',
    appVersion: string,
    ipAddress?: string
  ): Promise<void> {
    candidate.failedAttempts += 1;
    candidate.updatedAt = new Date();

    if (candidate.failedAttempts >= config.security.maxFailedAttempts) {
      candidate.lockedUntil = new Date(
        Date.now() + config.security.lockoutDurationMinutes * 60 * 1000
      );

      auditService.logAppAccountLocked({
        userId: candidate.id,
        reason: 'Exceeded maximum failed login attempts',
        deviceId,
        platform,
        appVersion,
        ipAddress,
      });
    }

    await userRepository.updateEntity(candidate as any, 'candidate');
  }

  /**
   * Enforce maximum sessions per user limit
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const activeCount = await appSessionRepository.countActiveForUser(userId);
    if (activeCount >= MAX_SESSIONS_PER_USER) {
      // Revoke oldest sessions to make room
      const sessions = await appSessionRepository.findActiveByUser(userId);
      const sessionsToRevoke = sessions.slice(MAX_SESSIONS_PER_USER - 1);
      for (const session of sessionsToRevoke) {
        await appSessionRepository.revoke(session.id);
      }
    }
  }
}

export const appAuthService = new AppAuthService();
