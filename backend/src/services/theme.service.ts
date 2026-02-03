/**
 * Theme Service
 * Task 1.2: Implement theme preset retrieval and update endpoints
 * Task 1.4: Enforce tenant scoping and RBAC for theme endpoints
 * Task 1.5: Add audit logging for theme preference changes
 * Task 1.6: Add caching for theme endpoints
 * Task 1.7: Add metrics for SLO monitoring
 */

import { themeRepository } from '../repositories/theme.repository.js';
import { auditService } from './audit.service.js';
import { themeMetricsService } from './theme-metrics.service.js';
import {
  THEME_PRESETS,
  THEME_SLOS,
  DEFAULT_THEME_PRESET_ID,
  type ThemePresetId,
  type ThemePreset,
  type ThemePreference,
  type ThemePreferenceUpdate,
  type ThemeOperationResult,
  type ThemeTokens,
  type ThemeEventType,
  type CustomThemeTokens,
} from '../models/theme.model.js';

/** In-memory cache for preferences */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const preferenceCache = new Map<string, CacheEntry<ThemePreference | null>>();

/**
 * Get cache key for preference
 */
function getPreferenceCacheKey(tenantId: string, userId: string, userType: 'user' | 'candidate'): string {
  return `pref:${tenantId}:${userId}:${userType}`;
}

/**
 * Invalidate preference cache entry
 */
function invalidatePreferenceCache(tenantId: string, userId: string, userType: 'user' | 'candidate'): void {
  const key = getPreferenceCacheKey(tenantId, userId, userType);
  preferenceCache.delete(key);
}

