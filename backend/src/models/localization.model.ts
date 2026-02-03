/**
 * Localization Models
 * Task 1.1: Define locale preference storage model
 */

import { z } from 'zod';

/**
 * Supported locales - extend as needed
 */
export const SUPPORTED_LOCALES = [
  'en',      // English (default)
  'en-US',   // English (US)
  'en-GB',   // English (UK)
  'es',      // Spanish
  'es-MX',   // Spanish (Mexico)
  'fr',      // French
  'fr-CA',   // French (Canada)
  'de',      // German
  'pt',      // Portuguese
  'pt-BR',   // Portuguese (Brazil)
  'zh',      // Chinese (Simplified)
  'zh-TW',   // Chinese (Traditional)
  'ja',      // Japanese
  'ko',      // Korean
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Default locale when no preference is set
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Fallback chain for locale resolution
 * Maps specific locales to their parent/fallback
 */
export const LOCALE_FALLBACKS: Record<string, SupportedLocale> = {
  'en-US': 'en',
  'en-GB': 'en',
  'es-MX': 'es',
  'fr-CA': 'fr',
  'pt-BR': 'pt',
  'zh-TW': 'zh',
};

/**
 * User locale preference entity
 */
export interface LocalePreference {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  locale: SupportedLocale;
  timezone?: string;
  dateFormat?: string;
  numberFormat?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Translation namespace for organizing resources
 */
export type TranslationNamespace = 
  | 'common'
  | 'auth'
  | 'navigation'
  | 'forms'
  | 'errors'
  | 'notifications'
  | 'screening'
  | 'dashboard';

/**
 * Translation resource bundle
 */
export interface TranslationBundle {
  locale: SupportedLocale;
  namespace: TranslationNamespace;
  translations: Record<string, string | Record<string, unknown>>;
  version: string;
  updatedAt: Date;
}

/**
 * Locale preference update input
 */
export interface UpdateLocalePreferenceInput {
  locale?: SupportedLocale;
  timezone?: string;
  dateFormat?: string;
  numberFormat?: string;
}

/**
 * Request for translation resources
 */
export interface GetTranslationsInput {
  locale: SupportedLocale;
  namespaces?: TranslationNamespace[];
}

/**
 * Response for translation resources
 */
export interface TranslationsResponse {
  locale: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  bundles: TranslationBundle[];
  cachedAt?: Date;
}

// Validation schemas
export const supportedLocaleSchema = z.enum(SUPPORTED_LOCALES);

export const updateLocalePreferenceSchema = z.object({
  locale: supportedLocaleSchema.optional(),
  timezone: z.string().max(50).optional(),
  dateFormat: z.string().max(50).optional(),
  numberFormat: z.string().max(50).optional(),
}).refine(
  (data) => data.locale || data.timezone || data.dateFormat || data.numberFormat,
  { message: 'At least one field must be provided' }
);

export const getTranslationsQuerySchema = z.object({
  locale: supportedLocaleSchema,
  namespaces: z.string()
    .optional()
    .transform((val) => val?.split(',') as TranslationNamespace[] | undefined),
});

/**
 * Check if a locale is supported
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get fallback locale for a given locale
 */
export function getFallbackLocale(locale: SupportedLocale): SupportedLocale {
  return LOCALE_FALLBACKS[locale] ?? DEFAULT_LOCALE;
}

/**
 * Resolve locale chain (current -> fallback -> default)
 */
export function getLocaleChain(locale: SupportedLocale): SupportedLocale[] {
  const chain: SupportedLocale[] = [locale];
  
  const fallback = LOCALE_FALLBACKS[locale];
  if (fallback && fallback !== locale) {
    chain.push(fallback);
  }
  
  if (!chain.includes(DEFAULT_LOCALE)) {
    chain.push(DEFAULT_LOCALE);
  }
  
  return chain;
}
