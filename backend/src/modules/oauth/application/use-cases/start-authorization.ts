import { v4 as uuidv4 } from 'uuid';
import type { OAuthAuthorizeRequest, OAuthAuthorizeResponse, OAuthProviderConfig, OAuthState } from '../../domain/entities/oauth.entity.js';
import type { IOAuthRepository } from '../../domain/ports/IOAuthRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class StartAuthorizationUseCase {
  constructor(
    private readonly repo: IOAuthRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
    private readonly getProviderConfig: (provider: string) => OAuthProviderConfig | undefined,
    private readonly stateExpiryMinutes: number,
  ) {}

  async execute(request: OAuthAuthorizeRequest): Promise<OAuthAuthorizeResponse> {
    const { provider, tenantId, userId, userType, redirectUrl } = request;
    const providerConfig = this.getProviderConfig(provider);
    if (!providerConfig) throw new Error(`Provider ${provider} is not configured`);

    const stateId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.stateExpiryMinutes * 60 * 1000);

    const state: OAuthState = { id: stateId, tenantId, userId, userType, provider, redirectUrl, expiresAt, createdAt: now };
    await this.repo.createState(state);

    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      response_type: 'code',
      scope: providerConfig.scopes.join(' '),
      state: stateId,
      access_type: 'offline',
      prompt: 'consent',
    });

    this.audit.log({ eventType: 'OAUTH_AUTHORIZE_INITIATED', actorId: userId, actorType: userType, channel: 'api', metadata: { provider, tenantId } });
    this.metrics.recordOAuthOperation('authorize', provider, true);

    return { authorizationUrl: `${providerConfig.authorizationUrl}?${params.toString()}`, state: stateId };
  }
}
