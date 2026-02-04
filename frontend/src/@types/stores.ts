/**
 * Store-related types for frontend state management.
 */

import type { PresenceStatus } from './socket';

/** Theme preference options. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Theme state. */
export interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
}

/** Supported locale codes. */
export type LocaleCode = 'en' | 'es' | 'fr' | 'de' | 'pt';

/** Locale state. */
export interface LocaleState {
  locale: LocaleCode;
  isLoading: boolean;
}

/** Presence state. */
export interface PresenceState {
  status: PresenceStatus;
  lastActivity: number | null;
}

/** Route key state for layout-level persistence. */
export interface RouteKeyState {
  currentKey: string | null;
  previousKey: string | null;
}
