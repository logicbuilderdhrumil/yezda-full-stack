/**
 * Localization Service
 * Task 1.2, 1.3, 1.5, 1.6: Core localization business logic with tenant isolation and audit logging
 */

import type {
  LocalePreference,
  SupportedLocale,
  TranslationNamespace,
  TranslationBundle,
  TranslationsResponse,
  UpdateLocalePreferenceInput,
} from '../models/localization.model.js';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getLocaleChain,
} from '../models/localization.model.js';
import { localePreferenceRepository } from '../repositories/locale-preference.repository.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { cacheGet, cacheSet } from '../db/redis.js';

/**
 * Translation cache TTL (5 minutes)
 */
const TRANSLATION_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * In-memory translation bundles (replace with database/CDN in production)
 */
const translationStore = new Map<string, TranslationBundle>();

/**
 * Initialize default translations
 */
function initializeDefaultTranslations(): void {
  const version = '1.0.0';
  const updatedAt = new Date();

  // English common translations
  translationStore.set('en:common', {
    locale: 'en',
    namespace: 'common',
    version,
    updatedAt,
    translations: {
      'app.name': 'Yezda',
      'app.tagline': 'Employment Screening Service',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.submit': 'Submit',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success',
    },
  });

  translationStore.set('en:auth', {
    locale: 'en',
    namespace: 'auth',
    version,
    updatedAt,
    translations: {
      'auth.signIn': 'Sign In',
      'auth.signOut': 'Sign Out',
      'auth.signUp': 'Sign Up',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.resetPassword': 'Reset Password',
    },
  });

  translationStore.set('en:errors', {
    locale: 'en',
    namespace: 'errors',
    version,
    updatedAt,
    translations: {
      'errors.generic': 'Something went wrong. Please try again.',
      'errors.notFound': 'Resource not found',
      'errors.unauthorized': 'You are not authorized to perform this action',
      'errors.validation': 'Please check your input',
      'errors.network': 'Network error. Please check your connection.',
    },
  });

  // Spanish translations
  translationStore.set('es:common', {
    locale: 'es',
    namespace: 'common',
    version,
    updatedAt,
    translations: {
      'app.name': 'Yezda',
      'app.tagline': 'Servicio de Verificación de Empleo',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.submit': 'Enviar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.loading': 'Cargando...',
      'common.error': 'Ocurrió un error',
      'common.success': 'Éxito',
    },
  });

  translationStore.set('es:auth', {
    locale: 'es',
    namespace: 'auth',
    version,
    updatedAt,
    translations: {
      'auth.signIn': 'Iniciar Sesión',
      'auth.signOut': 'Cerrar Sesión',
      'auth.signUp': 'Registrarse',
      'auth.email': 'Correo Electrónico',
      'auth.password': 'Contraseña',
      'auth.forgotPassword': '¿Olvidaste tu Contraseña?',
      'auth.resetPassword': 'Restablecer Contraseña',
    },
  });
}

// Initialize translations on module load
initializeDefaultTranslations();

