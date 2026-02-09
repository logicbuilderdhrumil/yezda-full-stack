/**
 * SignOut Use Case
 * Revokes the current session or all sessions for the user
 */
import type { ITokenService } from '../../domain/ports/ITokenService.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class SignOutUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(
    userId: string,
    userType: 'user' | 'candidate',
    sessionId?: string,
    revokeAll = false,
  ): Promise<{ success: boolean }> {
    if (revokeAll) {
      await this.tokenService.revokeAllUserSessions(userId, userType);
    } else if (sessionId) {
      await this.tokenService.revokeSession(sessionId);
    }

    this.auditService.log({
      eventType: 'AUTH_SIGN_OUT',
      actorId: userId,
      actorType: userType,
      channel: 'api',
    });

    return { success: true };
  }
}
