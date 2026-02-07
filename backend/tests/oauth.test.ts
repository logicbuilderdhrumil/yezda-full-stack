/**
 * OAuth Integration Tests
 * Task 1.4: Tests for OAuth verification and token refresh
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { oauthService } from '../src/services/oauth.service.js';
import { oauthRepository } from '../src/repositories/oauth.repository.js';
import type {
  OAuthProvider,
  OAuthState,
  IntegrationToken,
} from '../src/models/oauth.model.js';

// Mock fetch for OAuth provider calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock repositories
vi.mock('../src/repositories/oauth.repository.js', () => ({
  oauthRepository: {
    createState: vi.fn(),
    consumeState: vi.fn(),
    deleteExpiredStates: vi.fn(),
    findToken: vi.fn(),
    findTokenById: vi.fn(),
    findTokensByUser: vi.fn(),
    upsertToken: vi.fn(),
    updateTokenRefresh: vi.fn(),
    markTokenError: vi.fn(),
    deactivateToken: vi.fn(),
    findExpiringTokens: vi.fn(),
  },
}));

// Mock audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
    logAnomaly: vi.fn(),
  },
}));

// Mock metrics service
vi.mock('../src/services/metrics.service.js', () => ({
  metricsService: {
    recordOAuthOperation: vi.fn(),
    incrementCounter: vi.fn(),
  },
  OAUTH_METRICS: {
    AUTHORIZE_INITIATED: 'oauth_authorize_initiated_total',
    CALLBACK_SUCCESS: 'oauth_callback_success_total',
    CALLBACK_FAILURE: 'oauth_callback_failure_total',
    CALLBACK_LATENCY: 'oauth_callback_latency_ms',
    TOKEN_REFRESH_SUCCESS: 'oauth_token_refresh_success_total',
    TOKEN_REFRESH_FAILURE: 'oauth_token_refresh_failure_total',
    TOKEN_REFRESH_LATENCY: 'oauth_token_refresh_latency_ms',
    DISCONNECT: 'oauth_disconnect_total',
    INVALID_STATE: 'oauth_invalid_state_total',
  },
}));

// Mock crypto service
vi.mock('../src/services/crypto.service.js', () => ({
  encrypt: vi.fn((value: string) => `encrypted:${value}`),
  decrypt: vi.fn((value: string) => value.replace('encrypted:', '')),
}));

// Mock config
vi.mock('../src/config/index.js', () => ({
  config: {
    oauth: {
      stateExpiryMinutes: 10,
      tokenEncryptionKey: 'test-encryption-key-for-oauth-32ch',
      baseRedirectUri: 'http://localhost:6312/api/v1/oauth/callback',
      providers: {
        google: {
          clientId: 'test-google-client-id',
          clientSecret: 'test-google-client-secret',
        },
        github: {
          clientId: 'test-github-client-id',
          clientSecret: 'test-github-client-secret',
        },
      },
    },
    rateLimit: {
      windowMs: 60000,
      maxOAuthRequests: 20,
    },
  },
}));

describe('OAuth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Provider Configuration', () => {
    it('should return configured providers', () => {
      const providers = oauthService.getConfiguredProviders();
      expect(providers).toContain('google');
      expect(providers).toContain('github');
    });

    it('should correctly identify configured providers', () => {
      expect(oauthService.isProviderConfigured('google')).toBe(true);
      expect(oauthService.isProviderConfigured('github')).toBe(true);
      expect(oauthService.isProviderConfigured('microsoft')).toBe(false);
      expect(oauthService.isProviderConfigured('slack')).toBe(false);
    });
  });

  describe('Authorization Flow', () => {
    it('should generate authorization URL with state', async () => {
      vi.mocked(oauthRepository.createState).mockResolvedValue();

      const result = await oauthService.startAuthorization({
        provider: 'google',
        tenantId: 'tenant-123',
        userId: 'user-456',
        userType: 'user',
        redirectUrl: 'http://app/settings',
      });

      expect(result.authorizationUrl).toContain('https://accounts.google.com');
      expect(result.authorizationUrl).toContain('client_id=test-google-client-id');
      expect(result.authorizationUrl).toContain('state=');
      expect(result.state).toBeDefined();
      expect(result.state.length).toBe(36); // UUID format

      expect(oauthRepository.createState).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          userId: 'user-456',
          userType: 'user',
          provider: 'google',
          redirectUrl: 'http://app/settings',
        })
      );
    });

    it('should throw error for unconfigured provider', async () => {
      await expect(
        oauthService.startAuthorization({
          provider: 'microsoft' as OAuthProvider,
          tenantId: 'tenant-123',
          userId: 'user-456',
          userType: 'user',
        })
      ).rejects.toThrow('Provider microsoft is not configured');
    });
  });

  describe('Callback Handling', () => {
    const validState: OAuthState = {
      id: 'state-123',
      tenantId: 'tenant-123',
      userId: 'user-456',
      userType: 'user',
      provider: 'google',
      redirectUrl: 'http://app/callback',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      createdAt: new Date(),
    };

    it('should handle valid callback successfully', async () => {
      vi.mocked(oauthRepository.consumeState).mockResolvedValue(validState);
      vi.mocked(oauthRepository.upsertToken).mockResolvedValue();

      // Mock token exchange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid email profile',
        }),
      });

      // Mock user info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'google-user-id',
          email: 'user@example.com',
        }),
      });

      const result = await oauthService.handleCallback(
        'google',
        'auth-code-123',
        'state-123',
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('google');
      expect(result.redirectUrl).toBe('http://app/callback');

      expect(oauthRepository.consumeState).toHaveBeenCalledWith('state-123');
      expect(oauthRepository.upsertToken).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          userId: 'user-456',
          userType: 'user',
          provider: 'google',
          isActive: true,
        })
      );
    });

    it('should reject invalid state', async () => {
      vi.mocked(oauthRepository.consumeState).mockResolvedValue(undefined);

      const result = await oauthService.handleCallback(
        'google',
        'auth-code-123',
        'invalid-state',
        '127.0.0.1'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATE');
    });

    it('should reject expired state', async () => {
      const expiredState: OAuthState = {
        ...validState,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
      };

      vi.mocked(oauthRepository.consumeState).mockResolvedValue(expiredState);

      const result = await oauthService.handleCallback(
        'google',
        'auth-code-123',
        'state-123'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('STATE_EXPIRED');
    });

    it('should reject provider mismatch', async () => {
      vi.mocked(oauthRepository.consumeState).mockResolvedValue(validState);

      const result = await oauthService.handleCallback(
        'github', // Different from state.provider (google)
        'auth-code-123',
        'state-123'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PROVIDER_MISMATCH');
    });

    it('should handle token exchange failure', async () => {
      vi.mocked(oauthRepository.consumeState).mockResolvedValue(validState);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid authorization code',
      });

      const result = await oauthService.handleCallback(
        'google',
        'invalid-code',
        'state-123'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TOKEN_EXCHANGE_FAILED');
    });
  });

  describe('Integration Status', () => {
    it('should return connected status for existing token', async () => {
      const token: IntegrationToken = {
        id: 'token-123',
        tenantId: 'tenant-123',
        userId: 'user-456',
        userType: 'user',
        provider: 'google',
        accessTokenEncrypted: 'encrypted:access-token',
        refreshTokenEncrypted: 'encrypted:refresh-token',
        scopes: ['openid', 'email'],
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        providerAccountId: 'user@example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(oauthRepository.findToken).mockResolvedValue(token);

      const status = await oauthService.getIntegrationStatus(
        'tenant-123',
        'user-456',
        'user',
        'google'
      );

      expect(status.connected).toBe(true);
      expect(status.active).toBe(true);
      expect(status.providerAccountId).toBe('user@example.com');
      expect(status.scopes).toEqual(['openid', 'email']);
      expect(status.hasError).toBe(false);
    });

    it('should return disconnected status for missing token', async () => {
      vi.mocked(oauthRepository.findToken).mockResolvedValue(undefined);

      const status = await oauthService.getIntegrationStatus(
        'tenant-123',
        'user-456',
        'user',
        'google'
      );

      expect(status.connected).toBe(false);
      expect(status.active).toBe(false);
      expect(status.scopes).toEqual([]);
    });

    it('should indicate error state when token has refresh error', async () => {
      const errorToken: IntegrationToken = {
        id: 'token-123',
        tenantId: 'tenant-123',
        userId: 'user-456',
        userType: 'user',
        provider: 'google',
        accessTokenEncrypted: 'encrypted:access-token',
        scopes: ['openid'],
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRefreshError: 'Refresh token revoked',
      };

      vi.mocked(oauthRepository.findToken).mockResolvedValue(errorToken);

      const status = await oauthService.getIntegrationStatus(
        'tenant-123',
        'user-456',
        'user',
        'google'
      );

      expect(status.connected).toBe(true);
      expect(status.hasError).toBe(true);
      expect(status.errorMessage).toBe('Refresh token revoked');
    });
  });

  describe('Token Refresh', () => {
    const token: IntegrationToken = {
      id: 'token-123',
      tenantId: 'tenant-123',
      userId: 'user-456',
      userType: 'user',
      provider: 'google',
      accessTokenEncrypted: 'encrypted:old-access-token',
      refreshTokenEncrypted: 'encrypted:refresh-token',
      scopes: ['openid', 'email'],
      expiresAt: new Date(Date.now() - 60 * 1000), // Expired
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should refresh token successfully', async () => {
      vi.mocked(oauthRepository.findTokenById).mockResolvedValue(token);
      vi.mocked(oauthRepository.updateTokenRefresh).mockResolvedValue();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      const result = await oauthService.refreshToken('token-123');

      expect(result.success).toBe(true);
      // Verify updateTokenRefresh was called with correct token ID
      expect(oauthRepository.updateTokenRefresh).toHaveBeenCalled();
      const calls = vi.mocked(oauthRepository.updateTokenRefresh).mock.calls;
      expect(calls[0][0]).toBe('token-123'); // Token ID
      expect(calls[0][2]).toBeInstanceOf(Date); // Expiry date
    });

    it('should handle refresh failure', async () => {
      vi.mocked(oauthRepository.findTokenById).mockResolvedValue(token);
      vi.mocked(oauthRepository.markTokenError).mockResolvedValue();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid refresh token',
      });

      const result = await oauthService.refreshToken('token-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token refresh failed');
      expect(oauthRepository.markTokenError).toHaveBeenCalledWith(
        'token-123',
        expect.stringContaining('Refresh failed')
      );
    });

    it('should return error for non-existent token', async () => {
      vi.mocked(oauthRepository.findTokenById).mockResolvedValue(undefined);

      const result = await oauthService.refreshToken('non-existent-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found');
    });

    it('should return error when no refresh token available', async () => {
      const tokenWithoutRefresh: IntegrationToken = {
        ...token,
        refreshTokenEncrypted: undefined,
      };

      vi.mocked(oauthRepository.findTokenById).mockResolvedValue(tokenWithoutRefresh);

      const result = await oauthService.refreshToken('token-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No refresh token available');
    });
  });

  describe('Disconnect Integration', () => {
    it('should disconnect integration successfully', async () => {
      vi.mocked(oauthRepository.deactivateToken).mockResolvedValue();

      const result = await oauthService.disconnectIntegration(
        'tenant-123',
        'user-456',
        'user',
        'google',
        '127.0.0.1'
      );

      expect(result.success).toBe(true);
      expect(oauthRepository.deactivateToken).toHaveBeenCalledWith(
        'tenant-123',
        'user-456',
        'user',
        'google'
      );
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up expired states', async () => {
      vi.mocked(oauthRepository.deleteExpiredStates).mockResolvedValue(5);

      const count = await oauthService.cleanupExpiredStates();

      expect(count).toBe(5);
      expect(oauthRepository.deleteExpiredStates).toHaveBeenCalled();
    });

    it('should refresh expiring tokens', async () => {
      const expiringTokens: IntegrationToken[] = [
        {
          id: 'token-1',
          tenantId: 'tenant-123',
          userId: 'user-1',
          userType: 'user',
          provider: 'google',
          accessTokenEncrypted: 'encrypted:access-1',
          refreshTokenEncrypted: 'encrypted:refresh-1',
          scopes: ['openid'],
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min from now
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'token-2',
          tenantId: 'tenant-123',
          userId: 'user-2',
          userType: 'user',
          provider: 'google',
          accessTokenEncrypted: 'encrypted:access-2',
          refreshTokenEncrypted: 'encrypted:refresh-2',
          scopes: ['openid'],
          expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 min from now
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(oauthRepository.findExpiringTokens).mockResolvedValue(expiringTokens);
      vi.mocked(oauthRepository.findTokenById)
        .mockResolvedValueOnce(expiringTokens[0])
        .mockResolvedValueOnce(expiringTokens[1]);
      vi.mocked(oauthRepository.updateTokenRefresh).mockResolvedValue();

      // Both refresh successfully
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      const result = await oauthService.refreshExpiringTokens(30);

      expect(result.refreshed).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});

describe('OAuth CSRF Protection', () => {
  it('should use state parameter for CSRF protection', async () => {
    vi.mocked(oauthRepository.createState).mockResolvedValue();

    const result = await oauthService.startAuthorization({
      provider: 'google',
      tenantId: 'tenant-123',
      userId: 'user-456',
      userType: 'user',
    });

    // Verify state is included in URL
    const url = new URL(result.authorizationUrl);
    expect(url.searchParams.get('state')).toBe(result.state);

    // Verify state is persisted
    expect(oauthRepository.createState).toHaveBeenCalledWith(
      expect.objectContaining({
        id: result.state,
      })
    );
  });

  it('should consume state only once (one-time use)', async () => {
    const state: OAuthState = {
      id: 'state-123',
      tenantId: 'tenant-123',
      userId: 'user-456',
      userType: 'user',
      provider: 'google',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
    };

    // First call returns state, second call returns undefined (consumed)
    vi.mocked(oauthRepository.consumeState)
      .mockResolvedValueOnce(state)
      .mockResolvedValueOnce(undefined);

    vi.mocked(oauthRepository.upsertToken).mockResolvedValue();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', email: 'test@example.com' }),
      });

    // First callback should succeed
    const result1 = await oauthService.handleCallback('google', 'code', 'state-123');
    expect(result1.success).toBe(true);

    // Second callback with same state should fail
    const result2 = await oauthService.handleCallback('google', 'code', 'state-123');
    expect(result2.success).toBe(false);
    expect(result2.errorCode).toBe('INVALID_STATE');
  });
});
