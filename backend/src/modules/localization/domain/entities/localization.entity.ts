/**
 * Localization Domain Entities
 */
export const SUPPORTED_LOCALES = ['en', 'en-US', 'en-GB', 'es', 'es-MX', 'fr', 'fr-CA', 'de', 'pt', 'pt-BR', 'zh', 'zh-TW', 'ja', 'ko'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_FALLBACKS: Record<string, SupportedLocale> = { 'en-US': 'en', 'en-GB': 'en', 'es-MX': 'es', 'fr-CA': 'fr', 'pt-BR': 'pt', 'zh-TW': 'zh' };

export type TranslationNamespace = 'common' | 'auth' | 'navigation' | 'forms' | 'errors' | 'notifications' | 'screening' | 'dashboard';

export interface LocalePreference { id: string; userId: string; userType: 'user' | 'candidate'; tenantId: string; locale: SupportedLocale; timezone?: string; dateFormat?: string; numberFormat?: string; createdAt: Date; updatedAt: Date; }
export interface TranslationBundle { locale: SupportedLocale; namespace: TranslationNamespace; translations: Record<string, string | Record<string, unknown>>; version: string; updatedAt: Date; }
export interface UpdateLocalePreferenceInput { locale?: SupportedLocale; timezone?: string; dateFormat?: string; numberFormat?: string; }
export interface TranslationsResponse { locale: SupportedLocale; fallbackLocale?: SupportedLocale; bundles: TranslationBundle[]; cachedAt?: Date; }

export function isValidLocale(locale: string): locale is SupportedLocale { return SUPPORTED_LOCALES.includes(locale as SupportedLocale); }
export function getFallbackLocale(locale: SupportedLocale): SupportedLocale { return LOCALE_FALLBACKS[locale] ?? DEFAULT_LOCALE; }
export function getLocaleChain(locale: SupportedLocale): SupportedLocale[] {
  const chain: SupportedLocale[] = [locale];
  const fb = LOCALE_FALLBACKS[locale];
  if (fb && fb !== locale) chain.push(fb);
  if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE);
  return chain;
}

export interface RequestContext { userId: string; userType: 'user' | 'candidate'; tenantId: string; ipAddress?: string; channel?: 'web' | 'mobile' | 'api'; }
export type OperationResult<T> = { success: true; data: T } | { success: false; error: string; code: string };
