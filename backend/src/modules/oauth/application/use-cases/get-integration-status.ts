import type { OAuthProvider, IntegrationStatus } from '../../domain/entities/oauth.entity.js';
import type { IOAuthRepository } from '../../domain/ports/IOAuthRepository.js';

export class GetIntegrationStatusUseCase {
  constructor(private readonly repo: IOAuthRepository) {}

  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', provider: OAuthProvider): Promise<IntegrationStatus> {
    const token = await this.repo.findToken(tenantId, userId, userType, provider);
    if (!token) return { provider, connected: false, active: false, scopes: [], hasError: false };
    return { provider, connected: true, active: token.isActive, providerAccountId: token.providerAccountId, scopes: token.scopes, expiresAt: token.expiresAt, lastRefreshedAt: token.lastRefreshedAt, hasError: !!token.lastRefreshError, errorMessage: token.lastRefreshError };
  }
}

export class GetAllIntegrationStatusesUseCase {
  constructor(
    private readonly repo: IOAuthRepository,
    private readonly getConfiguredProviders: () => OAuthProvider[],
  ) {}

  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate'): Promise<IntegrationStatus[]> {
    const tokens = await this.repo.findTokensByUser(tenantId, userId, userType);
    return this.getConfiguredProviders().map((provider) => {
      const token = tokens.find((t) => t.provider === provider);
      if (!token) return { provider, connected: false, active: false, scopes: [], hasError: false };
      return { provider, connected: true, active: token.isActive, providerAccountId: token.providerAccountId, scopes: token.scopes, expiresAt: token.expiresAt, lastRefreshedAt: token.lastRefreshedAt, hasError: !!token.lastRefreshError, errorMessage: token.lastRefreshError };
    });
  }
}
