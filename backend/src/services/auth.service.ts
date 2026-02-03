/**
 * Auth Service
 * Task 1.2, 1.3, 1.6: Core authentication business logic
 */

import { v4 as uuidv4 } from 'uuid';
import type { User, Candidate, PasswordResetToken, TokenPair } from '../models/auth.model.js';
import { tokenService } from './token.service.js';
import { passwordService } from './password.service.js';
import { mfaService } from './mfa.service.js';
import { auditService } from './audit.service.js';
import { config } from '../config/index.js';

// In-memory user stores (replace with DB in production)
const users = new Map<string, User>();
const candidates = new Map<string, Candidate>();
const usersByEmail = new Map<string, string>();
const candidatesByEmail = new Map<string, string>();
const passwordResetTokens = new Map<string, PasswordResetToken>();

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

// Temporary MFA sessions for pending MFA verification
const mfaSessions = new Map<string, { userId: string; userType: 'user' | 'candidate'; expiresAt: Date }>();

export class AuthService {
  /**
   * Sign up a new user or candidate
   */
  async signUp(input: SignUpInput): Promise<AuthResult> {
    const { email, password, userType } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    if (userType === 'user' && usersByEmail.has(normalizedEmail)) {
      return { success: false, error: 'Email already registered', errorCode: 'EMAIL_EXISTS' };
    }
    if (userType === 'candidate' && candidatesByEmail.has(normalizedEmail)) {
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

    if (userType === 'user') {
      const user: User = {
        id,
        email: normalizedEmail,
        passwordHash,
        mfaEnabled: false,
        failedAttempts: 0,
        createdAt: now,
        updatedAt: now,
      };
      users.set(id, user);
      usersByEmail.set(normalizedEmail, id);
    } else {
      const candidate: Candidate = {
        id,
        email: normalizedEmail,
        passwordHash,
        mfaEnabled: false,
        failedAttempts: 0,
        createdAt: now,
        updatedAt: now,
      };
      candidates.set(id, candidate);
      candidatesByEmail.set(normalizedEmail, id);
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
    const entity = this.findEntityByEmail(normalizedEmail, userType);
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
        // Generate temporary MFA session
        const mfaSessionToken = uuidv4();
        mfaSessions.set(mfaSessionToken, {
          userId: entity.id,
          userType,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
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

    // Generate tokens
    const { tokenPair } = tokenService.generateTokenPair(entity.id, userType, deviceInfo, ipAddress);

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
    const session = mfaSessions.get(mfaSessionToken);
    if (!session || session.expiresAt < new Date()) {
      mfaSessions.delete(mfaSessionToken);
      return { success: false, error: 'MFA session expired', errorCode: 'MFA_SESSION_EXPIRED' };
    }

    const entity = this.findEntityById(session.userId, session.userType);
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

    // Clean up MFA session
    mfaSessions.delete(mfaSessionToken);

    // Generate tokens
    const { tokenPair } = tokenService.generateTokenPair(
      entity.id,
      session.userType,
      deviceInfo,
      ipAddress
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
  refreshTokens(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): AuthResult {
    const result = tokenService.rotateToken(refreshToken, deviceInfo, ipAddress);
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
    const entity = this.findEntityByEmail(normalizedEmail, userType);

    // Always return success to prevent email enumeration
    if (!entity) {
      return { success: true };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const tokenHash = Buffer.from(resetToken).toString('base64');

    const passwordResetToken: PasswordResetToken = {
      id: uuidv4(),
      userId: entity.id,
      userType,
      tokenHash,
      expiresAt: new Date(Date.now() + config.security.passwordResetTtlMinutes * 60 * 1000),
      createdAt: new Date(),
    };

    passwordResetTokens.set(resetToken, passwordResetToken);

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
   */
  async completePasswordReset(
    token: string,
    newPassword: string,
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    const resetTokenData = passwordResetTokens.get(token);
    if (!resetTokenData) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    if (resetTokenData.expiresAt < new Date() || resetTokenData.usedAt) {
      passwordResetTokens.delete(token);
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Validate new password strength
    const strengthResult = passwordService.validateStrength(newPassword);
    if (!strengthResult.valid) {
      return { success: false, error: strengthResult.errors.join('; ') };
    }

    // Find user and update password
    const entity = this.findEntityById(resetTokenData.userId, resetTokenData.userType);
    if (!entity) {
      return { success: false, error: 'User not found' };
    }

    entity.passwordHash = await passwordService.hash(newPassword);
    entity.updatedAt = new Date();
    entity.failedAttempts = 0;
    entity.lockedUntil = undefined;

    // Mark token as used
    resetTokenData.usedAt = new Date();

    // Revoke all existing sessions for security
    tokenService.revokeAllUserSessions(entity.id, resetTokenData.userType);

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
  signOut(
    userId: string,
    userType: 'user' | 'candidate',
    sessionId?: string,
    revokeAll = false
  ): { success: boolean } {
    if (revokeAll) {
      tokenService.revokeAllUserSessions(userId, userType);
    } else if (sessionId) {
      tokenService.revokeSession(sessionId);
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
    const entity = this.findEntityById(userId, userType);
    if (!entity) {
      return { success: false };
    }

    entity.mfaEnabled = true;
    entity.mfaSecret = secret;
    entity.updatedAt = new Date();

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
    const entity = this.findEntityById(userId, userType);
    if (!entity) {
      return { success: false };
    }

    entity.mfaEnabled = false;
    entity.mfaSecret = undefined;
    entity.updatedAt = new Date();

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
  }

  /**
   * Find user or candidate by email
   */
  private findEntityByEmail(
    email: string,
    userType: 'user' | 'candidate'
  ): User | Candidate | undefined {
    if (userType === 'user') {
      const userId = usersByEmail.get(email);
      return userId ? users.get(userId) : undefined;
    } else {
      const candidateId = candidatesByEmail.get(email);
      return candidateId ? candidates.get(candidateId) : undefined;
    }
  }

  /**
   * Find user or candidate by ID
   */
  private findEntityById(
    id: string,
    userType: 'user' | 'candidate'
  ): User | Candidate | undefined {
    return userType === 'user' ? users.get(id) : candidates.get(id);
  }

  /**
   * Get user by ID (for authenticated requests)
   */
  getUser(userId: string, userType: 'user' | 'candidate'): Omit<User | Candidate, 'passwordHash' | 'mfaSecret'> | undefined {
    const entity = this.findEntityById(userId, userType);
    if (!entity) return undefined;

    // Return without sensitive fields
    const { passwordHash, mfaSecret, ...safe } = entity;
    return safe;
  }
}

export const authService = new AuthService();