export interface LocalizationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export class LocalizationService {
  /**
   * Get user locale preference
   */
  async getLocalePreference(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string,
    _ipAddress?: string
  ): Promise<LocalizationResult<LocalePreference>> {
    const startTime = Date.now();

    try {
      let preference = await localePreferenceRepository.findByUser(userId, userType, tenantId);

      // Return default preference if none exists
      if (!preference) {
        preference = {
          id: '',
          userId,
          userType,
          tenantId,
          locale: DEFAULT_LOCALE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      metricsService.recordLocalizationRequest('preference_read', true, Date.now() - startTime);
      return { success: true, data: preference };
    } catch (error) {
      metricsService.recordLocalizationRequest('preference_read', false, Date.now() - startTime);
      console.error('[LocalizationService] Failed to get preference:', error);
      return { success: false, error: 'Failed to retrieve locale preference', errorCode: 'PREFERENCE_READ_ERROR' };
    }
  }

  /**
   * Update user locale preference
   * Task 1.5: Enforces that user can only update their own preference
   * Task 1.6: Records audit event for preference changes
   */
  async updateLocalePreference(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string,
    updates: UpdateLocalePreferenceInput,
    actorId: string,
    actorType: 'user' | 'candidate',
    ipAddress?: string,
    userAgent?: string
  ): Promise<LocalizationResult<LocalePreference>> {
    const startTime = Date.now();

    // Task 1.5: RBAC - user can only update their own preference
    if (actorId !== userId || actorType !== userType) {
      auditService.logLocaleUpdateDenied({
        actorId,
        actorType,
        targetUserId: userId,
        targetUserType: userType,
        tenantId,
        reason: 'Cannot update another user\'s locale preference',
        channel: 'api',
        ipAddress,
        userAgent,
      });

      metricsService.recordLocalizationRequest('preference_update', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Cannot update another user\'s locale preference',
        errorCode: 'ACCESS_DENIED',
      };
    }

    try {
      const oldPreference = await localePreferenceRepository.findByUser(userId, userType, tenantId);
      const preference = await localePreferenceRepository.upsert(userId, userType, tenantId, updates);

      // Task 1.6: Audit log for preference change
      auditService.logLocalePreferenceUpdated({
        userId,
        userType,
        tenantId,
        previousLocale: oldPreference?.locale ?? DEFAULT_LOCALE,
        newLocale: preference.locale,
        changes: updates as Record<string, unknown>,
        channel: 'api',
        ipAddress,
        userAgent,
      });

      metricsService.recordLocalizationRequest('preference_update', true, Date.now() - startTime);
      metricsService.recordPreferenceUpdate(userType);

      return { success: true, data: preference };
    } catch (error) {
      metricsService.recordLocalizationRequest('preference_update', false, Date.now() - startTime);
      console.error('[LocalizationService] Failed to update preference:', error);
      return { success: false, error: 'Failed to update locale preference', errorCode: 'PREFERENCE_UPDATE_ERROR' };
    }
  }

  /**
   * Get translation resources
   * Task 1.3: Translation resource retrieval
   * Task 1.6: Audit log for translation access
   * Task 1.7: Caching for translation endpoints
   */
  async getTranslations(
    locale: SupportedLocale,
    namespaces?: TranslationNamespace[],
    userId?: string,
    userType?: 'user' | 'candidate',
    tenantId?: string,
    ipAddress?: string
  ): Promise<LocalizationResult<TranslationsResponse>> {
    const startTime = Date.now();
    const requestedNamespaces = namespaces ?? ['common', 'auth', 'errors'];

    // Task 1.7: Check cache first
    const cacheKey = `translations:${locale}:${requestedNamespaces.sort().join(',')}`;
    
    try {
      const cached = await cacheGet<TranslationsResponse>(cacheKey);
      if (cached) {
        metricsService.recordLocalizationCacheHit();
        metricsService.recordLocalizationRequest('translations', true, Date.now() - startTime);

        // Task 1.6: Audit log (lightweight for cached responses)
        if (userId && tenantId) {
          auditService.logTranslationAccess({
            userId,
            userType: userType ?? 'user',
            tenantId,
            locale,
            namespaces: requestedNamespaces,
            cached: true,
            channel: 'api',
            ipAddress,
          });
        }

        return { success: true, data: { ...cached, cachedAt: new Date() } };
      }
    } catch (error) {
      // Cache miss or error - continue to fetch
      console.warn('[LocalizationService] Cache error:', error);
    }

    metricsService.recordLocalizationCacheMiss();

    // Get locale chain for fallback
    const localeChain = getLocaleChain(locale);
    const bundles: TranslationBundle[] = [];

    // Collect translations for each namespace
    for (const ns of requestedNamespaces) {
      // Try each locale in the chain
      for (const loc of localeChain) {
        const key = `${loc}:${ns}`;
        const bundle = translationStore.get(key);
        if (bundle) {
          bundles.push(bundle);
          break; // Found translation for this namespace
        }
      }
    }

    const response: TranslationsResponse = {
      locale,
      fallbackLocale: localeChain[1] ?? undefined,
      bundles,
    };

    // Task 1.7: Cache the response
    try {
      await cacheSet(cacheKey, response, TRANSLATION_CACHE_TTL_MS);
    } catch (error) {
      console.warn('[LocalizationService] Failed to cache translations:', error);
    }

    // Task 1.6: Audit log for translation access
    if (userId && tenantId) {
      auditService.logTranslationAccess({
        userId,
        userType: userType ?? 'user',
        tenantId,
        locale,
        namespaces: requestedNamespaces,
        cached: false,
        channel: 'api',
        ipAddress,
      });
    }

    metricsService.recordLocalizationRequest('translations', true, Date.now() - startTime);
    return { success: true, data: response };
  }

  /**
   * Get list of supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return [...SUPPORTED_LOCALES];
  }

  /**
   * Check SLO compliance
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    return metricsService.checkLocalizationSLOs();
  }
}

export const localizationService = new LocalizationService();
