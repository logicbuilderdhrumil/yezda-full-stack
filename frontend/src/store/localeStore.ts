import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LocaleCode, LocaleState } from '@/@types/stores';

const STORAGE_KEY = 'yezda-locale';
const DEFAULT_LOCALE: LocaleCode = 'en';

export interface LocaleStore extends LocaleState {
  /** Set the current locale. */
  setLocale: (locale: LocaleCode) => void;
  /** Set loading state. */
  setLoading: (isLoading: boolean) => void;
  /** Reset to default locale. */
  reset: () => void;
}

const initialState: LocaleState = {
  locale: DEFAULT_LOCALE,
  isLoading: false,
};

/**
 * Locale store for managing i18n preferences with persistence.
 */
export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      ...initialState,

      setLocale: (locale: LocaleCode) => {
        set({ locale, isLoading: false });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        locale: state.locale,
      }),
    }
  )
);

/** Selector for current locale. */
export const selectLocale = (state: LocaleStore): LocaleCode => state.locale;

/** Selector for loading state. */
export const selectLocaleLoading = (state: LocaleStore): boolean =>
  state.isLoading;
