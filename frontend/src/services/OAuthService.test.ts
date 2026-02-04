/**
 * OAuthService Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import type { OAuthProvider, IntegrationStatus } from '@/@types/oauth';

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn(() => false),
  };
  return { default: mockAxios };
});

// Import after mocking
const { OAuthService } = await import('./OAuthService');

describe('OAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProviders', () => {
    it('returns list of providers', async () => {
      const mockProviders: OAuthProvider[] = ['google', 'microsoft'];
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { providers: mockProviders },
      });

      const result = await OAuthService.getProviders();
      expect(result).toEqual(mockProviders);
    });
  });

  describe('authorize', () => {
    it('returns authorization URL', async () => {
      const mockResponse = {
        authorizationUrl: 'https://accounts.google.com/oauth',
        state: 'state-123',
      };
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await OAuthService.authorize('google');
      expect(result).toEqual(mockResponse);
    });

    it('includes redirectUrl when provided', async () => {
      const mockResponse = {
        authorizationUrl: 'https://accounts.google.com/oauth',
        state: 'state-123',
      };
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockResponse,
      });

      await OAuthService.authorize('google', '/dashboard');
      expect(axios.post).toHaveBeenCalledWith(
        '/authorize/google',
        { redirectUrl: '/dashboard' }
      );
    });
  });

  describe('getStatus', () => {
    it('returns integration status for provider', async () => {
      const mockStatus: IntegrationStatus = {
        provider: 'google',
        connected: true,
        active: true,
        scopes: ['email', 'profile'],
        hasError: false,
      };
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockStatus,
      });

      const result = await OAuthService.getStatus('google');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getAllStatuses', () => {
    it('returns all integration statuses', async () => {
      const mockStatuses: IntegrationStatus[] = [
        { provider: 'google', connected: true, active: true, scopes: [], hasError: false },
        { provider: 'microsoft', connected: false, active: false, scopes: [], hasError: false },
      ];
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { integrations: mockStatuses },
      });

      const result = await OAuthService.getAllStatuses();
      expect(result).toEqual(mockStatuses);
    });
  });

  describe('disconnect', () => {
    it('calls delete endpoint', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      await OAuthService.disconnect('google');
      expect(axios.delete).toHaveBeenCalledWith('/integration/google');
    });
  });

  describe('refreshToken', () => {
    it('returns refreshed status', async () => {
      const mockStatus: IntegrationStatus = {
        provider: 'google',
        connected: true,
        active: true,
        scopes: ['email'],
        hasError: false,
      };
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockStatus,
      });

      const result = await OAuthService.refreshToken('google');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('parseCallbackParams', () => {
    it('parses success callback', () => {
      const params = new URLSearchParams('success=true&provider=google');
      const result = OAuthService.parseCallbackParams(params);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('google');
    });

    it('parses error callback', () => {
      const params = new URLSearchParams('error=access_denied&error_description=User%20denied');
      const result = OAuthService.parseCallbackParams(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User denied');
      expect(result.errorCode).toBe('access_denied');
    });

    it('parses code callback as success', () => {
      const params = new URLSearchParams('code=abc123&state=xyz');
      const result = OAuthService.parseCallbackParams(params);

      expect(result.success).toBe(true);
    });

    it('handles unknown state', () => {
      const params = new URLSearchParams('');
      const result = OAuthService.parseCallbackParams(params);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('UNKNOWN_STATE');
    });

    it('includes redirect URL when present', () => {
      const params = new URLSearchParams('success=true&provider=google&redirect=/dashboard');
      const result = OAuthService.parseCallbackParams(params);

      expect(result.redirectUrl).toBe('/dashboard');
    });
  });
});
