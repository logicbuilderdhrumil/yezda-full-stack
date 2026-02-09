import type { ILocalizationRepository } from '../../domain/ports/ILocalizationRepository.js';
import type { LocalePreference, TranslationBundle, UpdateLocalePreferenceInput, SupportedLocale, TranslationNamespace } from '../../domain/entities/localization.entity.js';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../../domain/entities/localization.entity.js';
import { randomUUID } from 'crypto';

const prefStore = new Map<string, LocalePreference>();

const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en:common': JSON.parse('{"greeting":"Hello","goodbye":"Goodbye","save":"Save","cancel":"Cancel","delete":"Delete","loading":"Loading..."}'),
  'en:auth': JSON.parse('{"login":"Log in","logout":"Log out","register":"Register","forgot_password":"Forgot password?"}'),
  'es:common': JSON.parse('{"greeting":"Hola","goodbye":"Adiós","save":"Guardar","cancel":"Cancelar","delete":"Eliminar","loading":"Cargando..."}'),
};

export class InMemoryLocalizationRepository implements ILocalizationRepository {
  async getPreference(tenantId: string, userId: string): Promise<LocalePreference | null> {
    return prefStore.get(`${tenantId}:${userId}`) ?? null;
  }

  async upsertPreference(tenantId: string, userId: string, userType: 'user' | 'candidate', input: UpdateLocalePreferenceInput): Promise<LocalePreference> {
    const key = `${tenantId}:${userId}`;
    const existing = prefStore.get(key);
    const pref: LocalePreference = {
      id: existing?.id ?? randomUUID(),
      userId, userType, tenantId,
      locale: input.locale ?? existing?.locale ?? DEFAULT_LOCALE,
      timezone: input.timezone ?? existing?.timezone,
      dateFormat: input.dateFormat ?? existing?.dateFormat,
      numberFormat: input.numberFormat ?? existing?.numberFormat,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    prefStore.set(key, pref);
    return pref;
  }

  async getTranslations(locale: SupportedLocale, namespaces?: TranslationNamespace[]): Promise<TranslationBundle[]> {
    const ns: TranslationNamespace[] = namespaces ?? ['common'];
    return ns.map(namespace => {
      const key = `${locale}:${namespace}`;
      const fallbackKey = `en:${namespace}`;
      const translations = MOCK_TRANSLATIONS[key] ?? MOCK_TRANSLATIONS[fallbackKey] ?? {};
      return { locale, namespace, translations, version: '1.0.0', updatedAt: new Date() };
    });
  }

  async getSupportedLocales(): Promise<SupportedLocale[]> {
    return [...SUPPORTED_LOCALES];
  }
}
