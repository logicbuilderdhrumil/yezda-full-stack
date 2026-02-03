/**
 * I18n provider that initializes i18next and syncs with locale store.
 */

import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useLocaleStore, selectLocale } from '@/store/localeStore';
import { resources, supportedLocales, defaultLocale } from '@/locales';
import type { LocaleCode } from '@/@types/stores';

// Initialize i18next
const i18nInstance = i18n.createInstance();

i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLocale,
    supportedLngs: supportedLocales as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
    resources,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'yezda-locale',
    },
  });

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * I18nProvider wraps the app with i18next context and syncs with locale store.
 */
export function I18nProvider({ children }: I18nProviderProps): ReactNode {
  const locale = useLocaleStore(selectLocale);

  // Sync i18n language with store
  useEffect(() => {
    if (i18nInstance.language !== locale) {
      i18nInstance.changeLanguage(locale as LocaleCode);
    }
  }, [locale]);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}

export { i18nInstance };
