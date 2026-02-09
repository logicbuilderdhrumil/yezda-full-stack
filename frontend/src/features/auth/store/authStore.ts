import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession, AuthError, AuthState } from '@/@types/auth';

const STORAGE_KEY = 'yezda-auth';

interface AuthStore extends AuthState {
  /** Whether the store has finished rehydrating from localStorage. */
  hasHydrated: boolean;
  /** Set the authenticated session. */
  setSession: (session: AuthSession) => void;
  /** Clear the session and reset to initial state. */
  clearSession: () => void;
  /** Set loading state. */
  setLoading: (isLoading: boolean) => void;
  /** Set error state. */
  setError: (error: AuthError | null) => void;
  /** Set MFA pending state with token. */
  setMfaPending: (mfaToken: string | null) => void;
  /** Get the access token. */
  getAccessToken: () => string | null;
  /** Get the refresh token. */
  getRefreshToken: () => string | null;
  /** Check if session is expired. */
  isSessionExpired: () => boolean;
  /** Mark hydration as complete (internal use). */
  _setHasHydrated: (state: boolean) => void;
}

const initialState: AuthState = {
  session: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  mfaPending: false,
  mfaToken: null,
};

/**
 * Auth store for managing session state with persistence.
 * Uses localStorage for token persistence across browser sessions.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      hasHydrated: false,

      _setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },

      setSession: (session: AuthSession) => {
        set({
          session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          mfaPending: false,
          mfaToken: null,
        });
      },

      clearSession: () => {
        set(initialState);
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: AuthError | null) => {
        set({ error, isLoading: false });
      },

      setMfaPending: (mfaToken: string | null) => {
        set({
          mfaPending: mfaToken !== null,
          mfaToken,
          isLoading: false,
        });
      },

      getAccessToken: () => {
        const { session } = get();
        return session?.accessToken ?? null;
      },

      getRefreshToken: () => {
        const { session } = get();
        return session?.refreshToken ?? null;
      },

      isSessionExpired: () => {
        const { session } = get();
        if (!session) return true;
        return Date.now() >= session.expiresAt;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete once state is restored
        state?._setHasHydrated(true);
      },
    }
  )
);

/**
 * Wait for the auth store to finish hydrating from localStorage.
 * Resolves immediately if already hydrated.
 */
export function waitForAuthHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.getState().hasHydrated) {
      resolve();
      return;
    }
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.hasHydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
}