export class ThemeService {
  /**
   * Get all available theme presets
   */
  async getPresets(
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<ThemeOperationResult<ThemePreset[]>> {
    const start = Date.now();

    try {
      const presets = Object.values(THEME_PRESETS);

      // Log access (using metadata for theme events)
      this.logThemeAccess('THEME_PRESET_FETCHED', {
        success: true,
        metadata: { count: presets.length },
        ...requestContext,
      });

      themeMetricsService.recordRead(true, Date.now() - start, { operation: 'getPresets' });
      themeMetricsService.recordCacheHit('preset'); // Presets are always "cached" (static)

      return { success: true, data: presets };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logThemeAccess('THEME_PRESET_FETCHED', {
        success: false,
        errorMessage,
        ...requestContext,
      });

      themeMetricsService.recordRead(false, Date.now() - start, { operation: 'getPresets' });

      return { success: false, error: 'Failed to fetch presets', errorCode: 'THEME_READ_ERROR' };
    }
  }

  /**
   * Get a specific theme preset by ID
   */
  async getPreset(
    presetId: ThemePresetId,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<ThemeOperationResult<ThemePreset>> {
    const start = Date.now();

    try {
      const preset = THEME_PRESETS[presetId];
      if (!preset) {
        themeMetricsService.recordRead(false, Date.now() - start, { operation: 'getPreset' });
        return { success: false, error: 'Preset not found', errorCode: 'THEME_NOT_FOUND' };
      }

      this.logThemeAccess('THEME_PRESET_FETCHED', {
        success: true,
        metadata: { presetId },
        ...requestContext,
      });

      themeMetricsService.recordRead(true, Date.now() - start, { operation: 'getPreset' });
      themeMetricsService.recordCacheHit('preset');

      return { success: true, data: preset };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logThemeAccess('THEME_PRESET_FETCHED', {
        success: false,
        errorMessage,
        metadata: { presetId },
        ...requestContext,
      });

      themeMetricsService.recordRead(false, Date.now() - start, { operation: 'getPreset' });

      return { success: false, error: 'Failed to fetch preset', errorCode: 'THEME_READ_ERROR' };
    }
  }

  /**
   * Get user's theme preference
   */
  async getPreference(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<ThemeOperationResult<{ preference: ThemePreference | null; preset: ThemePreset }>> {
    const start = Date.now();
    const cacheKey = getPreferenceCacheKey(tenantId, userId, userType);

    try {
      // Check cache first
      const cached = preferenceCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        themeMetricsService.recordCacheHit('preference');
        const presetId = cached.data?.presetId || DEFAULT_THEME_PRESET_ID;
        const preset = THEME_PRESETS[presetId];

        this.logThemeAccess('THEME_PREFERENCE_READ', {
          tenantId,
          userId,
          userType,
          success: true,
          metadata: { cached: true, presetId },
          ...requestContext,
        });

        themeMetricsService.recordRead(true, Date.now() - start, { operation: 'getPreference' });

        return { success: true, data: { preference: cached.data, preset } };
      }

      themeMetricsService.recordCacheMiss('preference');

      // Fetch from repository
      const preference = await themeRepository.findByUser(tenantId, userId, userType);
      const presetId = preference?.presetId || DEFAULT_THEME_PRESET_ID;
      const preset = THEME_PRESETS[presetId];

      // Update cache
      preferenceCache.set(cacheKey, {
        data: preference,
        expiresAt: Date.now() + THEME_SLOS.PREFERENCE_CACHE_TTL_MS,
      });

      this.logThemeAccess('THEME_PREFERENCE_READ', {
        tenantId,
        userId,
        userType,
        success: true,
        metadata: { cached: false, presetId },
        ...requestContext,
      });

      themeMetricsService.recordRead(true, Date.now() - start, { operation: 'getPreference' });

      return { success: true, data: { preference, preset } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logThemeAccess('THEME_PREFERENCE_READ', {
        tenantId,
        userId,
        userType,
        success: false,
        errorMessage,
        ...requestContext,
      });

      themeMetricsService.recordRead(false, Date.now() - start, { operation: 'getPreference' });

      return { success: false, error: 'Failed to read preference', errorCode: 'THEME_READ_ERROR' };
    }
  }

  /**
   * Update user's theme preference
   */
  async updatePreference(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    update: ThemePreferenceUpdate,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<ThemeOperationResult<ThemePreference>> {
    const start = Date.now();

    try {
      // Validate preset ID if provided
      if (update.presetId && !THEME_PRESETS[update.presetId]) {
        themeMetricsService.recordWrite(false, Date.now() - start, { operation: 'updatePreference' });
        return { success: false, error: 'Invalid preset ID', errorCode: 'INVALID_PRESET' };
      }

      // Get existing preference to merge
      const existing = await themeRepository.findByUser(tenantId, userId, userType);
      const presetId = update.presetId || existing?.presetId || DEFAULT_THEME_PRESET_ID;

      // Deep merge custom tokens if provided
      let customTokens: CustomThemeTokens | undefined;
      if (update.customTokens || existing?.customTokens) {
        customTokens = {
          colors: {
            ...existing?.customTokens?.colors,
            ...update.customTokens?.colors,
          },
          typography: {
            ...existing?.customTokens?.typography,
            ...update.customTokens?.typography,
          },
          spacing: {
            ...existing?.customTokens?.spacing,
            ...update.customTokens?.spacing,
          },
          radius: {
            ...existing?.customTokens?.radius,
            ...update.customTokens?.radius,
          },
        };
      }

      // Persist update
      const preference = await themeRepository.upsert({
        tenantId,
        userId,
        userType,
        presetId,
        customTokens,
      });

      // Invalidate cache
      invalidatePreferenceCache(tenantId, userId, userType);

      this.logThemeAccess('THEME_PREFERENCE_UPDATED', {
        tenantId,
        userId,
        userType,
        success: true,
        metadata: {
          previousPresetId: existing?.presetId,
          newPresetId: presetId,
          hasCustomTokens: !!customTokens,
        },
        ...requestContext,
      });

      themeMetricsService.recordWrite(true, Date.now() - start, { operation: 'updatePreference' });

      return { success: true, data: preference };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logThemeAccess('THEME_PREFERENCE_UPDATED', {
        tenantId,
        userId,
        userType,
        success: false,
        errorMessage,
        ...requestContext,
      });

      themeMetricsService.recordWrite(false, Date.now() - start, { operation: 'updatePreference' });

      return { success: false, error: 'Failed to update preference', errorCode: 'THEME_WRITE_ERROR' };
    }
  }

  /**
   * Delete user's theme preference (reset to default)
   */
  async deletePreference(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<ThemeOperationResult<void>> {
    const start = Date.now();

    try {
      const deleted = await themeRepository.delete(tenantId, userId, userType);

      // Invalidate cache
      invalidatePreferenceCache(tenantId, userId, userType);

      this.logThemeAccess('THEME_PREFERENCE_UPDATED', {
        tenantId,
        userId,
        userType,
        success: true,
        metadata: { action: 'reset', deleted },
        ...requestContext,
      });

      themeMetricsService.recordWrite(true, Date.now() - start, { operation: 'deletePreference' });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logThemeAccess('THEME_PREFERENCE_UPDATED', {
        tenantId,
        userId,
        userType,
        success: false,
        errorMessage,
        ...requestContext,
      });

      themeMetricsService.recordWrite(false, Date.now() - start, { operation: 'deletePreference' });

      return { success: false, error: 'Failed to reset preference', errorCode: 'THEME_WRITE_ERROR' };
    }
  }

  /**
   * Verify tenant access and log denied access
   * Task 1.4: Tenant isolation enforcement
   */
  async verifyTenantAccess(
    requestTenantId: string,
    targetTenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<boolean> {
    if (requestTenantId !== targetTenantId) {
      this.logThemeAccess('THEME_ACCESS_DENIED', {
        tenantId: targetTenantId,
        userId,
        userType,
        success: false,
        errorMessage: `Tenant ${requestTenantId} attempted to access tenant ${targetTenantId}`,
        ...requestContext,
      });

      themeMetricsService.recordAccessDenied('cross_tenant');
      return false;
    }
    return true;
  }

  /**
   * Verify user can only update their own preference
   * Task 1.4: User isolation enforcement
   */
  async verifyUserAccess(
    requestUserId: string,
    targetUserId: string,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<boolean> {
    if (requestUserId !== targetUserId) {
      this.logThemeAccess('THEME_ACCESS_DENIED', {
        userId: targetUserId,
        userType: 'user',
        success: false,
        errorMessage: `User ${requestUserId} attempted to access user ${targetUserId} preference`,
        ...requestContext,
      });

      themeMetricsService.recordAccessDenied('cross_user');
      return false;
    }
    return true;
  }

  /**
   * Log theme access for audit trail
   * Task 1.5: Audit logging
   */
  private logThemeAccess(
    eventType: ThemeEventType,
    params: {
      tenantId?: string;
      userId?: string;
      userType?: 'user' | 'candidate';
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      channel: 'web' | 'mobile' | 'api';
    }
  ): void {
    // Use SHELL_PREFERENCE_UPDATED for theme changes (compatible with existing audit types)
    auditService.log({
      eventType: params.success ? 'SHELL_PREFERENCE_UPDATED' : 'AUTH_ANOMALY_DETECTED',
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      metadata: {
        themeEventType: eventType,
        tenantId: params.tenantId,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }

  /**
   * Get theme tokens for a user (preset + custom overrides)
   */
  async getEffectiveTokens(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<ThemeOperationResult<ThemeTokens>> {
    const prefResult = await this.getPreference(tenantId, userId, userType, requestContext);

    if (!prefResult.success || !prefResult.data) {
      return { success: false, error: 'Failed to get preference', errorCode: 'THEME_READ_ERROR' };
    }

    const { preference, preset } = prefResult.data;
    const baseTokens = preset.tokens;

    // Merge custom tokens if present
    if (preference?.customTokens) {
      const merged: ThemeTokens = {
        colors: { ...baseTokens.colors, ...preference.customTokens.colors },
        typography: { ...baseTokens.typography, ...preference.customTokens.typography },
        spacing: { ...baseTokens.spacing, ...preference.customTokens.spacing },
        radius: { ...baseTokens.radius, ...preference.customTokens.radius },
      };
      return { success: true, data: merged };
    }

    return { success: true, data: baseTokens };
  }

  /**
   * Get health summary for monitoring
   */
  getHealthSummary() {
    return themeMetricsService.getHealthSummary();
  }

  /**
   * Clear preference cache (for testing)
   */
  clearCache(): void {
    preferenceCache.clear();
  }
}

export const themeService = new ThemeService();
