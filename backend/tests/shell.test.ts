/**
 * Shell Configuration Tests
 * Task 1.4: Tests for shell configuration responses
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shellService, ShellService } from '../src/services/shell.service.js';
import { metricsService, SHELL_SLOS } from '../src/services/metrics.service.js';

describe('Shell Service', () => {
  describe('Shell Configuration', () => {
    it('should return shell configuration with layout metadata', async () => {
      const config = await shellService.getShellConfig();

      expect(config.version).toBeDefined();
      expect(config.layout).toBeDefined();
      expect(config.layout.header).toBeDefined();
      expect(config.layout.header.visible).toBe(true);
      expect(config.layout.sidebar).toBeDefined();
      expect(config.layout.sidebar.visible).toBe(true);
      expect(config.layout.sidebar.position).toBe('left');
      expect(config.layout.content).toBeDefined();
    });

    it('should return shell features', async () => {
      const config = await shellService.getShellConfig();

      expect(config.features).toBeDefined();
      expect(config.features.mfaEnabled).toBe(true);
      expect(config.features.notificationsEnabled).toBe(true);
      expect(config.features.themeToggle).toBe(true);
      expect(config.features.languageSwitch).toBe(true);
    });

    it('should return branding configuration', async () => {
      const config = await shellService.getShellConfig();

      expect(config.branding).toBeDefined();
      expect(config.branding.appName).toBe('Yezda');
      expect(config.branding.primaryColor).toBeDefined();
    });

    it('should support tenant-specific configuration', async () => {
      const config = await shellService.getShellConfig('tenant-123');

      expect(config.version).toBeDefined();
      expect(config.layout).toBeDefined();
    });
  });

  describe('Route Policies', () => {
    it('should return route policies with public and protected routes', async () => {
      const policies = await shellService.getRoutePolicies();

      expect(policies.version).toBeDefined();
      expect(policies.policies).toBeInstanceOf(Array);
      expect(policies.policies.length).toBeGreaterThan(0);

      // Check for public routes
      const publicRoutes = policies.policies.filter(p => p.public);
      expect(publicRoutes.length).toBeGreaterThan(0);

      // Check for protected routes
      const protectedRoutes = policies.policies.filter(p => !p.public);
      expect(protectedRoutes.length).toBeGreaterThan(0);
    });

    it('should include auth endpoints as public', async () => {
      const policies = await shellService.getRoutePolicies();

      const signInPolicy = policies.policies.find(p => p.route.includes('signin'));
      expect(signInPolicy).toBeDefined();
      expect(signInPolicy?.public).toBe(true);
    });

    it('should include shell config endpoints as public', async () => {
      const policies = await shellService.getRoutePolicies();

      const shellConfigPolicy = policies.policies.find(p => p.route.includes('shell/config'));
      expect(shellConfigPolicy).toBeDefined();
      expect(shellConfigPolicy?.public).toBe(true);
    });

    it('should include admin routes as protected with authorities', async () => {
      const policies = await shellService.getRoutePolicies();

      const adminPolicy = policies.policies.find(p => p.route.includes('admin'));
      expect(adminPolicy).toBeDefined();
      expect(adminPolicy?.public).toBe(false);
      expect(adminPolicy?.authorities).toContain('admin');
    });
  });

  describe('Role-based Navigation', () => {
    it('should return navigation items for authorized user', async () => {
      const navigation = await shellService.getNavigation(
        ['candidate:read', 'screening:read'],
        'user-123',
        'user'
      );

      expect(navigation.items).toBeInstanceOf(Array);
      expect(navigation.defaultPath).toBe('/dashboard');
    });

    it('should filter navigation items by authority', async () => {
      // User with limited authorities
      const limitedNav = await shellService.getNavigation(['candidate:read']);
      
      // User with admin authority
      const adminNav = await shellService.getNavigation(['admin']);

      // Admin should see admin items
      const adminItem = adminNav.items.find(item => item.id === 'admin');
      expect(adminItem).toBeDefined();

      // Limited user should not see admin items
      const noAdminItem = limitedNav.items.find(item => item.id === 'admin');
      expect(noAdminItem).toBeUndefined();
    });

    it('should include dashboard for all users', async () => {
      const navigation = await shellService.getNavigation([]);

      const dashboard = navigation.items.find(item => item.id === 'dashboard');
      expect(dashboard).toBeDefined();
      expect(dashboard?.path).toBe('/dashboard');
    });

    it('should include nested navigation items filtered by authority', async () => {
      const navigation = await shellService.getNavigation(['settings:read', 'org:admin']);

      const settings = navigation.items.find(item => item.id === 'settings');
      expect(settings).toBeDefined();
      expect(settings?.children).toBeInstanceOf(Array);

      // Should include organization settings
      const orgSettings = settings?.children?.find(child => child.id === 'settings-organization');
      expect(orgSettings).toBeDefined();
    });

    it('should filter out nested items without authority', async () => {
      const navigation = await shellService.getNavigation(['settings:read']);

      const settings = navigation.items.find(item => item.id === 'settings');
      expect(settings).toBeDefined();

      // Should include account settings (no authority required)
      const accountSettings = settings?.children?.find(child => child.id === 'settings-account');
      expect(accountSettings).toBeDefined();

      // Should not include org settings (requires org:admin)
      const orgSettings = settings?.children?.find(child => child.id === 'settings-organization');
      expect(orgSettings).toBeUndefined();
    });
  });

  describe('Preference Defaults', () => {
    it('should return theme defaults', async () => {
      const defaults = await shellService.getPreferenceDefaults();

      expect(defaults.theme).toBeDefined();
      expect(defaults.availableThemes).toBeInstanceOf(Array);
      expect(defaults.availableThemes).toContain('light');
      expect(defaults.availableThemes).toContain('dark');
      expect(defaults.availableThemes).toContain('system');
    });

    it('should return locale defaults', async () => {
      const defaults = await shellService.getPreferenceDefaults();

      expect(defaults.locale).toBeDefined();
      expect(defaults.locale.code).toBeDefined();
      expect(defaults.locale.name).toBeDefined();
      expect(defaults.locale.direction).toBeDefined();
    });

    it('should return available locales', async () => {
      const defaults = await shellService.getPreferenceDefaults();

      expect(defaults.availableLocales).toBeInstanceOf(Array);
      expect(defaults.availableLocales.length).toBeGreaterThan(0);

      // Check for English locale
      const english = defaults.availableLocales.find(l => l.code === 'en');
      expect(english).toBeDefined();
      expect(english?.direction).toBe('ltr');
    });

    it('should include RTL locale options', async () => {
      const defaults = await shellService.getPreferenceDefaults();

      const rtlLocale = defaults.availableLocales.find(l => l.direction === 'rtl');
      expect(rtlLocale).toBeDefined();
    });
  });

  describe('User Preferences', () => {
    it('should return null for non-existent preferences', async () => {
      const prefs = await shellService.getUserPreferences('nonexistent-user', 'user');

      expect(prefs).toBeNull();
    });

    it('should update and retrieve user preferences', async () => {
      const userId = `test-user-${Date.now()}`;

      // Update preferences
      const updated = await shellService.updateUserPreferences(
        userId,
        'user',
        { theme: 'dark', localeCode: 'es' }
      );

      expect(updated.theme).toBe('dark');
      expect(updated.localeCode).toBe('es');

      // Retrieve preferences
      const retrieved = await shellService.getUserPreferences(userId, 'user');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.theme).toBe('dark');
      expect(retrieved?.localeCode).toBe('es');
    });

    it('should maintain tenant isolation for preferences', async () => {
      const userId = `tenant-user-${Date.now()}`;

      // Update preferences for tenant A
      await shellService.updateUserPreferences(
        userId,
        'user',
        { theme: 'dark' },
        'tenant-a'
      );

      // Update preferences for tenant B
      await shellService.updateUserPreferences(
        userId,
        'user',
        { theme: 'light' },
        'tenant-b'
      );

      // Retrieve preferences for tenant A
      const tenantAPrefs = await shellService.getUserPreferences(userId, 'user', 'tenant-a');
      expect(tenantAPrefs?.theme).toBe('dark');

      // Retrieve preferences for tenant B
      const tenantBPrefs = await shellService.getUserPreferences(userId, 'user', 'tenant-b');
      expect(tenantBPrefs?.theme).toBe('light');
    });

    it('should partially update preferences', async () => {
      const userId = `partial-update-${Date.now()}`;

      // Set initial preferences
      await shellService.updateUserPreferences(
        userId,
        'user',
        { theme: 'dark', localeCode: 'en' }
      );

      // Partially update theme only
      const updated = await shellService.updateUserPreferences(
        userId,
        'user',
        { theme: 'light' }
      );

      expect(updated.theme).toBe('light');
      expect(updated.localeCode).toBe('en'); // Should retain previous value
    });
  });

  describe('Validation', () => {
    it('should validate theme values', () => {
      expect(shellService.isValidTheme('light')).toBe(true);
      expect(shellService.isValidTheme('dark')).toBe(true);
      expect(shellService.isValidTheme('system')).toBe(true);
      expect(shellService.isValidTheme('invalid')).toBe(false);
    });

    it('should validate locale codes', () => {
      expect(shellService.isValidLocaleCode('en')).toBe(true);
      expect(shellService.isValidLocaleCode('es')).toBe(true);
      expect(shellService.isValidLocaleCode('fr')).toBe(true);
      expect(shellService.isValidLocaleCode('ar')).toBe(true);
      expect(shellService.isValidLocaleCode('invalid')).toBe(false);
    });
  });
});

describe('Shell Metrics Service', () => {
  describe('Shell SLO Constants', () => {
    it('should have defined latency SLOs', () => {
      expect(SHELL_SLOS.CONFIG_LATENCY_P99_MS).toBeDefined();
      expect(SHELL_SLOS.CONFIG_LATENCY_P95_MS).toBeDefined();
      expect(SHELL_SLOS.NAVIGATION_LATENCY_P99_MS).toBeDefined();
    });

    it('should have defined availability SLOs', () => {
      expect(SHELL_SLOS.CONFIG_AVAILABILITY_RATE).toBeDefined();
      expect(SHELL_SLOS.CONFIG_AVAILABILITY_RATE).toBeGreaterThan(99);
    });

    it('should have defined cache SLOs', () => {
      expect(SHELL_SLOS.CACHE_HIT_RATE_MIN).toBeDefined();
      expect(SHELL_SLOS.CACHE_HIT_RATE_MIN).toBeGreaterThan(0);
    });
  });

  describe('Shell Metrics Recording', () => {
    it('should record shell config request', () => {
      metricsService.recordShellConfigRequest('/config', false);
      // Metrics are recorded without errors
    });

    it('should record shell config latency', () => {
      metricsService.recordShellConfigLatency('/config', 50);
      // Metrics are recorded without errors
    });

    it('should record navigation request', () => {
      metricsService.recordNavigationRequest(true);
      // Metrics are recorded without errors
    });

    it('should record preference update', () => {
      metricsService.recordPreferenceUpdate('user');
      // Metrics are recorded without errors
    });
  });

  describe('Shell SLO Checks', () => {
    it('should check shell SLOs', () => {
      const sloResult = metricsService.checkShellSLOs();

      expect(sloResult).toBeDefined();
      expect(typeof sloResult.met).toBe('boolean');
      expect(sloResult.violations).toBeInstanceOf(Array);
    });

    it('should report violations when latency exceeds SLO', () => {
      // Record high latency
      for (let i = 0; i < 100; i++) {
        metricsService.recordShellConfigLatency('/config', SHELL_SLOS.CONFIG_LATENCY_P99_MS + 50);
      }

      const sloResult = metricsService.checkShellSLOs();
      expect(sloResult.met).toBe(false);
      expect(sloResult.violations.some(v => v.includes('latency'))).toBe(true);
    });
  });
});
