import type { OAuthProvider, OAuthState, IntegrationToken } from '../../domain/entities/oauth.entity.js';
import type { IOAuthRepository } from '../../domain/ports/IOAuthRepository.js';
import { oauthRepository as legacyRepo } from '../../../repositories/oauth.repository.js';

/**
 * Adapts the legacy oauthRepository singleton to the IOAuthRepository port.
 */
export class LegacyOAuthRepository implements IOAuthRepository {
  async createState(state: OAuthState): Promise<void> {
    return legacyRepo.createState(state);
  }
  async consumeState(stateId: string): Promise<OAuthState | null> {
    return legacyRepo.consumeState(stateId);
  }
  async deleteExpiredStates(): Promise<number> {
    return legacyRepo.deleteExpiredStates();
  }
  async upsertToken(token: IntegrationToken): Promise<void> {
    return legacyRepo.upsertToken(token);
  }
  async findToken(tenantId: string, userId: string, userType: string, provider: OAuthProvider): Promise<IntegrationToken | null> {
    return legacyRepo.findToken(tenantId, userId, userType, provider);
  }
  async findTokenById(tokenId: string): Promise<IntegrationToken | null> {
    return legacyRepo.findTokenById(tokenId);
  }
  async findTokensByUser(tenantId: string, userId: string, userType: string): Promise<IntegrationToken[]> {
    return legacyRepo.findTokensByUser(tenantId, userId, userType);
  }
  async updateTokenRefresh(tokenId: string, accessTokenEncrypted: string, expiresAt: Date, refreshTokenEncrypted?: string): Promise<void> {
    return legacyRepo.updateTokenRefresh(tokenId, accessTokenEncrypted, expiresAt, refreshTokenEncrypted);
  }
  async markTokenError(tokenId: string, errorMessage: string): Promise<void> {
    return legacyRepo.markTokenError(tokenId, errorMessage);
  }
  async deactivateToken(tenantId: string, userId: string, userType: string, provider: OAuthProvider): Promise<void> {
    return legacyRepo.deactivateToken(tenantId, userId, userType, provider);
  }
  async findExpiringTokens(thresholdMinutes: number): Promise<IntegrationToken[]> {
    return legacyRepo.findExpiringTokens(thresholdMinutes);
  }
}
