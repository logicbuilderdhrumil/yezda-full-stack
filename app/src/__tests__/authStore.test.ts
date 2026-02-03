/**
 * Integration tests for auth store.
 * Task 1.8: Add unit and integration tests for auth flows.
 */

import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import * as secureStorage from '../utils/secureStorage';

// Mock dependencies
jest.mock('../services/authService');
jest.mock('../utils/secureStorage');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      pendingMfaChallenge: null,
    });
  });

  describe('bootstrap', () => {
    it('sets isAuthenticated true when valid tokens exist', async () => {
      const tokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresAt: Date.now() + 3600000,
      };

      mockSecureStorage.getStoredTokens.mockResolvedValue(tokens);
      mockSecureStorage.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.bootstrap();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.tokens).toEqual(tokens);
    });

    it('clears session when no tokens stored', async () => {
      mockSecureStorage.getStoredTokens.mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.bootstrap();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('attempts refresh when token is expired', async () => {
      const expiredTokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresAt: Date.now() - 3600000,
      };

      const newTokens = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresAt: Date.now() + 3600000,
      };

      mockSecureStorage.getStoredTokens.mockResolvedValue(expiredTokens);
      mockSecureStorage.isTokenExpired.mockReturnValue(true);
      mockAuthService.refreshTokens.mockResolvedValue({ tokens: newTokens });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.bootstrap();
      });

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('refresh-456');
      expect(mockSecureStorage.storeTokens).toHaveBeenCalledWith(newTokens);
    });
  });

  describe('signIn', () => {
    it('stores tokens and updates state on success', async () => {
      const response = {
        tokens: {
          accessToken: 'access-123',
          refreshToken: 'refresh-456',
          expiresAt: Date.now() + 3600000,
        },
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockAuthService.signIn.mockResolvedValue(response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.signIn({
          email: 'test@example.com',
          password: 'password',
        });
        expect(success).toBe(true);
      });

      expect(mockSecureStorage.storeTokens).toHaveBeenCalledWith(response.tokens);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(response.user);
    });

    it('sets pendingMfaChallenge when MFA required', async () => {
      const mfaChallenge = {
        challengeId: 'challenge-123',
        type: 'totp' as const,
      };

      mockAuthService.signIn.mockResolvedValue({ mfaChallenge });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.signIn({
          email: 'test@example.com',
          password: 'password',
        });
        expect(success).toBe(false);
      });

      expect(result.current.pendingMfaChallenge).toEqual(mfaChallenge);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('sets error on failure', async () => {
      mockAuthService.signIn.mockRejectedValue(
        new authService.AuthApiError('INVALID', 'Invalid credentials', 401)
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.signIn({
          email: 'test@example.com',
          password: 'wrong',
        });
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('verifyMfa', () => {
    it('completes authentication on valid code', async () => {
      const response = {
        tokens: {
          accessToken: 'access-123',
          refreshToken: 'refresh-456',
          expiresAt: Date.now() + 3600000,
        },
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockAuthService.verifyMfa.mockResolvedValue(response);

      // Set pending MFA
      useAuthStore.setState({
        pendingMfaChallenge: { challengeId: 'challenge-123', type: 'totp' },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.verifyMfa({
          challengeId: 'challenge-123',
          code: '123456',
        });
        expect(success).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.pendingMfaChallenge).toBeNull();
    });
  });

  describe('signOut', () => {
    it('clears all auth state and storage', async () => {
      // Set authenticated state
      useAuthStore.setState({
        tokens: {
          accessToken: 'access-123',
          refreshToken: 'refresh-456',
          expiresAt: Date.now() + 3600000,
        },
        user: { id: 'user-1', email: 'test@example.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockAuthService.signOut).toHaveBeenCalledWith('access-123');
      expect(mockSecureStorage.clearStoredTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error message', () => {
      useAuthStore.setState({ error: 'Some error' });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
