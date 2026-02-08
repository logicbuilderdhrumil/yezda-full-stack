/**
 * Auth feature module - Login, MFA, session management.
 */

// Screens
export { LoginScreen } from './screens/LoginScreen';
export { MfaChallengeScreen } from './screens/MfaChallengeScreen';

// Services
export {
  signIn,
  verifyMfa,
  refreshTokens,
  signOut,
  AuthApiError,
  getAuthHeaders,
} from './services/authService';

// Store
export {
  useAuthStore,
  selectIsAuthenticated,
  selectIsLoading,
  selectUser,
  selectError,
  selectPendingMfa,
} from './store/authStore';

// Hooks
export { useSessionBootstrap } from './hooks/useSessionBootstrap';
export { useSignOut } from './hooks/useSignOut';

// Types
export * from './types/auth.types';

// Utils
export {
  validateLoginField,
  validateLoginForm,
  hasFormErrors,
} from './utils/validation';
export {
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isTokenExpired,
  hasValidStoredSession,
} from './utils/secureStorage';
