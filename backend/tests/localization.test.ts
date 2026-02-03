/**
 * Localization Tests
 * Task 1.4: Tests for locale preference handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { localizationService } from '../src/services/localization.service.js';
import { localePreferenceRepository } from '../src/repositories/locale-preference.repository.js';
import { metricsService } from '../src/services/metrics.service.js';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isValidLocale,
  getFallbackLocale,
  getLocaleChain,
} from '../src/models/localization.model.js';

describe('Localization Model', () => {
  describe('isValidLocale', () => {
    it('should return true for supported locales', () => {
      expect(isValidLocale('en')).toBe(true);
      expect(isValidLocale('es')).toBe(true);
      expect(isValidLocale('fr')).toBe(true);
      expect(isValidLocale('en-US')).toBe(true);
    });

    it('should return false for unsupported locales', () => {
      expect(isValidLocale('invalid')).toBe(false);
      expect(isValidLocale('xx')).toBe(false);
      expect(isValidLocale('')).toBe(false);
    });
  });

  describe('getFallbackLocale', () => {
    it('should return parent locale for regional variants', () => {
      expect(getFallbackLocale('en-US')).toBe('en');
      expect(getFallbackLocale('es-MX')).toBe('es');
      expect(getFallbackLocale('fr-CA')).toBe('fr');
    });

    it('should return default locale for base locales', () => {
      expect(getFallbackLocale('es')).toBe('en');
      expect(getFallbackLocale('fr')).toBe('en');
    });
  });

  describe('getLocaleChain', () => {
    it('should return correct chain for regional variants', () => {
      const chain = getLocaleChain('en-US');
      expect(chain).toEqual(['en-US', 'en']);
    });

    it('should return chain with default for base locales', () => {
      const chain = getLocaleChain('es');
      expect(chain).toEqual(['es', 'en']);
    });

    it('should not duplicate default locale', () => {
      const chain = getLocaleChain('en');
      expect(chain).toEqual(['en']);
    });
  });
});

describe('Locale Preference Repository', () => {
  beforeEach(async () => {
    await localePreferenceRepository.clearAll();
  });

  afterEach(async () => {
    await localePreferenceRepository.clearAll();
  });

  describe('upsert', () => {
    it('should create new preference', async () => {
      const pref = await localePreferenceRepository.upsert(
        'user-1',
        'user',
        'tenant-1',
        { locale: 'es' }
      );

      expect(pref.id).toBeDefined();
      expect(pref.userId).toBe('user-1');
      expect(pref.userType).toBe('user');
      expect(pref.tenantId).toBe('tenant-1');
      expect(pref.locale).toBe('es');
    });

    it('should update existing preference', async () => {
      await localePreferenceRepository.upsert(
        'user-2',
        'user',
        'tenant-1',
        { locale: 'en' }
      );

      const updated = await localePreferenceRepository.upsert(
        'user-2',
        'user',
        'tenant-1',
        { locale: 'fr', timezone: 'Europe/Paris' }
      );

      expect(updated.locale).toBe('fr');
      expect(updated.timezone).toBe('Europe/Paris');
    });

    it('should use default locale when not specified', async () => {
      const pref = await localePreferenceRepository.upsert(
        'user-3',
        'user',
        'tenant-1',
        { timezone: 'America/New_York' }
      );

      expect(pref.locale).toBe(DEFAULT_LOCALE);
    });
  });

  describe('findByUser', () => {
    it('should return null for non-existent user', async () => {
      const pref = await localePreferenceRepository.findByUser(
        'non-existent',
        'user',
        'tenant-1'
      );

      expect(pref).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      await localePreferenceRepository.upsert(
        'user-4',
        'user',
        'tenant-1',
        { locale: 'es' }
      );

      const sameTenant = await localePreferenceRepository.findByUser(
        'user-4',
        'user',
        'tenant-1'
      );
      expect(sameTenant).not.toBeNull();
      expect(sameTenant?.locale).toBe('es');

      const differentTenant = await localePreferenceRepository.findByUser(
        'user-4',
        'user',
        'tenant-2'
      );
      expect(differentTenant).toBeNull();
    });
  });

  describe('findByTenant', () => {
    it('should return all preferences for a tenant', async () => {
      await localePreferenceRepository.upsert('user-a', 'user', 'tenant-x', { locale: 'en' });
      await localePreferenceRepository.upsert('user-b', 'user', 'tenant-x', { locale: 'es' });
      await localePreferenceRepository.upsert('user-c', 'user', 'tenant-y', { locale: 'fr' });

      const tenantXPrefs = await localePreferenceRepository.findByTenant('tenant-x');
      expect(tenantXPrefs).toHaveLength(2);

      const tenantYPrefs = await localePreferenceRepository.findByTenant('tenant-y');
      expect(tenantYPrefs).toHaveLength(1);
    });
  });
});

describe('Localization Service', () => {
  beforeEach(async () => {
    await localePreferenceRepository.clearAll();
    metricsService.clearAll();
  });

  afterEach(async () => {
    await localePreferenceRepository.clearAll();
  });

  describe('getLocalePreference', () => {
    it('should return default preference for new user', async () => {
      const result = await localizationService.getLocalePreference(
        'new-user',
        'user',
        'tenant-1'
      );

      expect(result.success).toBe(true);
      expect(result.data?.locale).toBe(DEFAULT_LOCALE);
    });

    it('should return stored preference for existing user', async () => {
      await localePreferenceRepository.upsert(
        'existing-user',
        'user',
        'tenant-1',
        { locale: 'es', timezone: 'America/Mexico_City' }
      );

      const result = await localizationService.getLocalePreference(
        'existing-user',
        'user',
        'tenant-1'
      );

      expect(result.success).toBe(true);
      expect(result.data?.locale).toBe('es');
      expect(result.data?.timezone).toBe('America/Mexico_City');
    });
  });

  describe('updateLocalePreference', () => {
    it('should update own preference', async () => {
      const result = await localizationService.updateLocalePreference(
        'self-user',
        'user',
        'tenant-1',
        { locale: 'fr' },
        'self-user',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.data?.locale).toBe('fr');
    });

    it('should deny updating another users preference', async () => {
      const result = await localizationService.updateLocalePreference(
        'target-user',
        'user',
        'tenant-1',
        { locale: 'fr' },
        'attacker-user',
        'user'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ACCESS_DENIED');
    });

    it('should deny cross-type access', async () => {
      const result = await localizationService.updateLocalePreference(
        'target-user',
        'user',
        'tenant-1',
        { locale: 'fr' },
        'target-user',
        'candidate'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ACCESS_DENIED');
    });
  });

  describe('getTranslations', () => {
    it('should return translations for valid locale', async () => {
      const result = await localizationService.getTranslations('en', ['common', 'auth']);

      expect(result.success).toBe(true);
      expect(result.data?.locale).toBe('en');
      expect(result.data?.bundles).toBeDefined();
      expect(result.data?.bundles.length).toBeGreaterThan(0);
    });

    it('should include fallback locale in response', async () => {
      const result = await localizationService.getTranslations('en-US');

      expect(result.success).toBe(true);
      expect(result.data?.fallbackLocale).toBe('en');
    });

    it('should return bundles for default namespaces', async () => {
      const result = await localizationService.getTranslations('en');

      expect(result.success).toBe(true);
      // Default namespaces: common, auth, errors
      expect(result.data?.bundles.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getSupportedLocales', () => {
    it('should return all supported locales', () => {
      const locales = localizationService.getSupportedLocales();

      expect(locales).toEqual(expect.arrayContaining(['en', 'es', 'fr']));
      expect(locales.length).toBe(SUPPORTED_LOCALES.length);
    });
  });

  describe('SLO compliance', () => {
    it('should report healthy when no violations', () => {
      const sloStatus = localizationService.checkSLOs();

      expect(sloStatus.met).toBe(true);
      expect(sloStatus.violations).toHaveLength(0);
    });
  });
});
