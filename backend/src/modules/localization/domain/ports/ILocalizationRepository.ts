import type { LocalePreference, TranslationBundle, UpdateLocalePreferenceInput, SupportedLocale, TranslationNamespace } from '../entities/localization.entity.js';

export interface ILocalizationRepository {
  getPreference(tenantId: string, userId: string): Promise<LocalePreference | null>;
  upsertPreference(tenantId: string, userId: string, userType: 'user' | 'candidate', input: UpdateLocalePreferenceInput): Promise<LocalePreference>;
  getTranslations(locale: SupportedLocale, namespaces?: TranslationNamespace[]): Promise<TranslationBundle[]>;
  getSupportedLocales(): Promise<SupportedLocale[]>;
}
