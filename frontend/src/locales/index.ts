/**
 * Locale resources for i18n.
 * This module exports all translation resources.
 */

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';
import pt from './pt.json';

/**
 * All supported locales with their translation resources.
 */
export const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
} as const;

/**
 * Supported locale codes.
 */
export const supportedLocales = ['en', 'es', 'fr', 'de', 'pt'] as const;

/**
 * Default locale code.
 */
export const defaultLocale = 'en';

export { en, es, fr, de, pt };
