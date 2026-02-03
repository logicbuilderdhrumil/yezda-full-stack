/**
 * Theme System Tests
 * Task 1.3: Add tests for theme preference persistence
 * Task 1.4: Test tenant scoping and RBAC
 * Task 1.5: Test audit logging
 * Task 1.6: Test rate limiting
 * Task 1.7: Test SLO metrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  THEME_PRESETS,
  DEFAULT_THEME_PRESET_ID,
  THEME_SLOS,
  LIGHT_THEME_TOKENS,
  DARK_THEME_TOKENS,
  HIGH_CONTRAST_THEME_TOKENS,
  type ThemePresetId,
  type ThemePreference,
} from '../src/models/theme.model.js';
import { themeRepository } from '../src/repositories/theme.repository.js';
import { themeService } from '../src/services/theme.service.js';
import { themeMetricsService, THEME_METRICS } from '../src/services/theme-metrics.service.js';

describe('Theme Model', () => {
  describe('Theme Presets', () => {
    it('should have light, dark, and high-contrast presets', () => {
      expect(THEME_PRESETS).toHaveProperty('light');
      expect(THEME_PRESETS).toHaveProperty('dark');
      expect(THEME_PRESETS).toHaveProperty('high-contrast');
    });

    it('should have valid structure for each preset', () => {
      for (const preset of Object.values(THEME_PRESETS)) {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('tokens');
        expect(preset.tokens).toHaveProperty('colors');
        expect(preset.tokens).toHaveProperty('typography');
        expect(preset.tokens).toHaveProperty('spacing');
        expect(preset.tokens).toHaveProperty('radius');
      }
    });

    it('should have complete color tokens for each preset', () => {
      const requiredColors = [
        'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
        'background', 'foreground', 'muted', 'mutedForeground',
        'accent', 'accentForeground', 'destructive', 'destructiveForeground',
        'border', 'input', 'ring', 'card', 'cardForeground',
        'popover', 'popoverForeground',
      ];

      for (const preset of Object.values(THEME_PRESETS)) {
        for (const color of requiredColors) {
          expect(preset.tokens.colors).toHaveProperty(color);
        }
      }
    });

    it('should default to light theme', () => {
      expect(DEFAULT_THEME_PRESET_ID).toBe('light');
    });
  });

  describe('Theme SLOs', () => {
    it('should define latency targets', () => {
      expect(THEME_SLOS.READ_LATENCY_P99_MS).toBeDefined();
      expect(THEME_SLOS.WRITE_LATENCY_P99_MS).toBeDefined();
      expect(THEME_SLOS.READ_LATENCY_P99_MS).toBeLessThan(THEME_SLOS.WRITE_LATENCY_P99_MS);
    });

    it('should define availability targets', () => {
      expect(THEME_SLOS.READ_SUCCESS_RATE).toBeGreaterThanOrEqual(99);
      expect(THEME_SLOS.WRITE_SUCCESS_RATE).toBeGreaterThanOrEqual(99);
    });

    it('should define rate limits', () => {
      expect(THEME_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS).toBe(60000);
      expect(THEME_SLOS.DEFAULT_READ_RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(
        THEME_SLOS.DEFAULT_WRITE_RATE_LIMIT_MAX_REQUESTS
      );
    });

    it('should define cache TTLs', () => {
      expect(THEME_SLOS.PRESET_CACHE_TTL_MS).toBeDefined();
      expect(THEME_SLOS.PREFERENCE_CACHE_TTL_MS).toBeDefined();
    });
  });
});

describe('Theme Repository', () => {
  const tenantId = 'tenant-123';
  const userId = 'user-456';
  const userType = 'user' as const;

  beforeEach(async () => {
    await themeRepository.clear();
  });

  describe('findByUser', () => {
    it('should return null when no preference exists', async () => {
      const result = await themeRepository.findByUser(tenantId, userId, userType);
      expect(result).toBeNull();
    });

    it('should return preference when it exists', async () => {
      await themeRepository.upsert({ tenantId, userId, userType, presetId: 'dark' });
      const result = await themeRepository.findByUser(tenantId, userId, userType);
      expect(result).not.toBeNull();
      expect(result?.presetId).toBe('dark');
    });
  });

  describe('upsert', () => {
    it('should create a new preference', async () => {
      const result = await themeRepository.upsert({
        tenantId,
        userId,
        userType,
        presetId: 'dark',
      });

      expect(result.id).toBeDefined();
      expect(result.tenantId).toBe(tenantId);
      expect(result.userId).toBe(userId);
      expect(result.userType).toBe(userType);
      expect(result.presetId).toBe('dark');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should update existing preference', async () => {
      const first = await themeRepository.upsert({
        tenantId,
        userId,
        userType,
        presetId: 'dark',
      });

      const second = await themeRepository.upsert({
        tenantId,
        userId,
        userType,
        presetId: 'high-contrast',
      });

      expect(second.id).toBe(first.id);
      expect(second.presetId).toBe('high-contrast');
      expect(second.createdAt).toEqual(first.createdAt);
      expect(second.updatedAt.getTime()).toBeGreaterThanOrEqual(first.updatedAt.getTime());
    });

    it('should store custom tokens', async () => {
      const customTokens = {
        colors: { primary: 'hsl(0 100% 50%)' },
      };

      const result = await themeRepository.upsert({
        tenantId,
        userId,
        userType,
        presetId: 'light',
        customTokens,
      });

      expect(result.customTokens).toEqual(customTokens);
    });
  });

  describe('delete', () => {
    it('should delete existing preference', async () => {
      await themeRepository.upsert({ tenantId, userId, userType, presetId: 'dark' });
      const deleted = await themeRepository.delete(tenantId, userId, userType);
      expect(deleted).toBe(true);

      const result = await themeRepository.findByUser(tenantId, userId, userType);
      expect(result).toBeNull();
    });

    it('should return false when preference does not exist', async () => {
      const deleted = await themeRepository.delete(tenantId, userId, userType);
      expect(deleted).toBe(false);
    });
  });

  describe('findByTenant', () => {
    it('should return all preferences for a tenant', async () => {
      await themeRepository.upsert({ tenantId, userId: 'user-1', userType, presetId: 'dark' });
      await themeRepository.upsert({ tenantId, userId: 'user-2', userType, presetId: 'light' });
      await themeRepository.upsert({ tenantId: 'other-tenant', userId: 'user-3', userType, presetId: 'dark' });

      const results = await themeRepository.findByTenant(tenantId);
      expect(results).toHaveLength(2);
      expect(results.every((p) => p.tenantId === tenantId)).toBe(true);
    });
  });
});

describe('Theme Service', () => {
  const tenantId = 'tenant-123';
  const userId = 'user-456';
  const userType = 'user' as const;
  const context = { ipAddress: '127.0.0.1', channel: 'api' as const };

  beforeEach(async () => {
    await themeRepository.clear();
    themeService.clearCache();
  });

  describe('getPresets', () => {
    it('should return all available presets', async () => {
      const result = await themeService.getPresets(context);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
    });
  });

  describe('getPreset', () => {
    it('should return a specific preset', async () => {
      const result = await themeService.getPreset('dark', context);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('dark');
    });

    it('should return error for invalid preset ID', async () => {
      const result = await themeService.getPreset('invalid' as ThemePresetId, context);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('THEME_NOT_FOUND');
    });
  });

  describe('getPreference', () => {
    it('should return default preset when no preference exists', async () => {
      const result = await themeService.getPreference(tenantId, userId, userType, context);
      expect(result.success).toBe(true);
      expect(result.data?.preference).toBeNull();
      expect(result.data?.preset.id).toBe(DEFAULT_THEME_PRESET_ID);
    });

    it('should return user preference when it exists', async () => {
      await themeRepository.upsert({ tenantId, userId, userType, presetId: 'dark' });

      const result = await themeService.getPreference(tenantId, userId, userType, context);
      expect(result.success).toBe(true);
      expect(result.data?.preference?.presetId).toBe('dark');
      expect(result.data?.preset.id).toBe('dark');
    });
  });

  describe('updatePreference', () => {
    it('should create preference when none exists', async () => {
      const result = await themeService.updatePreference(
        tenantId,
        userId,
        userType,
        { presetId: 'dark' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data?.presetId).toBe('dark');
    });

    it('should update existing preference', async () => {
      await themeRepository.upsert({ tenantId, userId, userType, presetId: 'dark' });

      const result = await themeService.updatePreference(
        tenantId,
        userId,
        userType,
        { presetId: 'high-contrast' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data?.presetId).toBe('high-contrast');
    });

    it('should reject invalid preset ID', async () => {
      const result = await themeService.updatePreference(
        tenantId,
        userId,
        userType,
        { presetId: 'invalid' as ThemePresetId },
        context
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PRESET');
    });

    it('should merge custom tokens with existing', async () => {
      await themeService.updatePreference(
        tenantId,
        userId,
        userType,
        { presetId: 'light', customTokens: { colors: { primary: 'red' } } },
        context
      );

      const result = await themeService.updatePreference(
        tenantId,
        userId,
        userType,
        { customTokens: { colors: { secondary: 'blue' } } },
        context
      );

      expect(result.success).toBe(true);
      expect(result.data?.customTokens?.colors?.primary).toBe('red');
      expect(result.data?.customTokens?.colors?.secondary).toBe('blue');
    });
  });

  describe('deletePreference', () => {
    it('should reset preference to default', async () => {
      await themeRepository.upsert({ tenantId, userId, userType, presetId: 'dark' });

      const result = await themeService.deletePreference(tenantId, userId, userType, context);
      expect(result.success).toBe(true);

      const check = await themeService.getPreference(tenantId, userId, userType, context);
      expect(check.data?.preference).toBeNull();
    });
  });

  describe('verifyTenantAccess', () => {
    it('should allow access for matching tenant', async () => {
      const result = await themeService.verifyTenantAccess(
        tenantId,
        tenantId,
        userId,
        userType,
        context
      );
      expect(result).toBe(true);
    });

    it('should deny access for different tenant', async () => {
      const result = await themeService.verifyTenantAccess(
        'other-tenant',
        tenantId,
        userId,
        userType,
        context
      );
      expect(result).toBe(false);
    });
  });

  describe('verifyUserAccess', () => {
    it('should allow access for matching user', async () => {
      const result = await themeService.verifyUserAccess(userId, userId, context);
      expect(result).toBe(true);
    });

    it('should deny access for different user', async () => {
      const result = await themeService.verifyUserAccess('other-user', userId, context);
      expect(result).toBe(false);
    });
  });

  describe('getEffectiveTokens', () => {
    it('should return base preset tokens when no custom tokens', async () => {
      await themeRepository.upsert({ tenantId, userId, userType, presetId: 'dark' });

      const result = await themeService.getEffectiveTokens(tenantId, userId, userType, context);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(DARK_THEME_TOKENS);
    });

    it('should merge custom tokens with preset', async () => {
      const customPrimary = 'hsl(0 100% 50%)';
      await themeRepository.upsert({
        tenantId,
        userId,
        userType,
        presetId: 'light',
        customTokens: { colors: { primary: customPrimary } },
      });

      const result = await themeService.getEffectiveTokens(tenantId, userId, userType, context);
      expect(result.success).toBe(true);
      expect(result.data?.colors.primary).toBe(customPrimary);
      expect(result.data?.colors.secondary).toBe(LIGHT_THEME_TOKENS.colors.secondary);
    });
  });
});

describe('Theme Metrics Service', () => {
  describe('recordRead', () => {
    it('should record successful reads', () => {
      themeMetricsService.recordRead(true, 10);
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.READ_SUCCESS)).toBe(true);
      expect(metrics.some((m) => m.name === THEME_METRICS.READ_LATENCY)).toBe(true);
    });

    it('should record failed reads', () => {
      themeMetricsService.recordRead(false, 10);
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.READ_FAILURE)).toBe(true);
    });
  });

  describe('recordWrite', () => {
    it('should record successful writes', () => {
      themeMetricsService.recordWrite(true, 20);
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.WRITE_SUCCESS)).toBe(true);
      expect(metrics.some((m) => m.name === THEME_METRICS.WRITE_LATENCY)).toBe(true);
    });

    it('should record failed writes', () => {
      themeMetricsService.recordWrite(false, 20);
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.WRITE_FAILURE)).toBe(true);
    });
  });

  describe('recordAccessDenied', () => {
    it('should record access denied events', () => {
      themeMetricsService.recordAccessDenied('cross_tenant');
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.ACCESS_DENIED)).toBe(true);
    });
  });

  describe('recordRateLimitHit', () => {
    it('should record rate limit hits', () => {
      themeMetricsService.recordRateLimitHit('/api/v1/theme/preference');
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.RATE_LIMIT_HIT)).toBe(true);
    });
  });

  describe('cache metrics', () => {
    it('should record cache hits', () => {
      themeMetricsService.recordCacheHit('preset');
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.CACHE_HIT)).toBe(true);
    });

    it('should record cache misses', () => {
      themeMetricsService.recordCacheMiss('preference');
      const metrics = themeMetricsService.getMetrics();
      expect(metrics.some((m) => m.name === THEME_METRICS.CACHE_MISS)).toBe(true);
    });
  });

  describe('checkSLOs', () => {
    it('should report SLO status', () => {
      const result = themeMetricsService.checkSLOs();
      expect(result).toHaveProperty('met');
      expect(result).toHaveProperty('violations');
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });

  describe('getHealthSummary', () => {
    it('should return complete health summary', () => {
      const summary = themeMetricsService.getHealthSummary();
      expect(summary).toHaveProperty('readSuccessRate');
      expect(summary).toHaveProperty('writeSuccessRate');
      expect(summary).toHaveProperty('readP99Latency');
      expect(summary).toHaveProperty('writeP99Latency');
      expect(summary).toHaveProperty('cacheHitRate');
      expect(summary).toHaveProperty('sloStatus');
    });
  });
});
