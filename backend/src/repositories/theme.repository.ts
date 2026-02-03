/**
 * Theme Repository
 * Task 1.3: Persist and retrieve theme preferences
 */

import { v4 as uuidv4 } from 'uuid';
import type { ThemePreference, ThemePresetId, CustomThemeTokens } from '../models/theme.model.js';

// In-memory storage for preferences (use proper DB in production)
const preferences = new Map<string, ThemePreference>();

/**
 * Generate composite key for preference lookup
 */
function getPreferenceKey(tenantId: string, userId: string, userType: 'user' | 'candidate'): string {
  return `${tenantId}:${userId}:${userType}`;
}

export class ThemeRepository {
  /**
   * Find a theme preference by tenant, user, and type
   */
  async findByUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<ThemePreference | null> {
    const key = getPreferenceKey(tenantId, userId, userType);
    return preferences.get(key) || null;
  }

  /**
   * Create or update a theme preference
   */
  async upsert(params: {
    tenantId: string;
    userId: string;
    userType: 'user' | 'candidate';
    presetId: ThemePresetId;
    customTokens?: CustomThemeTokens;
  }): Promise<ThemePreference> {
    const key = getPreferenceKey(params.tenantId, params.userId, params.userType);
    const existing = preferences.get(key);
    const now = new Date();

    const preference: ThemePreference = {
      id: existing?.id || uuidv4(),
      tenantId: params.tenantId,
      userId: params.userId,
      userType: params.userType,
      presetId: params.presetId,
      customTokens: params.customTokens,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    preferences.set(key, preference);
    return preference;
  }

  /**
   * Delete a theme preference
   */
  async delete(tenantId: string, userId: string, userType: 'user' | 'candidate'): Promise<boolean> {
    const key = getPreferenceKey(tenantId, userId, userType);
    return preferences.delete(key);
  }

  /**
   * Get all preferences for a tenant (admin use)
   */
  async findByTenant(tenantId: string): Promise<ThemePreference[]> {
    const result: ThemePreference[] = [];
    for (const pref of preferences.values()) {
      if (pref.tenantId === tenantId) {
        result.push(pref);
      }
    }
    return result;
  }

  /**
   * Clear all preferences (test use only)
   */
  async clear(): Promise<void> {
    preferences.clear();
  }
}

export const themeRepository = new ThemeRepository();
