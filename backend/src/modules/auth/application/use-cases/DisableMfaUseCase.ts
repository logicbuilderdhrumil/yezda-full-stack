/**
 * DisableMfa Use Case
 * Removes MFA protection from a user account
 */
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class DisableMfaUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(
    userId: string,
    userType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
  ): Promise<{ success: boolean }> {
    const entity = await this.userRepo.findEntityById(userId, userType);
    if (!entity) {
      return { success: false };
    }

    entity.mfaEnabled = false;
    entity.mfaSecret = undefined;
    entity.updatedAt = new Date();
    await this.userRepo.updateEntity(entity, userType);

    this.auditService.log({
      eventType: 'AUTH_MFA_DISABLED',
      actorId: userId,
      actorType: userType,
      channel,
      ipAddress,
    });

    return { success: true };
  }
}
