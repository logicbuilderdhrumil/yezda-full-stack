/**
 * Locale Preference Repository
 * Task 1.1, 1.5: Locale preference storage with tenant isolation
 */

import { v4 as uuidv4 } from 'uuid';
import type { LocalePreference } from '../models/localization.model.js';
import { DEFAULT_LOCALE } from '../models/localization.model.js';

// In-memory store (replace with database in production)
const localePreferences = new Map<string, LocalePreference>();

/**
 * Generate composite key for user+tenant isolation
 */
function getKey(userId: string, userType: 'user' | 'candidate', tenantId: string): string {
  return `${tenantId}:${userType}:${userId}`;
}

export class LocalePreferenceRepository {
  /**
   * Find locale preference by user and tenant
   */
  async findByUser(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string
  ): Promise<LocalePreference | null> {
    const key = getKey(userId, userType, tenantId);
    return localePreferences.get(key) ?? null;
  }

  /**
   * Create or update locale preference
   * Enforces tenant isolation - cannot update preferences for different tenant
   */
  async upsert(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string,
    updates: Partial<Pick<LocalePreference, 'locale' | 'timezone' | 'dateFormat' | 'numberFormat'>>
  ): Promise<LocalePreference> {
    const key = getKey(userId, userType, tenantId);
    const existing = localePreferences.get(key);
    const now = new Date();

    if (existing) {
      // Verify tenant isolation
      if (existing.tenantId !== tenantId) {
        throw new Error('Tenant isolation violation');
      }

      const updated: LocalePreference = {
        ...existing,
        ...updates,
        updatedAt: now,
      };
      localePreferences.set(key, updated);
      return updated;
    }

    // Create new preference
    const preference: LocalePreference = {
      id: uuidv4(),
      userId,
      userType,
      tenantId,
      locale: updates.locale ?? DEFAULT_LOCALE,
      timezone: updates.timezone,
      dateFormat: updates.dateFormat,
      numberFormat: updates.numberFormat,
      createdAt: now,
      updatedAt: now,
    };
    localePreferences.set(key, preference);
    return preference;
  }

  /**
   * Delete locale preference
   */
  async delete(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string
  ): Promise<boolean> {
    const key = getKey(userId, userType, tenantId);
    return localePreferences.delete(key);
  }

  /**
   * Find all preferences for a tenant (admin use)
   */
  async findByTenant(tenantId: string): Promise<LocalePreference[]> {
    const results: LocalePreference[] = [];
    for (const pref of localePreferences.values()) {
      if (pref.tenantId === tenantId) {
        results.push(pref);
      }
    }
    return results;
  }

  /**
   * Clear all preferences (for testing)
   */
  async clearAll(): Promise<void> {
    localePreferences.clear();
  }
}

export const localePreferenceRepository = new LocalePreferenceRepository();
