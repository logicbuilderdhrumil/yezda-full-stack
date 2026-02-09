import type { OAuthProvider } from '../../domain/entities/oauth.entity.js';
import type { IOAuthRepository } from '../../domain/ports/IOAuthRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class DisconnectIntegrationUseCase {
  constructor(
    private readonly repo: IOAuthRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', provider: OAuthProvider, ipAddress?: string): Promise<{ success: boolean }> {
    await this.repo.deactivateToken(tenantId, userId, userType, provider);
    this.audit.log({ eventType: 'OAUTH_INTEGRATION_DISCONNECTED', actorId: userId, actorType: userType, channel: 'api', ipAddress, metadata: { provider, tenantId } });
    this.metrics.recordOAuthOperation('disconnect', provider, true);
    return { success: true };
  }
}
