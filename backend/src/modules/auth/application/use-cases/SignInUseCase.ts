/**
 * SignIn Use Case
 * Authenticates a user or candidate with credentials
 */
import { v4 as uuidv4 } from 'uuid';
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { IPasswordService } from '../../domain/ports/IPasswordService.js';
import type { IMfaService } from '../../domain/ports/IMfaService.js';
import type { ITokenService } from '../../domain/ports/ITokenService.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMfaSessionStore } from '../../infrastructure/adapters/MfaSessionAdapter.js';
import type { SignInInput, AuthResult } from '../dtos/AuthDtos.js';
import type { User, Candidate } from '../../domain/entities/index.js';

/**
 * External dependency for resolving tenantId from managed_users table.
 * Injected to avoid coupling the auth module to the user-management module.
 */
export interface IUserManagementLookup {
  findByIdWithoutTenantScope(id: string): Promise<{ tenantId?: string } | undefined>;
}

export class SignInUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly mfaService: IMfaService,
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
    private readonly mfaSessionStore: IMfaSessionStore,
    private readonly userManagementLookup: IUserManagementLookup,
    private readonly maxFailedAttempts: number,
    private readonly lockoutDurationMinutes: number,
  ) {}

  async execute(input: SignInInput): Promise<AuthResult> {
    const { email, password, userType, mfaCode, deviceInfo, ipAddress, userAgent, channel } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const entity = await this.userRepo.findEntityByEmail(normalizedEmail, userType);
    if (!entity) {
      this.auditService.logSignInFailure({
        email: normalizedEmail,
        reason: 'User not found',
        channel,
        ipAddress,
        userAgent,
      });
      return { success: false, error: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' };
    }

    // Check lockout
    if (entity.lockedUntil && entity.lockedUntil > new Date()) {
      this.auditService.logSignInFailure({
        email: normalizedEmail,
        reason: 'Account locked',
        channel,
        ipAddress,
        userAgent,
      });
      return { success: false, error: 'Account is locked. Try again later.', errorCode: 'ACCOUNT_LOCKED' };
    }

    // Verify password
    const passwordValid = await this.passwordService.verify(password, entity.passwordHash);
    if (!passwordValid) {
      await this.handleFailedAttempt(entity, userType, channel, ipAddress);
      this.auditService.logSignInFailure({
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
        await this.mfaSessionStore.store(mfaSessionToken, {
          userId: entity.id,
          userType,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        });
        return { success: true, requiresMfa: true, mfaSessionToken };
      }

      // Verify MFA code
      if (!entity.mfaSecret || !this.mfaService.verifyCode(entity.mfaSecret, mfaCode)) {
        this.auditService.logSignInFailure({
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
    await this.userRepo.updateEntity(entity, userType);

    // Fetch tenantId for user type from managed_users
    let tenantId: string | undefined;
    if (userType === 'user') {
      const managedUser = await this.userManagementLookup.findByIdWithoutTenantScope(entity.id);
      tenantId = managedUser?.tenantId;
    }

    // Generate tokens
    const { tokenPair } = await this.tokenService.generateTokenPair(
      entity.id,
      userType,
      deviceInfo,
      ipAddress,
      tenantId,
    );

    this.auditService.logSignInSuccess({
      userId: entity.id,
      userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true, tokenPair };
  }

  /**
   * Handle failed login attempt — increment counter and optionally lock account
   */
  private async handleFailedAttempt(
    entity: User | Candidate,
    userType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api',
    ipAddress?: string,
  ): Promise<void> {
    entity.failedAttempts += 1;
    entity.updatedAt = new Date();

    if (entity.failedAttempts >= this.maxFailedAttempts) {
      entity.lockedUntil = new Date(
        Date.now() + this.lockoutDurationMinutes * 60 * 1000,
      );

      this.auditService.logAccountLocked({
        userId: entity.id,
        userType,
        reason: 'Exceeded maximum failed login attempts',
        channel,
        ipAddress,
      });
    }

    await this.userRepo.updateEntity(entity, userType);
  }
}
