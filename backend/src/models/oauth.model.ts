/**
 * OAuth Integration Models
 * Task 1.1: Define OAuth provider configuration and token storage schema
 */

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'google' | 'microsoft' | 'slack' | 'github';

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

/**
 * OAuth state for CSRF protection
 * Stored temporarily during OAuth flow
 */
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

/**
 * Stored integration token (encrypted at rest)
 */
export interface IntegrationToken {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  provider: OAuthProvider;
  /** Encrypted access token */
  accessTokenEncrypted: string;
  /** Encrypted refresh token (if provided) */
  refreshTokenEncrypted?: string;
  /** Token scopes granted by provider */
  scopes: string[];
  /** When the access token expires */
  expiresAt: Date;
  /** Provider-specific user ID or email */
  providerAccountId?: string;
  /** Whether the integration is active */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Last time token was refreshed */
  lastRefreshedAt?: Date;
  /** Last refresh error if any */
  lastRefreshError?: string;
}

/**
 * Integration status returned to clients (no sensitive data)
 */
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

/**
 * OAuth callback result
 */
export interface OAuthCallbackResult {
  success: boolean;
  provider?: OAuthProvider;
  error?: string;
  errorCode?: string;
  redirectUrl?: string;
}

/**
 * OAuth token exchange response from provider
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

/**
 * OAuth user info from provider (varies by provider)
 */
export interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
}

/**
 * OAuth authorization request
 */
export interface OAuthAuthorizeRequest {
  provider: OAuthProvider;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  redirectUrl?: string;
}

/**
 * OAuth authorization response
 */
export interface OAuthAuthorizeResponse {
  authorizationUrl: string;
  state: string;
}
