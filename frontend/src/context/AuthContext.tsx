import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/AuthService';
import type {
  User,
  AuthError,
  SignInCredentials,
  SignUpCredentials,
  PasswordResetRequest,
  PasswordResetPayload,
  CandidatePasswordResetPayload,
} from '@/@types/auth';

interface AuthContextValue {
  /** Current authenticated user or null. */
  user: User | null;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Whether an auth operation is in progress. */
  isLoading: boolean;
  /** Current error state. */
  error: AuthError | null;
  /** Whether MFA verification is pending. */
  mfaPending: boolean;
  /** Sign in with credentials. */
  signIn: (credentials: SignInCredentials) => Promise<boolean>;
  /** Sign up a new user. */
  signUp: (credentials: SignUpCredentials) => Promise<boolean>;
  /** Request password reset. */
  requestPasswordReset: (request: PasswordResetRequest) => Promise<boolean>;
  /** Complete password reset. */
  resetPassword: (payload: PasswordResetPayload) => Promise<boolean>;
  /** Complete candidate password reset. */
  resetCandidatePassword: (payload: CandidatePasswordResetPayload) => Promise<boolean>;
  /** Verify TOTP code. */
  verifyTotp: (totpCode: string) => Promise<boolean>;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
  /** Clear error state. */
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider wraps the application and provides authentication state and actions.
 * Waits for Zustand hydration before rendering children to avoid race conditions.
 */
export function AuthProvider({ children }: AuthProviderProps): ReactNode {
  const {
    session,
    isAuthenticated,
    isLoading,
    error,
    mfaPending,
    mfaToken,
    hasHydrated,
    setSession,
    clearSession,
    setLoading,
    setError,
    setMfaPending,
    getRefreshToken,
    isSessionExpired,
  } = useAuthStore();

  // Try to restore session on mount (after hydration)
  useEffect(() => {
    // Don't attempt restore until hydration is complete
    if (!hasHydrated) return;

    let isMounted = true;

    const restoreSession = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;

      // Refresh if session is expired OR if the hydrated session is corrupted
      // (e.g., missing user data from a previous bug or interrupted refresh)
      const needsRefresh = isSessionExpired() || !session?.user;
      if (!needsRefresh) return;

      setLoading(true);
      try {
        const newSession = await AuthService.refreshToken(refreshToken);
        if (isMounted) setSession(newSession);
      } catch {
        if (isMounted) clearSession();
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, session, getRefreshToken, isSessionExpired, setLoading, setSession, clearSession]);

  // Block rendering until hydration completes to prevent API calls with null tokens
  if (!hasHydrated) {
    return null;
  }

  const signIn = useCallback(
    async (credentials: SignInCredentials): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const response = await AuthService.signIn(credentials);
        if (response.requiresMfa && response.mfaToken) {
          setMfaPending(response.mfaToken);
          return false;
        }
        if (response.session) {
          setSession(response.session);
          return true;
        }
        // No session returned, clear loading state
        setLoading(false);
        return false;
      } catch (err) {
        setError(err as AuthError);
        return false;
      }
    },
    [setLoading, setError, setMfaPending, setSession]
  );

  const signUp = useCallback(
    async (credentials: SignUpCredentials): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const session = await AuthService.signUp(credentials);
        setSession(session);
        return true;
      } catch (err) {
        setError(err as AuthError);
        return false;
      }
    },
    [setLoading, setError, setSession]
  );

  const requestPasswordReset = useCallback(
    async (request: PasswordResetRequest): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await AuthService.requestPasswordReset(request);
        setLoading(false);
        return true;
      } catch (err) {
        setError(err as AuthError);
        return false;
      }
    },
    [setLoading, setError]
  );

  const resetPassword = useCallback(
    async (payload: PasswordResetPayload): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await AuthService.resetPassword(payload);
        setLoading(false);
        return true;
      } catch (err) {
        setError(err as AuthError);
        return false;
      }
    },
    [setLoading, setError]
  );

  const resetCandidatePassword = useCallback(
    async (payload: CandidatePasswordResetPayload): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await AuthService.resetCandidatePassword(payload);
        setLoading(false);
        return true;
      } catch (err) {
        setError(err as AuthError);
        return false;
      }
    },
    [setLoading, setError]
  );

  const verifyTotp = useCallback(
    async (totpCode: string): Promise<boolean> => {
      if (!mfaToken) {
        setError({ code: 'NO_MFA_TOKEN', message: 'No MFA session in progress' });
        return false;
      }
      setLoading(true);
      setError(null);
      try {
        const session = await AuthService.verifyTotp({ mfaToken, totpCode });
        setSession(session);
        return true;
      } catch (err) {
        setError(err as AuthError);
        return false;
      }
    },
    [mfaToken, setLoading, setError, setSession]
  );

  const signOut = useCallback(async (): Promise<void> => {
    await AuthService.signOut();
    clearSession();
  }, [clearSession]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    isAuthenticated,
    isLoading,
    error,
    mfaPending,
    signIn,
    signUp,
    requestPasswordReset,
    resetPassword,
    resetCandidatePassword,
    verifyTotp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook provides access to authentication state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
