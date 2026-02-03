/**
 * OAuth Integration Service
 * Task 1.2, 1.3, 1.5, 1.6: OAuth authorization, callback handling, token refresh, and audit logging
 *
 * Handles OAuth flows for external integrations with secure token storage and CSRF protection.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  OAuthProvider,
  OAuthProviderConfig,
  OAuthState,
  IntegrationToken,
  IntegrationStatus,
  OAuthCallbackResult,
  OAuthAuthorizeRequest,
  OAuthAuthorizeResponse,
  OAuthTokenResponse,
} from '../models/oauth.model.js';
import { oauthRepository } from '../repositories/oauth.repository.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { encrypt, decrypt } from './crypto.service.js';
import { config } from '../config/index.js';

/**
 * OAuth provider endpoint configurations
 */
const PROVIDER_CONFIGS: Record<OAuthProvider, Omit<OAuthProviderConfig, 'clientId' | 'clientSecret' | 'redirectUri'>> = {
  google: {
    provider: 'google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['openid', 'email', 'profile'],
  },
  microsoft: {
    provider: 'microsoft',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['openid', 'email', 'profile', 'offline_access'],
  },
  slack: {
    provider: 'slack',
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['openid', 'email', 'profile'],
  },
  github: {
    provider: 'github',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'user:email'],
  },
};

/**
 * Get full provider config with credentials
 */
function getProviderConfig(provider: OAuthProvider): OAuthProviderConfig | undefined {
  const baseConfig = PROVIDER_CONFIGS[provider];
  const credentials = config.oauth.providers[provider];

  if (!credentials) {
    return undefined;
  }

  return {
    ...baseConfig,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri: `${config.oauth.baseRedirectUri}/${provider}`,
  };
}

export class OAuthService {
  /**
   * Get configured providers
   */
  getConfiguredProviders(): OAuthProvider[] {
    return (Object.keys(config.oauth.providers) as OAuthProvider[]).filter(
      (p) => config.oauth.providers[p] !== undefined
    );
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: OAuthProvider): boolean {
    return config.oauth.providers[provider] !== undefined;
  }

  /**
   * Task 1.2: Generate authorization URL and store state for CSRF protection
   */
  async startAuthorization(request: OAuthAuthorizeRequest): Promise<OAuthAuthorizeResponse> {
    const { provider, tenantId, userId, userType, redirectUrl } = request;

    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    // Generate cryptographically secure state for CSRF protection
    const stateId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.oauth.stateExpiryMinutes * 60 * 1000);

    // Store state in database for validation on callback
    const state: OAuthState = {
      id: stateId,
      tenantId,
      userId,
      userType,
      provider,
      redirectUrl,
      expiresAt,
      createdAt: now,
    };

