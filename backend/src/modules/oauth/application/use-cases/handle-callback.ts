import { v4 as uuidv4 } from 'uuid';
import type { OAuthProvider, OAuthCallbackResult, OAuthProviderConfig, IntegrationToken, OAuthTokenResponse } from '../../domain/entities/oauth.entity.js';
import type { IOAuthRepository } from '../../domain/ports/IOAuthRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { ICryptoService } from '../../domain/ports/ICryptoService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class HandleCallbackUseCase {
  constructor(
    private readonly repo: IOAuthRepository,
    private readonly audit: IAuditService,
    private readonly crypto: ICryptoService,
    private readonly metrics: IMetricsService,
    private readonly getProviderConfig: (provider: string) => OAuthProviderConfig | undefined,
  ) {}

  async execute(provider: OAuthProvider, code: string, stateId: string, ipAddress?: string, userAgent?: string): Promise<OAuthCallbackResult> {
    const startTime = Date.now();
    const state = await this.repo.consumeState(stateId);

    if (!state) {
      this.audit.log({ eventType: 'OAUTH_INVALID_STATE', channel: 'api', ipAddress, userAgent, metadata: { provider, stateId }, success: false, errorMessage: 'Invalid or expired state' });
      this.metrics.recordOAuthOperation('callback', provider, false);
      return { success: false, error: 'Invalid or expired OAuth state', errorCode: 'INVALID_STATE' };
    }

    if (state.expiresAt < new Date()) {
      this.metrics.recordOAuthOperation('callback', provider, false);
      return { success: false, error: 'OAuth state has expired', errorCode: 'STATE_EXPIRED' };
    }

    if (state.provider !== provider) {
      this.metrics.recordOAuthOperation('callback', provider, false);
      return { success: false, error: 'Provider mismatch in callback', errorCode: 'PROVIDER_MISMATCH' };
    }

    const providerConfig = this.getProviderConfig(provider);
    if (!providerConfig) return { success: false, error: `Provider ${provider} is not configured`, errorCode: 'PROVIDER_NOT_CONFIGURED' };

    try {
      const tokenResponse = await this.exchangeCodeForTokens(providerConfig, code);
      const expiresAt = new Date(Date.now() + (tokenResponse.expires_in ?? 3600) * 1000);
      const providerAccountId = await this.fetchProviderAccountId(provider, tokenResponse.access_token);

      const now = new Date();
      const token: IntegrationToken = {
        id: uuidv4(), tenantId: state.tenantId, userId: state.userId, userType: state.userType,
        provider, accessTokenEncrypted: this.crypto.encrypt(tokenResponse.access_token),
        refreshTokenEncrypted: tokenResponse.refresh_token ? this.crypto.encrypt(tokenResponse.refresh_token) : undefined,
        scopes: tokenResponse.scope ? tokenResponse.scope.split(' ') : providerConfig.scopes,
        expiresAt, providerAccountId, isActive: true, createdAt: now, updatedAt: now,
      };

      await this.repo.upsertToken(token);
      const duration = Date.now() - startTime;
      this.audit.log({ eventType: 'OAUTH_CALLBACK_SUCCESS', actorId: state.userId, actorType: state.userType, channel: 'api', ipAddress, userAgent, metadata: { provider, tenantId: state.tenantId, providerAccountId, durationMs: duration } });
      this.metrics.recordOAuthOperation('callback', provider, true, duration);
      return { success: true, provider, redirectUrl: state.redirectUrl };
    } catch (err) {
      this.metrics.recordOAuthOperation('callback', provider, false, Date.now() - startTime);
      return { success: false, error: 'Failed to complete OAuth flow', errorCode: 'TOKEN_EXCHANGE_FAILED' };
    }
  }

  private async exchangeCodeForTokens(config: OAuthProviderConfig, code: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, grant_type: 'authorization_code', redirect_uri: config.redirectUri });
    const response = await fetch(config.tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: params.toString() });
    if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
    return (await response.json()) as OAuthTokenResponse;
  }

  private async fetchProviderAccountId(provider: OAuthProvider, accessToken: string): Promise<string | undefined> {
    try {
      const urls: Record<string, string> = { google: 'https://www.googleapis.com/oauth2/v2/userinfo', microsoft: 'https://graph.microsoft.com/v1.0/me', github: 'https://api.github.com/user', slack: 'https://slack.com/api/users.identity' };
      const url = urls[provider];
      if (!url) return undefined;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) return undefined;
      const data = (await response.json()) as Record<string, unknown>;
      if (provider === 'slack') { const user = data.user as Record<string, unknown>; return (user?.email as string) ?? (user?.id as string); }
      return (data.email as string) ?? (data.id as string)?.toString();
    } catch (err) { return undefined; }
  }
}
