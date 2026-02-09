/**
 * Store Index
 *
 * @deprecated Import feature-specific stores from '@/features/<name>' instead.
 * Global stores (theme, locale, presence, routeKey) remain here.
 */

// Feature stores (re-exported for backward compatibility)
export { useAuthStore } from '@/features/auth';

// Global stores (not feature-specific, remain in store/)
export {
  useThemeStore,
  selectThemeMode,
  selectResolvedTheme,
  selectIsDark,
  type ThemeStore,
} from './themeStore';
export { useLocaleStore, selectLocale, selectLocaleLoading } from './localeStore';
export {
  usePresenceStore,
  selectPresenceStatus,
  selectLastActivity,
  selectIsAvailable,
} from './presenceStore';
export {
  useRouteKeyStore,
  selectCurrentRouteKey,
  selectPreviousRouteKey,
  selectHasNavigated,
} from './routeKeyStore';
export { resetAllStores, handleLogout, handleLogin } from './storeUtils';