    await oauthRepository.createState(state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      response_type: 'code',
      scope: providerConfig.scopes.join(' '),
      state: stateId,
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen for refresh token
    });

    const authorizationUrl = `${providerConfig.authorizationUrl}?${params.toString()}`;

    // Audit log
    auditService.log({
      eventType: 'OAUTH_AUTHORIZE_INITIATED',
      actorId: userId,
      actorType: userType,
      channel: 'api',
      metadata: {
        provider,
        tenantId,
      },
    });

    metricsService.recordOAuthOperation('authorize', provider, true);

    return { authorizationUrl, state: stateId };
  }

  /**
   * Task 1.2, 1.5: Handle OAuth callback with CSRF validation
   */
  async handleCallback(
    provider: OAuthProvider,
    code: string,
    stateId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<OAuthCallbackResult> {
    const startTime = Date.now();

    // Task 1.5: Validate state for CSRF protection (one-time use)
    const state = await oauthRepository.consumeState(stateId);

    if (!state) {
      auditService.log({
        eventType: 'OAUTH_INVALID_STATE',
        channel: 'api',
        ipAddress,
        userAgent,
        metadata: { provider, stateId },
        success: false,
        errorMessage: 'Invalid or expired state',
      });

      metricsService.recordOAuthOperation('callback', provider, false);

      return {
        success: false,
        error: 'Invalid or expired OAuth state',
        errorCode: 'INVALID_STATE',
      };
    }

    // Validate state hasn't expired
    if (state.expiresAt < new Date()) {
      auditService.log({
        eventType: 'OAUTH_INVALID_STATE',
        actorId: state.userId,
        actorType: state.userType,
        channel: 'api',
        ipAddress,
        userAgent,
        metadata: { provider, tenantId: state.tenantId },
        success: false,
        errorMessage: 'State expired',
      });

      metricsService.recordOAuthOperation('callback', provider, false);

      return {
        success: false,
        error: 'OAuth state has expired',
        errorCode: 'STATE_EXPIRED',
      };
    }

    // Validate provider matches
    if (state.provider !== provider) {
      auditService.log({
        eventType: 'OAUTH_CALLBACK_FAILURE',
        actorId: state.userId,
        actorType: state.userType,
        channel: 'api',
        ipAddress,
        userAgent,
        metadata: {
          expectedProvider: state.provider,
          actualProvider: provider,
          tenantId: state.tenantId,
        },
        success: false,
        errorMessage: 'Provider mismatch',
      });

      metricsService.recordOAuthOperation('callback', provider, false);

      return {
        success: false,
        error: 'Provider mismatch in callback',
        errorCode: 'PROVIDER_MISMATCH',
      };
    }

    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      return {
        success: false,
        error: `Provider ${provider} is not configured`,
        errorCode: 'PROVIDER_NOT_CONFIGURED',
      };
    }

    try {
      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(providerConfig, code);

      // Calculate expiry
      const expiresInSeconds = tokenResponse.expires_in ?? 3600;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      // Get provider account ID if available
      const providerAccountId = await this.fetchProviderAccountId(
        provider,
        tokenResponse.access_token
      );

      // Encrypt tokens for storage
      const accessTokenEncrypted = encrypt(tokenResponse.access_token);
      const refreshTokenEncrypted = tokenResponse.refresh_token
        ? encrypt(tokenResponse.refresh_token)
        : undefined;

      const scopes = tokenResponse.scope ? tokenResponse.scope.split(' ') : providerConfig.scopes;

      // Store integration token
      const now = new Date();
      const token: IntegrationToken = {
        id: uuidv4(),
        tenantId: state.tenantId,
        userId: state.userId,
        userType: state.userType,
        provider,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        scopes,
        expiresAt,
        providerAccountId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await oauthRepository.upsertToken(token);

      const duration = Date.now() - startTime;

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'OAUTH_CALLBACK_SUCCESS',
        actorId: state.userId,
        actorType: state.userType,
        channel: 'api',
        ipAddress,
        userAgent,
        metadata: {
          provider,
          tenantId: state.tenantId,
          providerAccountId,
          scopes,
          durationMs: duration,
        },
      });

      metricsService.recordOAuthOperation('callback', provider, true, duration);

      return {
        success: true,
        provider,
        redirectUrl: state.redirectUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token exchange failed';
      const duration = Date.now() - startTime;

      auditService.log({
        eventType: 'OAUTH_CALLBACK_FAILURE',
        actorId: state.userId,
        actorType: state.userType,
        channel: 'api',
        ipAddress,
        userAgent,
        metadata: {
          provider,
          tenantId: state.tenantId,
          durationMs: duration,
        },
        success: false,
        errorMessage,
      });

      metricsService.recordOAuthOperation('callback', provider, false, duration);

      return {
        success: false,
        error: 'Failed to complete OAuth flow',
        errorCode: 'TOKEN_EXCHANGE_FAILED',
      };
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    providerConfig: OAuthProviderConfig,
    code: string
  ): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: providerConfig.redirectUri,
    });

    const response = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OAuthService] Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return (await response.json()) as OAuthTokenResponse;
  }

  /**
   * Fetch provider account ID (email or user ID) for display
   */
  private async fetchProviderAccountId(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<string | undefined> {
    try {
      let userInfoUrl: string;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };

      switch (provider) {
        case 'google':
          userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
          break;
        case 'microsoft':
          userInfoUrl = 'https://graph.microsoft.com/v1.0/me';
          break;
        case 'github':
          userInfoUrl = 'https://api.github.com/user';
          headers['Accept'] = 'application/vnd.github+json';
          break;
        case 'slack':
          userInfoUrl = 'https://slack.com/api/users.identity';
          break;
        default:
          return undefined;
      }

      const response = await fetch(userInfoUrl, { headers });
      if (!response.ok) {
        return undefined;
      }

      const data = (await response.json()) as Record<string, unknown>;

      // Extract email or ID based on provider response structure
      if (provider === 'slack') {
        const user = data.user as Record<string, unknown>;
        return (user?.email as string) ?? (user?.id as string);
      }

      return (data.email as string) ?? (data.id as string)?.toString();
    } catch {
      console.warn('[OAuthService] Failed to fetch provider account ID');
      return undefined;
    }
  }

  /**
   * Task 1.3: Get integration status for a user
   */
  async getIntegrationStatus(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: OAuthProvider
  ): Promise<IntegrationStatus> {
    const token = await oauthRepository.findToken(tenantId, userId, userType, provider);

    if (!token) {
      return {
        provider,
        connected: false,
        active: false,
        scopes: [],
        hasError: false,
      };
    }

    return {
      provider,
      connected: true,
      active: token.isActive,
      providerAccountId: token.providerAccountId,
      scopes: token.scopes,
      expiresAt: token.expiresAt,
      lastRefreshedAt: token.lastRefreshedAt,
      hasError: !!token.lastRefreshError,
      errorMessage: token.lastRefreshError,
    };
  }

  /**
   * Task 1.3: Get all integration statuses for a user
   */
  async getAllIntegrationStatuses(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<IntegrationStatus[]> {
    const tokens = await oauthRepository.findTokensByUser(tenantId, userId, userType);
    const configuredProviders = this.getConfiguredProviders();

    return configuredProviders.map((provider) => {
      const token = tokens.find((t) => t.provider === provider);

      if (!token) {
        return {
          provider,
          connected: false,
          active: false,
          scopes: [],
          hasError: false,
        };
      }

      return {
        provider,
        connected: true,
        active: token.isActive,
        providerAccountId: token.providerAccountId,
        scopes: token.scopes,
        expiresAt: token.expiresAt,
        lastRefreshedAt: token.lastRefreshedAt,
        hasError: !!token.lastRefreshError,
        errorMessage: token.lastRefreshError,
      };
    });
  }

  /**
   * Task 1.2: Refresh an integration token
   */
  async refreshToken(tokenId: string): Promise<{ success: boolean; error?: string }> {
    const token = await oauthRepository.findTokenById(tokenId);

    if (!token) {
      return { success: false, error: 'Token not found' };
    }

    if (!token.refreshTokenEncrypted) {
      return { success: false, error: 'No refresh token available' };
    }

    const providerConfig = getProviderConfig(token.provider);
    if (!providerConfig) {
      return { success: false, error: 'Provider not configured' };
    }

    const startTime = Date.now();

    try {
      const refreshToken = decrypt(token.refreshTokenEncrypted);

      const params = new URLSearchParams({
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(providerConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OAuthService] Token refresh failed:', errorText);

        await oauthRepository.markTokenError(tokenId, `Refresh failed: ${response.status}`);

        auditService.log({
          eventType: 'OAUTH_TOKEN_REFRESH_FAILURE',
          actorType: 'system',
          targetId: token.userId,
          targetType: token.userType,
          channel: 'api',
          metadata: {
            provider: token.provider,
            tenantId: token.tenantId,
            status: response.status,
          },
          success: false,
          errorMessage: `Refresh failed: ${response.status}`,
        });

        metricsService.recordOAuthOperation('refresh', token.provider, false);

        return { success: false, error: 'Token refresh failed' };
      }

      const tokenResponse = (await response.json()) as OAuthTokenResponse;

      const expiresInSeconds = tokenResponse.expires_in ?? 3600;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      const accessTokenEncrypted = encrypt(tokenResponse.access_token);
      const refreshTokenEncrypted = tokenResponse.refresh_token
        ? encrypt(tokenResponse.refresh_token)
        : undefined;

      await oauthRepository.updateTokenRefresh(
        tokenId,
        accessTokenEncrypted,
        expiresAt,
        refreshTokenEncrypted
      );

      const duration = Date.now() - startTime;

      auditService.log({
        eventType: 'OAUTH_TOKEN_REFRESH_SUCCESS',
        actorType: 'system',
        targetId: token.userId,
        targetType: token.userType,
        channel: 'api',
        metadata: {
          provider: token.provider,
          tenantId: token.tenantId,
          durationMs: duration,
        },
      });

      metricsService.recordOAuthOperation('refresh', token.provider, true, duration);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await oauthRepository.markTokenError(tokenId, errorMessage);

      auditService.log({
        eventType: 'OAUTH_TOKEN_REFRESH_FAILURE',
        actorType: 'system',
        targetId: token.userId,
        targetType: token.userType,
        channel: 'api',
        metadata: {
          provider: token.provider,
          tenantId: token.tenantId,
        },
        success: false,
        errorMessage,
      });

      metricsService.recordOAuthOperation('refresh', token.provider, false);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Disconnect an integration
   */
  async disconnectIntegration(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: OAuthProvider,
    ipAddress?: string
  ): Promise<{ success: boolean }> {
    await oauthRepository.deactivateToken(tenantId, userId, userType, provider);

    auditService.log({
      eventType: 'OAUTH_INTEGRATION_DISCONNECTED',
      actorId: userId,
      actorType: userType,
      channel: 'api',
      ipAddress,
      metadata: {
        provider,
        tenantId,
      },
    });

    metricsService.recordOAuthOperation('disconnect', provider, true);

    return { success: true };
  }

  /**
   * Get decrypted access token for use in API calls
   */
  async getAccessToken(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: OAuthProvider
  ): Promise<string | undefined> {
    const token = await oauthRepository.findToken(tenantId, userId, userType, provider);

    if (!token || !token.isActive) {
      return undefined;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiryBuffer = 5 * 60 * 1000;
    if (token.expiresAt.getTime() - Date.now() < expiryBuffer) {
      // Attempt refresh
      const refreshResult = await this.refreshToken(token.id);
      if (!refreshResult.success) {
        return undefined;
      }

      // Fetch updated token
      const updatedToken = await oauthRepository.findTokenById(token.id);
      if (!updatedToken) {
        return undefined;
      }

      return decrypt(updatedToken.accessTokenEncrypted);
    }

    return decrypt(token.accessTokenEncrypted);
  }

  /**
   * Clean up expired OAuth states (called periodically)
   */
  async cleanupExpiredStates(): Promise<number> {
    return oauthRepository.deleteExpiredStates();
  }

  /**
   * Refresh tokens that are about to expire (called periodically)
   */
  async refreshExpiringTokens(thresholdMinutes: number = 30): Promise<{
    refreshed: number;
    failed: number;
  }> {
    const expiringTokens = await oauthRepository.findExpiringTokens(thresholdMinutes);

    let refreshed = 0;
    let failed = 0;

    for (const token of expiringTokens) {
      const result = await this.refreshToken(token.id);
      if (result.success) {
        refreshed++;
      } else {
        failed++;
      }
    }

    return { refreshed, failed };
  }
}

export const oauthService = new OAuthService();
