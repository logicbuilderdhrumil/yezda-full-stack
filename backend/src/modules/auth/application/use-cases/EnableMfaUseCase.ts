/**
 * EnableMfa Use Case
 * Enables MFA for a user by persisting the TOTP secret
 */
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class EnableMfaUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(
    userId: string,
    userType: 'user' | 'candidate',
    secret: string,
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    const entity = await this.userRepo.findEntityById(userId, userType);
    if (!entity) {
      return { success: false };
    }

    entity.mfaEnabled = true;
    entity.mfaSecret = secret;
    entity.updatedAt = new Date();
    await this.userRepo.updateEntity(entity, userType);

    this.auditService.logMfaEnrolled({
      userId,
      userType,
      channel,
      ipAddress,
      userAgent,
    });

    return { success: true };
  }
}
