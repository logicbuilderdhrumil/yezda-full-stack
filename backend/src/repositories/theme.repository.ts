/**
 * Theme Repository
 * Task 1.3: Persist and retrieve theme preferences
 * Uses PostgreSQL for durable persistence
 */

import { randomUUID } from 'crypto';
import { query } from '../db/postgres.js';
import type { ThemePreference, ThemePresetId, CustomThemeTokens } from '../models/theme.model.js';

/** Database row type for theme_preferences table */
interface ThemePreferenceRow {
  id: string;
  tenant_id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  preset_id: ThemePresetId;
  custom_tokens: CustomThemeTokens | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Convert database row to ThemePreference model
 */
function rowToThemePreference(row: ThemePreferenceRow): ThemePreference {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userType: row.user_type,
    presetId: row.preset_id,
    customTokens: row.custom_tokens ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    const result = await query<ThemePreferenceRow>(
      `SELECT * FROM theme_preferences 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3`,
      [tenantId, userId, userType]
    );
    return result.rows[0] ? rowToThemePreference(result.rows[0]) : null;
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
    const id = randomUUID();
    const result = await query<ThemePreferenceRow>(
      `INSERT INTO theme_preferences (id, tenant_id, user_id, user_type, preset_id, custom_tokens, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (tenant_id, user_id, user_type)
       DO UPDATE SET 
         preset_id = EXCLUDED.preset_id,
         custom_tokens = EXCLUDED.custom_tokens,
         updated_at = NOW()
       RETURNING *`,
      [
        id,
        params.tenantId,
        params.userId,
        params.userType,
        params.presetId,
        params.customTokens ? JSON.stringify(params.customTokens) : null,
      ]
    );
    return rowToThemePreference(result.rows[0]);
  }

  /**
   * Delete a theme preference
   */
  async delete(tenantId: string, userId: string, userType: 'user' | 'candidate'): Promise<boolean> {
    const result = await query(
      `DELETE FROM theme_preferences 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3`,
      [tenantId, userId, userType]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get all preferences for a tenant (admin use)
   */
  async findByTenant(tenantId: string): Promise<ThemePreference[]> {
    const result = await query<ThemePreferenceRow>(
      `SELECT * FROM theme_preferences WHERE tenant_id = $1 ORDER BY user_id`,
      [tenantId]
    );
    return result.rows.map(rowToThemePreference);
  }

  /**
   * Clear all preferences (test use only - truncates table)
   */
  async clear(): Promise<void> {
    await query('TRUNCATE TABLE theme_preferences');
  }
}

export const themeRepository = new ThemeRepository();
