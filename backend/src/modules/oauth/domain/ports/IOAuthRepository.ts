import type { OAuthProvider, OAuthState, IntegrationToken } from '../entities/oauth.entity.js';

export interface IOAuthRepository {
  createState(state: OAuthState): Promise<void>;
  consumeState(stateId: string): Promise<OAuthState | null>;
  deleteExpiredStates(): Promise<number>;
  upsertToken(token: IntegrationToken): Promise<void>;
  findToken(tenantId: string, userId: string, userType: string, provider: OAuthProvider): Promise<IntegrationToken | null>;
  findTokenById(tokenId: string): Promise<IntegrationToken | null>;
  findTokensByUser(tenantId: string, userId: string, userType: string): Promise<IntegrationToken[]>;
  updateTokenRefresh(tokenId: string, accessTokenEncrypted: string, expiresAt: Date, refreshTokenEncrypted?: string): Promise<void>;
  markTokenError(tokenId: string, errorMessage: string): Promise<void>;
  deactivateToken(tenantId: string, userId: string, userType: string, provider: OAuthProvider): Promise<void>;
  findExpiringTokens(thresholdMinutes: number): Promise<IntegrationToken[]>;
}
