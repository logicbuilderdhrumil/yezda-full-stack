/**
 * OAuth Integration Types
 * Frontend types aligned with backend OAuth models
 */

/** Supported OAuth providers */
export type OAuthProvider = 'google' | 'microsoft' | 'slack' | 'github';

/** OAuth authorization response */
export interface OAuthAuthorizeResponse {
  authorizationUrl: string;
  state: string;
}

/** Integration status (no sensitive data) */
export interface IntegrationStatus {
  provider: OAuthProvider;
  connected: boolean;
  active: boolean;
  providerAccountId?: string;
  scopes: string[];
  expiresAt?: string;
  lastRefreshedAt?: string;
  hasError: boolean;
  errorMessage?: string;
}

/** OAuth callback result */
export interface OAuthCallbackResult {
  success: boolean;
  provider?: OAuthProvider | undefined;
  error?: string | undefined;
  errorCode?: string | undefined;
  redirectUrl?: string | undefined;
}

/** OAuth provider info */
export interface OAuthProviderInfo {
  provider: OAuthProvider;
  displayName: string;
  icon: string;
  connected: boolean;
}

/** OAuth error */
export interface OAuthError {
  code: string;
  message: string;
  provider?: OAuthProvider;
}
