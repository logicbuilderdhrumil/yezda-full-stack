/**
 * CompleteMfaSignIn Use Case
 * Completes MFA verification for a pending sign-in
 */
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { IMfaService } from '../../domain/ports/IMfaService.js';
import type { ITokenService } from '../../domain/ports/ITokenService.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMfaSessionStore } from '../../domain/ports/IMfaSessionStore.js';
import type { IUserManagementLookup } from '../../domain/ports/IUserManagementLookup.js';
import type { AuthResult } from '../dtos/AuthDtos.js';

export class CompleteMfaSignInUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly mfaService: IMfaService,
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
    private readonly mfaSessionStore: IMfaSessionStore,
    private readonly userManagementLookup: IUserManagementLookup,
  ) {}

  async execute(
    mfaSessionToken: string,
    mfaCode: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string,
    channel: 'web' | 'mobile' | 'api' = 'api',
  ): Promise<AuthResult> {
    // Consume MFA session from Redis (one-time use)
    const session = await this.mfaSessionStore.consume(mfaSessionToken);
    if (!session || session.expiresAt < Date.now()) {
      return { success: false, error: 'MFA session expired', errorCode: 'MFA_SESSION_EXPIRED' };
    }

    const entity = await this.userRepo.findEntityById(session.userId, session.userType);
    if (!entity || !entity.mfaSecret) {
      return { success: false, error: 'User not found', errorCode: 'USER_NOT_FOUND' };
    }

    if (!this.mfaService.verifyCode(entity.mfaSecret, mfaCode)) {
      this.auditService.logSignInFailure({
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
      const managedUser = await this.userManagementLookup.findByIdWithoutTenantScope(entity.id);
      tenantId = managedUser?.tenantId;
    }

    // Generate tokens
    const { tokenPair } = await this.tokenService.generateTokenPair(
      entity.id,
      session.userType,
      deviceInfo,
      ipAddress,
      tenantId,
    );

    this.auditService.logSignInSuccess({
      userId: entity.id,
      userType: session.userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true, tokenPair };
  }
}
