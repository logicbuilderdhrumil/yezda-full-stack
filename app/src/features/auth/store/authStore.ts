/**
 * Auth state store using Zustand.
 * Task 1.5: Implement session bootstrap on app launch.
 * Task 1.7: Add sign-out handling and token clearing.
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  AuthSession,
  AuthUser,
  SessionTokens,
  MfaChallenge,
  SignInRequest,
  MfaVerifyRequest,
  toSessionTokens,
} from '../types/auth.types';
import type { LoginFormValues } from '../types/auth.types';
import {
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isTokenExpired,
  getOrCreateDeviceId,
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
  failedAttempts: number;
  lastFailedAttempt: number | null;

  // Actions
  bootstrap: () => Promise<void>;
  signIn: (values: LoginFormValues) => Promise<boolean>;
  verifyMfa: (request: MfaVerifyRequest) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Calculate backoff delay based on failed attempts.
 * Uses exponential backoff: 1s, 2s, 4s, 8s, 16s max.
 */
function getBackoffDelay(failedAttempts: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 16000; // 16 seconds
  return Math.min(baseDelay * Math.pow(2, failedAttempts - 1), maxDelay);
}

/**
 * Check if rate limited based on failed attempts and last failure time.
 */
function isRateLimited(failedAttempts: number, lastFailedAttempt: number | null): { limited: boolean; remainingMs: number } {
  if (failedAttempts === 0 || !lastFailedAttempt) {
    return { limited: false, remainingMs: 0 };
  }
  
  const backoffDelay = getBackoffDelay(failedAttempts);
  const timeSinceLastFail = Date.now() - lastFailedAttempt;
  const remainingMs = backoffDelay - timeSinceLastFail;
  
  return {
    limited: remainingMs > 0,
    remainingMs: Math.max(0, remainingMs),
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  pendingMfaChallenge: null,
  failedAttempts: 0,
  lastFailedAttempt: null,

  /**
   * Bootstrap: check for stored tokens and restore session on app launch.
   */
  bootstrap: async () => {
    set({ isLoading: true, error: null });

    try {
      const storedTokens = await getStoredTokens();

      if (!storedTokens) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Set tokens in state first so refreshSession can access them
      set({ tokens: storedTokens });

      // Check if token is expired
      if (isTokenExpired(storedTokens.expiresAt)) {
        // Attempt to refresh using the stored refresh token
        try {
          const response = await apiRefreshTokens(storedTokens.refreshToken);
          const refreshedTokens = toSessionTokens(response);
          await storeTokens(refreshedTokens);
          set({
            tokens: refreshedTokens,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          await clearStoredTokens();
          set({ isLoading: false, isAuthenticated: false, tokens: null, user: null });
          return;
        }
      }

      // Token is valid - restore session
      set({
        tokens: storedTokens,
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
   * Includes client-side rate limiting with exponential backoff.
   */
  signIn: async (values: LoginFormValues) => {
    const { failedAttempts, lastFailedAttempt } = get();
    
    // Check rate limiting
    const { limited, remainingMs } = isRateLimited(failedAttempts, lastFailedAttempt);
    if (limited) {
      const seconds = Math.ceil(remainingMs / 1000);
      set({ error: `Too many attempts. Please wait ${seconds} seconds before trying again.` });
      return false;
    }

    set({ isLoading: true, error: null, pendingMfaChallenge: null });

    // Build full sign-in request with device info
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    const deviceId = await getOrCreateDeviceId();
    const request: SignInRequest = {
      email: values.email,
      password: values.password,
      deviceId,
      platform,
      appVersion: Constants.expoConfig?.version ?? '1.0.0',
      deviceName: platform === 'web' ? 'Web Browser' : undefined,
    };

    try {
      const response = await apiSignIn(request);

      // MFA required
      if (response.requiresMfa) {
        set({
          isLoading: false,
          pendingMfaChallenge: {
            challengeId: response.mfaSessionToken ?? '',
            type: 'totp',
          },
          failedAttempts: 0, // Reset on valid credentials
          lastFailedAttempt: null,
        });
        return false;
      }

      // Success - store tokens and update state
      if (response.accessToken && response.refreshToken) {
        const tokens = toSessionTokens(response);
        await storeTokens(tokens);
        set({
          tokens,
          isAuthenticated: true,
          isLoading: false,
          failedAttempts: 0,
          lastFailedAttempt: null,
        });
        return true;
      }

      set({ isLoading: false, error: 'Unexpected response from server' });
      return false;
    } catch (error) {
      // Duck-type check for AuthApiError to handle mock compatibility
      const isAuthError = error instanceof Error && 
        (error.name === 'AuthApiError' || ('code' in error && 'status' in error));
      const message = isAuthError ? error.message : 'An unexpected error occurred';
      
      // Track failed attempt for rate limiting
      set({
        isLoading: false,
        error: message,
        failedAttempts: failedAttempts + 1,
        lastFailedAttempt: Date.now(),
      });
      return false;
    }
  },

  /**
   * Complete MFA verification.
   */
  verifyMfa: async (request: MfaVerifyRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiVerifyMfa({
        mfaSessionToken: request.challengeId,
        mfaCode: request.code,
      });

      if (response.accessToken && response.refreshToken) {
        const tokens = toSessionTokens(response);
        await storeTokens(tokens);
        set({
          tokens,
          isAuthenticated: true,
          isLoading: false,
          pendingMfaChallenge: null,
        });
        return true;
      }

      set({ isLoading: false, error: 'MFA verification failed' });
      return false;
    } catch (error) {
      // Duck-type check for AuthApiError to handle mock compatibility
      const isAuthError = error instanceof Error && 
        (error.name === 'AuthApiError' || ('code' in error && 'status' in error));
      const message = isAuthError ? error.message : 'Verification failed';
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
      const newTokens = toSessionTokens(response);
      await storeTokens(newTokens);
      set({ tokens: newTokens });
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
