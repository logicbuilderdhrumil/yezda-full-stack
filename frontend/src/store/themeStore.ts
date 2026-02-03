import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import type { ThemeMode, ThemeState } from '@/@types/stores';

const STORAGE_KEY = 'yezda-theme';

/**
 * Resolves the actual theme based on mode and system preference.
 * Includes SSR guard for window.matchMedia.
 */
function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

interface ThemeStore extends ThemeState {
  /** Set the theme mode. */
  setMode: (mode: ThemeMode) => void;
  /**
   * Toggle between light and dark modes.
   * When in 'system' mode, toggles to explicit 'light' or 'dark' based on the
   * current resolved theme—exiting system mode.
   */
  toggle: () => void;
  /** Refresh resolved theme based on system preference. */
  refreshResolved: () => void;
  /** Reset to default theme. */
  reset: () => void;
}

/** Export the ThemeStore type for typed selectors. */
export type { ThemeStore };

const initialState: ThemeState = {
  mode: 'system',
  resolvedTheme: 'light',
};

/**
 * Theme store for managing theme preferences with persistence.
 * Supports light, dark, and system modes.
 */
export const useThemeStore = create<ThemeStore>()(
  subscribeWithSelector(
    persist(
    (set, get) => ({
      ...initialState,

      setMode: (mode: ThemeMode) => {
        set({
          mode,
          resolvedTheme: resolveTheme(mode),
        });
      },

      toggle: () => {
        const { resolvedTheme } = get();
        const nextMode: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
        set({
          mode: nextMode,
          resolvedTheme: nextMode,
        });
      },

      refreshResolved: () => {
        const { mode } = get();
        set({ resolvedTheme: resolveTheme(mode) });
      },

      reset: () => {
        set({
          mode: initialState.mode,
          resolvedTheme: resolveTheme(initialState.mode),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.resolvedTheme = resolveTheme(state.mode);
        }
      },
    }
  ))
);

/**
 * Subscribe to system color scheme changes.
 * When in 'system' mode, automatically updates the resolved theme.
 */
function initSystemThemeListener(): void {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (): void => {
    const { mode, refreshResolved } = useThemeStore.getState();
    if (mode === 'system') {
      refreshResolved();
    }
  };

  mediaQuery.addEventListener('change', handleChange);
}

// Initialize the listener on module load (browser-only)
initSystemThemeListener();

/** Selector for theme mode. */
export const selectThemeMode = (state: ThemeStore): ThemeMode => state.mode;

/** Selector for resolved theme. */
export const selectResolvedTheme = (state: ThemeStore): 'light' | 'dark' =>
  state.resolvedTheme;

/** Selector for whether dark mode is active. */
export const selectIsDark = (state: ThemeStore): boolean =>
  state.resolvedTheme === 'dark';
