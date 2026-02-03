import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode, ThemeState } from '@/@types/stores';

const STORAGE_KEY = 'yezda-theme';

/** Resolves the actual theme based on mode and system preference. */
function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

interface ThemeStore extends ThemeState {
  /** Set the theme mode. */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark modes. */
  toggle: () => void;
  /** Refresh resolved theme based on system preference. */
  refreshResolved: () => void;
  /** Reset to default theme. */
  reset: () => void;
}

const initialState: ThemeState = {
  mode: 'system',
  resolvedTheme: 'light',
};

/**
 * Theme store for managing theme preferences with persistence.
 * Supports light, dark, and system modes.
 */
export const useThemeStore = create<ThemeStore>()(
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
        const { mode } = get();
        const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
        set({
          mode: nextMode,
          resolvedTheme: resolveTheme(nextMode),
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
  )
);

/** Selector for theme mode. */
export const selectThemeMode = (state: ThemeStore): ThemeMode => state.mode;

/** Selector for resolved theme. */
export const selectResolvedTheme = (state: ThemeStore): 'light' | 'dark' =>
  state.resolvedTheme;

/** Selector for whether dark mode is active. */
export const selectIsDark = (state: ThemeStore): boolean =>
  state.resolvedTheme === 'dark';
