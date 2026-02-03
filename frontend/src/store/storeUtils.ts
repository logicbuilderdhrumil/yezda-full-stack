import { useAuthStore } from './authStore';
import { useThemeStore } from './themeStore';
import { useLocaleStore } from './localeStore';
import { usePresenceStore } from './presenceStore';
import { useRouteKeyStore } from './routeKeyStore';

/**
 * Reset all stores to their initial state.
 * Use with caution - will clear all persisted and in-memory state.
 */
export function resetAllStores(): void {
  useAuthStore.getState().clearSession();
  useThemeStore.getState().reset();
  useLocaleStore.getState().reset();
  usePresenceStore.getState().reset();
  useRouteKeyStore.getState().reset();
}

/**
 * Handle user logout by clearing session-related stores.
 * Preserves user preferences (theme, locale).
 */
export function handleLogout(): void {
  useAuthStore.getState().clearSession();
  usePresenceStore.getState().goOffline();
  useRouteKeyStore.getState().reset();
}

/**
 * Handle user login by initializing presence.
 */
export function handleLogin(): void {
  usePresenceStore.getState().goOnline();
}
