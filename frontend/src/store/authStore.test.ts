import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { AuthSession } from '@/@types/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('useAuthStore', () => {
  const mockSession: AuthSession = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    expiresAt: Date.now() + 3600000,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['viewer'],
      type: 'user',
      mfaEnabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.setState({
      session: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      mfaPending: false,
      mfaToken: null,
    });
  });

  describe('setSession', () => {
    it('sets session and marks as authenticated', () => {
      useAuthStore.getState().setSession(mockSession);

      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.mfaPending).toBe(false);
      expect(state.mfaToken).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('clears session and resets to initial state', () => {
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().clearSession();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('sets loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error and clears loading', () => {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setError({
        code: 'TEST_ERROR',
        message: 'Test error message',
      });

      const state = useAuthStore.getState();
      expect(state.error).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      expect(state.isLoading).toBe(false);
    });

    it('clears error when set to null', () => {
      useAuthStore.getState().setError({
        code: 'TEST_ERROR',
        message: 'Error',
      });
      useAuthStore.getState().setError(null);

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('setMfaPending', () => {
    it('sets MFA pending state with token', () => {
      useAuthStore.getState().setMfaPending('mfa-token-123');

      const state = useAuthStore.getState();
      expect(state.mfaPending).toBe(true);
      expect(state.mfaToken).toBe('mfa-token-123');
      expect(state.isLoading).toBe(false);
    });

    it('clears MFA pending state when set to null', () => {
      useAuthStore.getState().setMfaPending('mfa-token-123');
      useAuthStore.getState().setMfaPending(null);

      const state = useAuthStore.getState();
      expect(state.mfaPending).toBe(false);
      expect(state.mfaToken).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('returns access token from session', () => {
      useAuthStore.getState().setSession(mockSession);
      expect(useAuthStore.getState().getAccessToken()).toBe('access-token-123');
    });

    it('returns null when no session', () => {
      expect(useAuthStore.getState().getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('returns refresh token from session', () => {
      useAuthStore.getState().setSession(mockSession);
      expect(useAuthStore.getState().getRefreshToken()).toBe('refresh-token-456');
    });

    it('returns null when no session', () => {
      expect(useAuthStore.getState().getRefreshToken()).toBeNull();
    });
  });

  describe('isSessionExpired', () => {
    it('returns true when no session', () => {
      expect(useAuthStore.getState().isSessionExpired()).toBe(true);
    });

    it('returns false for future expiry', () => {
      const futureSession = {
        ...mockSession,
        expiresAt: Date.now() + 3600000,
      };
      useAuthStore.getState().setSession(futureSession);
      expect(useAuthStore.getState().isSessionExpired()).toBe(false);
    });

    it('returns true for past expiry', () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: Date.now() - 1000,
      };
      useAuthStore.getState().setSession(expiredSession);
      expect(useAuthStore.getState().isSessionExpired()).toBe(true);
    });
  });
});
