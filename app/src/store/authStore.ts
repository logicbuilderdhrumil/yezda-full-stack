/**
 * Auth state store using Zustand.
 * Task 1.5: Implement session bootstrap on app launch.
 * Task 1.7: Add sign-out handling and token clearing.
 */

import { create } from 'zustand';
import {
  AuthSession,
  AuthUser,
  SessionTokens,
  MfaChallenge,
  SignInRequest,
  MfaVerifyRequest,
} from '../types/auth.types';
import {
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isTokenExpired,
} from '../utils/secureStorage';
import {
  signIn as apiSignIn,
  verifyMfa as apiVerifyMfa,
  refreshTokens as apiRefreshTokens,
  signOut as apiSignOut,
  AuthApiError,
} from '../services/authService';

interface AuthState extends AuthSession {
  error: string | null;
  pendingMfaChallenge: MfaChallenge | null;

  // Actions
  bootstrap: () => Promise<void>;
  signIn: (request: SignInRequest) => Promise<boolean>;
  verifyMfa: (request: MfaVerifyRequest) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  pendingMfaChallenge: null,

  /**
   * Bootstrap: check for stored tokens and restore session on app launch.
   */
  bootstrap: async () => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await getStoredTokens();

      if (!tokens) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Check if token is expired
      if (isTokenExpired(tokens.expiresAt)) {
        // Attempt to refresh
        const refreshed = await get().refreshSession();
        if (!refreshed) {
          await clearStoredTokens();
          set({ isLoading: false, isAuthenticated: false, tokens: null, user: null });
          return;
        }
      }

      // Token is valid - restore session
      set({
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Bootstrap failed:', error);
      await clearStoredTokens();
      set({ isLoading: false, isAuthenticated: false, tokens: null, user: null });
    }
  },

  /**
   * Sign in with credentials.
   * Returns true on success, false if MFA is required or on error.
   */
  signIn: async (request: SignInRequest) => {
    set({ isLoading: true, error: null, pendingMfaChallenge: null });

    try {
      const response = await apiSignIn(request);

      // MFA required
      if (response.mfaChallenge) {
        set({
          isLoading: false,
          pendingMfaChallenge: response.mfaChallenge,
        });
        return false;
      }

      // Success - store tokens and update state
      if (response.tokens && response.user) {
        await storeTokens(response.tokens);
        set({
          tokens: response.tokens,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      set({ isLoading: false, error: 'Unexpected response from server' });
      return false;
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : 'An unexpected error occurred';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  /**
   * Complete MFA verification.
   */
  verifyMfa: async (request: MfaVerifyRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiVerifyMfa(request);

      if (response.tokens && response.user) {
        await storeTokens(response.tokens);
        set({
          tokens: response.tokens,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          pendingMfaChallenge: null,
        });
        return true;
      }

      set({ isLoading: false, error: 'MFA verification failed' });
      return false;
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : 'Verification failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  /**
   * Refresh the session using the stored refresh token.
   */
  refreshSession: async () => {
    const { tokens } = get();
    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await apiRefreshTokens(tokens.refreshToken);
      await storeTokens(response.tokens);
      set({ tokens: response.tokens });
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },

  /**
   * Sign out: clear tokens locally and invalidate on backend.
   */
  signOut: async () => {
    const { tokens } = get();

    set({ isLoading: true });

    // Clear backend session if we have a token
    if (tokens?.accessToken) {
      await apiSignOut(tokens.accessToken);
    }

    // Always clear local storage
    await clearStoredTokens();

    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pendingMfaChallenge: null,
    });
  },

  /**
   * Clear any displayed error.
   */
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Selector hooks for common auth state.
 */
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectUser = (state: AuthState) => state.user;
export const selectError = (state: AuthState) => state.error;
export const selectPendingMfa = (state: AuthState) => state.pendingMfaChallenge;
