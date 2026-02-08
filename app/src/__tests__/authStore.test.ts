/**
 * Integration tests for auth store.
 * Task 1.8: Add unit and integration tests for auth flows.
 * Uses direct state access (getState/setState) instead of renderHook
 * to avoid React hooks issues in node test environment.
 */

import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import * as secureStorage from '../utils/secureStorage';

// Create a test error class that matches AuthApiError shape for duck-typing
class TestAuthApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
  }
}

// Mock dependencies - apiClient must be mocked to prevent expo-secure-store import chain
jest.mock('../services/apiClient');
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
      failedAttempts: 0,
      lastFailedAttempt: null,
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

      await useAuthStore.getState().bootstrap();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.tokens).toEqual(tokens);
    });

    it('clears session when no tokens stored', async () => {
      mockSecureStorage.getStoredTokens.mockResolvedValue(null);

      await useAuthStore.getState().bootstrap();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('attempts refresh when token is expired', async () => {
      const expiredTokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresAt: Date.now() - 3600000,
      };

      mockSecureStorage.getStoredTokens.mockResolvedValue(expiredTokens);
      mockSecureStorage.isTokenExpired.mockReturnValue(true);
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer' as const,
      });

      await useAuthStore.getState().bootstrap();

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('refresh-456');
      expect(mockSecureStorage.storeTokens).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('stores tokens and updates state on success', async () => {
      const response = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresIn: 3600,
        tokenType: 'Bearer' as const,
      };

      mockAuthService.signIn.mockResolvedValue(response);

      const success = await useAuthStore.getState().signIn({
        email: 'test@example.com',
        password: 'password',
        userType: 'candidate',
      });

      expect(success).toBe(true);
      expect(mockSecureStorage.storeTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('sets pendingMfaChallenge when MFA required', async () => {
      mockAuthService.signIn.mockResolvedValue({
        requiresMfa: true,
        mfaSessionToken: 'challenge-123',
      });

      const success = await useAuthStore.getState().signIn({
        email: 'test@example.com',
        password: 'password',
        userType: 'candidate',
      });

      expect(success).toBe(false);
      const state = useAuthStore.getState();
      expect(state.pendingMfaChallenge).toEqual({
        challengeId: 'challenge-123',
        type: 'totp',
      });
      expect(state.isAuthenticated).toBe(false);
    });

    it('sets error on failure', async () => {
      mockAuthService.signIn.mockRejectedValue(
        new TestAuthApiError('INVALID', 'Invalid credentials', 401)
      );

      const success = await useAuthStore.getState().signIn({
        email: 'test@example.com',
        password: 'wrong',
        userType: 'candidate',
      });

      expect(success).toBe(false);
      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('verifyMfa', () => {
    it('completes authentication on valid code', async () => {
      const response = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresIn: 3600,
        tokenType: 'Bearer' as const,
      };

      mockAuthService.verifyMfa.mockResolvedValue(response);

      // Set pending MFA
      useAuthStore.setState({
        pendingMfaChallenge: { challengeId: 'challenge-123', type: 'totp' },
      });

      const success = await useAuthStore.getState().verifyMfa({
        challengeId: 'challenge-123',
        code: '123456',
      });

      expect(success).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.pendingMfaChallenge).toBeNull();
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
        user: { id: 'user-1', email: 'test@example.com' } as any,
        isAuthenticated: true,
      });

      await useAuthStore.getState().signOut();

      expect(mockAuthService.signOut).toHaveBeenCalledWith('access-123');
      expect(mockSecureStorage.clearStoredTokens).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error message', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
