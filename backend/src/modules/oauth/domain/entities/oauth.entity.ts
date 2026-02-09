/**
 * OAuth Domain Entities
 */

export type OAuthProvider = 'google' | 'microsoft' | 'slack' | 'github';

export interface OAuthProviderConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface OAuthState {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  provider: OAuthProvider;
  redirectUrl?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IntegrationToken {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  provider: OAuthProvider;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  scopes: string[];
  expiresAt: Date;
  providerAccountId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRefreshedAt?: Date;
  lastRefreshError?: string;
}

export interface IntegrationStatus {
  provider: OAuthProvider;
  connected: boolean;
  active: boolean;
  providerAccountId?: string;
  scopes: string[];
  expiresAt?: Date;
  lastRefreshedAt?: Date;
  hasError: boolean;
  errorMessage?: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  provider?: OAuthProvider;
  error?: string;
  errorCode?: string;
  redirectUrl?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export interface OAuthAuthorizeRequest {
  provider: OAuthProvider;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  redirectUrl?: string;
}

export interface OAuthAuthorizeResponse {
  authorizationUrl: string;
  state: string;
}
