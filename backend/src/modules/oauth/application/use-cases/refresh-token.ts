import type { OAuthProviderConfig } from '../../domain/entities/oauth.entity.js';
import type { IOAuthRepository } from '../../domain/ports/IOAuthRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { ICryptoService } from '../../domain/ports/ICryptoService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class RefreshTokenUseCase {
  constructor(
    private readonly repo: IOAuthRepository,
    private readonly audit: IAuditService,
    private readonly crypto: ICryptoService,
    private readonly metrics: IMetricsService,
    private readonly getProviderConfig: (provider: string) => OAuthProviderConfig | undefined,
  ) {}

  async execute(tokenId: string): Promise<{ success: boolean; error?: string }> {
    const token = await this.repo.findTokenById(tokenId);
    if (!token) return { success: false, error: 'Token not found' };
    if (!token.refreshTokenEncrypted) return { success: false, error: 'No refresh token available' };

    const providerConfig = this.getProviderConfig(token.provider);
    if (!providerConfig) return { success: false, error: 'Provider not configured' };

    const startTime = Date.now();
    try {
      const refreshToken = this.crypto.decrypt(token.refreshTokenEncrypted);
      const params = new URLSearchParams({ client_id: providerConfig.clientId, client_secret: providerConfig.clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' });
      const response = await fetch(providerConfig.tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: params.toString() });

      if (!response.ok) {
        await this.repo.markTokenError(tokenId, `Refresh failed: ${response.status}`);
        this.metrics.recordOAuthOperation('refresh', token.provider, false);
        return { success: false, error: 'Token refresh failed' };
      }

      const tokenResponse = (await response.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
      const expiresAt = new Date(Date.now() + (tokenResponse.expires_in ?? 3600) * 1000);
      const accessTokenEncrypted = this.crypto.encrypt(tokenResponse.access_token);
      const refreshTokenEncrypted = tokenResponse.refresh_token ? this.crypto.encrypt(tokenResponse.refresh_token) : undefined;

      await this.repo.updateTokenRefresh(tokenId, accessTokenEncrypted, expiresAt, refreshTokenEncrypted);
      this.audit.log({ eventType: 'OAUTH_TOKEN_REFRESH_SUCCESS', actorType: 'system', targetId: token.userId, channel: 'api', metadata: { provider: token.provider, tenantId: token.tenantId, durationMs: Date.now() - startTime } });
      this.metrics.recordOAuthOperation('refresh', token.provider, true, Date.now() - startTime);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.repo.markTokenError(tokenId, errorMessage);
      this.metrics.recordOAuthOperation('refresh', token.provider, false);
      return { success: false, error: errorMessage };
    }
  }
}
