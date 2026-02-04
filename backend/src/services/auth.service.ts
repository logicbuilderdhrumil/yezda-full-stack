/**
 * Auth Service
 * Task 1.2, 1.3, 1.6: Core authentication business logic
 * 
 * Uses Postgres for persistent storage of users, sessions, and tokens.
 * Uses Redis for MFA sessions and rate limiting (handled in middleware).
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { User, Candidate, PasswordResetToken, TokenPair } from '../models/auth.model.js';
import { tokenService } from './token.service.js';
import { passwordService } from './password.service.js';
import { mfaService } from './mfa.service.js';
import { auditService } from './audit.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { userManagementRepository } from '../repositories/user-management.repository.js';
import { passwordResetRepository } from '../repositories/password-reset.repository.js';
import { storeMfaSession, consumeMfaSession } from '../db/redis.js';
import { getClient } from '../db/postgres.js';
import { config } from '../config/index.js';

/**
 * Hash a token for secure storage using SHA-256
 * Only the hash is stored; raw token is sent to user
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to prevent length-based timing leaks
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export interface AuthResult {
  success: boolean;
  tokenPair?: TokenPair;
  requiresMfa?: boolean;
  mfaSessionToken?: string;
  error?: string;
  errorCode?: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  userType: 'user' | 'candidate';
}

export interface SignInInput {
  email: string;
  password: string;
  userType: 'user' | 'candidate';
  mfaCode?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

export class AuthService {
  /**
   * Sign up a new user or candidate
   */
  async signUp(input: SignUpInput): Promise<AuthResult> {
    const { email, password, userType } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const emailExists = await userRepository.emailExists(normalizedEmail, userType);
    if (emailExists) {
      return { success: false, error: 'Email already registered', errorCode: 'EMAIL_EXISTS' };
    }

    // Validate password strength
    const strengthResult = passwordService.validateStrength(password);
    if (!strengthResult.valid) {
      return {
        success: false,
        error: strengthResult.errors.join('; '),
        errorCode: 'WEAK_PASSWORD',
      };
    }

    // Hash password and create user
    const passwordHash = await passwordService.hash(password);
    const id = uuidv4();
    const now = new Date();

    const entity: User | Candidate = {
      id,
      email: normalizedEmail,
      passwordHash,
      mfaEnabled: false,
      failedAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (userType === 'user') {
      await userRepository.createUser(entity);
    } else {
      await userRepository.createCandidate(entity);
    }

    auditService.log({
      eventType: 'AUTH_SIGN_UP',
      actorId: id,
      actorType: userType,
      channel: 'api',
    });

    return { success: true };
  }

  /**
   * Sign in a user or candidate with credentials
   */
  async signIn(input: SignInInput): Promise<AuthResult> {
    const { email, password, userType, mfaCode, deviceInfo, ipAddress, userAgent, channel } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const entity = await userRepository.findEntityByEmail(normalizedEmail, userType);
    if (!entity) {
      auditService.logSignInFailure({
        email: normalizedEmail,
        reason: 'User not found',
        channel,
        ipAddress,
        userAgent,
      });
      return { success: false, error: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' };
    }

    // Check lockout (Task 1.6)
    if (entity.lockedUntil && entity.lockedUntil > new Date()) {
      auditService.logSignInFailure({
        email: normalizedEmail,
        reason: 'Account locked',
        channel,
        ipAddress,
        userAgent,
      });
      return { success: false, error: 'Account is locked. Try again later.', errorCode: 'ACCOUNT_LOCKED' };
    }

    // Verify password
    const passwordValid = await passwordService.verify(password, entity.passwordHash);
    if (!passwordValid) {
      await this.handleFailedAttempt(entity, userType, channel, ipAddress);
      auditService.logSignInFailure({
        email: normalizedEmail,
        reason: 'Invalid password',
        channel,
        ipAddress,
        userAgent,
      });
      return { success: false, error: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' };
    }

    // Check MFA requirement
    if (entity.mfaEnabled) {
      if (!mfaCode) {
        // Generate temporary MFA session and store in Redis
        const mfaSessionToken = uuidv4();
        await storeMfaSession(mfaSessionToken, {
          userId: entity.id,
          userType,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        });
        return { success: true, requiresMfa: true, mfaSessionToken };
      }

      // Verify MFA code
      if (!entity.mfaSecret || !mfaService.verifyCode(entity.mfaSecret, mfaCode)) {
        auditService.logSignInFailure({
          email: normalizedEmail,
          reason: 'Invalid MFA code',
          channel,
          ipAddress,
          userAgent,
        });
        return { success: false, error: 'Invalid MFA code', errorCode: 'INVALID_MFA' };
      }
    }

    // Reset failed attempts on successful login
    entity.failedAttempts = 0;
    entity.lockedUntil = undefined;
    entity.updatedAt = new Date();
    await userRepository.updateEntity(entity, userType);

    // Fetch tenantId for user type from managed_users
    let tenantId: string | undefined;
    if (userType === 'user') {
      const managedUser = await userManagementRepository.findByIdWithoutTenantScope(entity.id);
      tenantId = managedUser?.tenantId;
    }

    // Generate tokens
    const { tokenPair } = await tokenService.generateTokenPair(entity.id, userType, deviceInfo, ipAddress, tenantId);

    auditService.logSignInSuccess({
      userId: entity.id,
      userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true, tokenPair };
  }

  /**
   * Complete MFA verification for pending sign-in
   */
  async completeMfaSignIn(
    mfaSessionToken: string,
    mfaCode: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
    channel: 'web' | 'mobile' | 'api' = 'api'
  ): Promise<AuthResult> {
    // Consume MFA session from Redis (one-time use)
    const session = await consumeMfaSession(mfaSessionToken);
    if (!session || session.expiresAt < Date.now()) {
      return { success: false, error: 'MFA session expired', errorCode: 'MFA_SESSION_EXPIRED' };
    }

    const entity = await userRepository.findEntityById(session.userId, session.userType);
    if (!entity || !entity.mfaSecret) {
      return { success: false, error: 'User not found', errorCode: 'USER_NOT_FOUND' };
    }

    if (!mfaService.verifyCode(entity.mfaSecret, mfaCode)) {
      auditService.logSignInFailure({
        email: entity.email,
        reason: 'Invalid MFA code',
        channel,
        ipAddress,
        userAgent,
      });
      return { success: false, error: 'Invalid MFA code', errorCode: 'INVALID_MFA' };
    }

    // Fetch tenantId for user type from managed_users
    let tenantId: string | undefined;
    if (session.userType === 'user') {
      const managedUser = await userManagementRepository.findByIdWithoutTenantScope(entity.id);
      tenantId = managedUser?.tenantId;
    }

    // Generate tokens
    const { tokenPair } = await tokenService.generateTokenPair(
      entity.id,
      session.userType,
      deviceInfo,
      ipAddress,
      tenantId
    );

    auditService.logSignInSuccess({
      userId: entity.id,
      userType: session.userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true, tokenPair };
  }

  /**
   * Refresh tokens using refresh token rotation (Task 1.8)
   */
  async refreshTokens(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthResult> {
    const result = await tokenService.rotateToken(refreshToken, deviceInfo, ipAddress);
    if (!result) {
      return { success: false, error: 'Invalid refresh token', errorCode: 'INVALID_REFRESH_TOKEN' };
    }

    auditService.log({
      eventType: 'AUTH_TOKEN_REFRESH',
      actorId: result.session.userId,
      actorType: result.session.userType,
      channel: 'api',
      ipAddress,
    });

    return { success: true, tokenPair: result.tokenPair };
  }

  /**
   * Request password reset (Task 1.3)
   */
  async requestPasswordReset(
    email: string,
    userType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; token?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const entity = await userRepository.findEntityByEmail(normalizedEmail, userType);

    // Always return success to prevent email enumeration
    if (!entity) {
      return { success: true };
    }

    // Generate reset token and store only the hash (security best practice)
    const resetToken = uuidv4();
    const tokenHash = hashToken(resetToken);

    const passwordResetToken: PasswordResetToken = {
      id: uuidv4(),
      userId: entity.id,
      userType,
      tokenHash,
      expiresAt: new Date(Date.now() + config.security.passwordResetTtlMinutes * 60 * 1000),
      createdAt: new Date(),
    };

    await passwordResetRepository.create(passwordResetToken);

    auditService.logPasswordResetRequest({
      userId: entity.id,
      userType,
      channel,
      ipAddress,
      userAgent,
    });

    // In production, send email with reset link
    // For now, return token directly (remove in production)
    return { success: true, token: resetToken };
  }

  /**
   * Complete password reset (Task 1.3)
   * Uses a transaction to ensure atomicity of password update and token deletion
   */
  async completePasswordReset(
    token: string,
    newPassword: string,
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Hash the incoming token and use constant-time comparison
    const tokenHash = hashToken(token);
    const resetTokenData = await passwordResetRepository.findByTokenHash(tokenHash);
    
    if (!resetTokenData) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Use constant-time comparison to prevent timing attacks
    if (!secureCompare(tokenHash, resetTokenData.tokenHash)) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    if (resetTokenData.expiresAt < new Date() || resetTokenData.usedAt) {
      // Clean up expired/used token
      await passwordResetRepository.delete(resetTokenData.id);
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Validate new password strength
    const strengthResult = passwordService.validateStrength(newPassword);
    if (!strengthResult.valid) {
      return { success: false, error: strengthResult.errors.join('; ') };
    }

    // Find user
    const entity = await userRepository.findEntityById(resetTokenData.userId, resetTokenData.userType);
    if (!entity) {
      return { success: false, error: 'User not found' };
    }

    // Hash new password
    const newPasswordHash = await passwordService.hash(newPassword);

    // Use transaction for atomicity
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update user password
      await client.query(
        `UPDATE ${resetTokenData.userType === 'user' ? 'users' : 'candidates'}
         SET password_hash = $1, updated_at = NOW(), failed_attempts = 0, locked_until = NULL
         WHERE id = $2`,
        [newPasswordHash, entity.id]
      );

      // Delete reset token
      await client.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetTokenData.id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[AuthService] Password reset transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }

    // Revoke all existing sessions for security (outside transaction - can fail independently)
    await tokenService.revokeAllUserSessions(entity.id, resetTokenData.userType);

    auditService.logPasswordResetSuccess({
      userId: entity.id,
      userType: resetTokenData.userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true };
  }

  /**
   * Sign out - revoke session
   */
  async signOut(
    userId: string,
    userType: 'user' | 'candidate',
    sessionId?: string,
    revokeAll = false
  ): Promise<{ success: boolean }> {
    if (revokeAll) {
      await tokenService.revokeAllUserSessions(userId, userType);
    } else if (sessionId) {
      await tokenService.revokeSession(sessionId);
    }

    auditService.log({
      eventType: 'AUTH_SIGN_OUT',
      actorId: userId,
      actorType: userType,
      channel: 'api',
    });

    return { success: true };
  }

  /**
   * Enable MFA for user (Task 1.4)
   */
  async enableMfa(
    userId: string,
    userType: 'user' | 'candidate',
    secret: string,
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean }> {
    const entity = await userRepository.findEntityById(userId, userType);
    if (!entity) {
      return { success: false };
    }

    entity.mfaEnabled = true;
    entity.mfaSecret = secret;
    entity.updatedAt = new Date();
    await userRepository.updateEntity(entity, userType);

    auditService.logMfaEnrolled({
      userId,
      userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true };
  }

  /**
   * Disable MFA for user
   */
  async disableMfa(
    userId: string,
    userType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<{ success: boolean }> {
    const entity = await userRepository.findEntityById(userId, userType);
    if (!entity) {
      return { success: false };
    }

    entity.mfaEnabled = false;
    entity.mfaSecret = undefined;
    entity.updatedAt = new Date();
    await userRepository.updateEntity(entity, userType);

    auditService.log({
      eventType: 'AUTH_MFA_DISABLED',
      actorId: userId,
      actorType: userType,
      channel,
      ipAddress,
    });

    return { success: true };
  }

  /**
   * Handle failed login attempt (Task 1.6)
   */
  private async handleFailedAttempt(
    entity: User | Candidate,
    userType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api',
    ipAddress?: string
  ): Promise<void> {
    entity.failedAttempts += 1;
    entity.updatedAt = new Date();

    if (entity.failedAttempts >= config.security.maxFailedAttempts) {
      entity.lockedUntil = new Date(
        Date.now() + config.security.lockoutDurationMinutes * 60 * 1000
      );

      auditService.logAccountLocked({
        userId: entity.id,
        userType,
        reason: 'Exceeded maximum failed login attempts',
        channel,
        ipAddress,
      });
    }

    await userRepository.updateEntity(entity, userType);
  }

  /**
   * Get user by ID (for authenticated requests)
   */
  async getUser(userId: string, userType: 'user' | 'candidate'): Promise<Omit<User | Candidate, 'passwordHash' | 'mfaSecret'> | undefined> {
    const entity = await userRepository.findEntityById(userId, userType);
    if (!entity) return undefined;

    // Return without sensitive fields
    const { passwordHash, mfaSecret, ...safe } = entity;
    return safe;
  }
}

export const authService = new AuthService();
