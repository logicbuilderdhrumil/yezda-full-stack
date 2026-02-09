/**
 * PostgreSQL Theme Repository
 * Wraps the legacy theme.repository.ts with the IThemeRepository port.
 */
import { query } from '../../../../shared/infrastructure/database/index.js';
import type { IThemeRepository } from '../../domain/ports/IThemeRepository.js';
import type { ThemePreset, ThemePreference, ThemePreferenceUpdate, ThemePresetId } from '../../domain/entities/theme.entity.js';

// Import presets from legacy model (re-created inline to avoid cross-layer dependency)
const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  light: { id: 'light', name: 'Light', description: 'Default light theme.', tokens: { colors: { primary: 'hsl(222.2 47.4% 11.2%)', primaryForeground: 'hsl(210 40% 98%)', secondary: 'hsl(210 40% 96.1%)', secondaryForeground: 'hsl(222.2 47.4% 11.2%)', background: 'hsl(0 0% 100%)', foreground: 'hsl(222.2 84% 4.9%)', muted: 'hsl(210 40% 96.1%)', mutedForeground: 'hsl(215.4 16.3% 46.9%)', accent: 'hsl(210 40% 96.1%)', accentForeground: 'hsl(222.2 47.4% 11.2%)', destructive: 'hsl(0 84.2% 60.2%)', destructiveForeground: 'hsl(210 40% 98%)', border: 'hsl(214.3 31.8% 91.4%)', input: 'hsl(214.3 31.8% 91.4%)', ring: 'hsl(222.2 84% 4.9%)', card: 'hsl(0 0% 100%)', cardForeground: 'hsl(222.2 84% 4.9%)', popover: 'hsl(0 0% 100%)', popoverForeground: 'hsl(222.2 84% 4.9%)' }, typography: { fontFamily: 'Inter, system-ui, sans-serif', fontSizeBase: '1rem', fontSizeSm: '0.875rem', fontSizeLg: '1.125rem', fontSizeXl: '1.25rem', lineHeightBase: '1.5', lineHeightTight: '1.25', lineHeightRelaxed: '1.75' }, spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', xxl: '3rem' }, radius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' } } },
  dark: { id: 'dark', name: 'Dark', description: 'Dark theme.', tokens: { colors: { primary: 'hsl(210 40% 98%)', primaryForeground: 'hsl(222.2 47.4% 11.2%)', secondary: 'hsl(217.2 32.6% 17.5%)', secondaryForeground: 'hsl(210 40% 98%)', background: 'hsl(222.2 84% 4.9%)', foreground: 'hsl(210 40% 98%)', muted: 'hsl(217.2 32.6% 17.5%)', mutedForeground: 'hsl(215 20.2% 65.1%)', accent: 'hsl(217.2 32.6% 17.5%)', accentForeground: 'hsl(210 40% 98%)', destructive: 'hsl(0 62.8% 30.6%)', destructiveForeground: 'hsl(210 40% 98%)', border: 'hsl(217.2 32.6% 17.5%)', input: 'hsl(217.2 32.6% 17.5%)', ring: 'hsl(212.7 26.8% 83.9%)', card: 'hsl(222.2 84% 4.9%)', cardForeground: 'hsl(210 40% 98%)', popover: 'hsl(222.2 84% 4.9%)', popoverForeground: 'hsl(210 40% 98%)' }, typography: { fontFamily: 'Inter, system-ui, sans-serif', fontSizeBase: '1rem', fontSizeSm: '0.875rem', fontSizeLg: '1.125rem', fontSizeXl: '1.25rem', lineHeightBase: '1.5', lineHeightTight: '1.25', lineHeightRelaxed: '1.75' }, spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', xxl: '3rem' }, radius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' } } },
  'high-contrast': { id: 'high-contrast', name: 'High Contrast', description: 'High contrast for accessibility.', tokens: { colors: { primary: 'hsl(0 0% 0%)', primaryForeground: 'hsl(0 0% 100%)', secondary: 'hsl(0 0% 95%)', secondaryForeground: 'hsl(0 0% 0%)', background: 'hsl(0 0% 100%)', foreground: 'hsl(0 0% 0%)', muted: 'hsl(0 0% 90%)', mutedForeground: 'hsl(0 0% 20%)', accent: 'hsl(210 100% 50%)', accentForeground: 'hsl(0 0% 100%)', destructive: 'hsl(0 100% 40%)', destructiveForeground: 'hsl(0 0% 100%)', border: 'hsl(0 0% 0%)', input: 'hsl(0 0% 0%)', ring: 'hsl(210 100% 50%)', card: 'hsl(0 0% 100%)', cardForeground: 'hsl(0 0% 0%)', popover: 'hsl(0 0% 100%)', popoverForeground: 'hsl(0 0% 0%)' }, typography: { fontFamily: 'Inter, system-ui, sans-serif', fontSizeBase: '1.125rem', fontSizeSm: '1rem', fontSizeLg: '1.25rem', fontSizeXl: '1.5rem', lineHeightBase: '1.6', lineHeightTight: '1.4', lineHeightRelaxed: '1.8' }, spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', xxl: '3rem' }, radius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' } } },
};

export class PostgresThemeRepository implements IThemeRepository {
  async getPresets(): Promise<ThemePreset[]> {
    return Object.values(THEME_PRESETS);
  }

  async getPresetById(presetId: ThemePresetId): Promise<ThemePreset | null> {
    return THEME_PRESETS[presetId] ?? null;
  }

  async getPreference(tenantId: string, userId: string): Promise<ThemePreference | null> {
    const result = await query('SELECT * FROM theme_preferences WHERE tenant_id = $1 AND user_id = $2 LIMIT 1', [tenantId, userId]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return { id: row.id, tenantId: row.tenant_id, userId: row.user_id, userType: row.user_type, presetId: row.preset_id, customTokens: row.custom_tokens ?? undefined, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) };
  }

  async upsertPreference(tenantId: string, userId: string, userType: 'user' | 'candidate', update: ThemePreferenceUpdate): Promise<ThemePreference> {
    const result = await query(
      `INSERT INTO theme_preferences (tenant_id, user_id, user_type, preset_id, custom_tokens, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET preset_id = COALESCE($4, theme_preferences.preset_id), custom_tokens = COALESCE($5, theme_preferences.custom_tokens), updated_at = NOW()
       RETURNING *`,
      [tenantId, userId, userType, update.presetId ?? 'light', update.customTokens ? JSON.stringify(update.customTokens) : null],
    );
    const row = result.rows[0];
    return { id: row.id, tenantId: row.tenant_id, userId: row.user_id, userType: row.user_type, presetId: row.preset_id, customTokens: row.custom_tokens ?? undefined, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) };
  }
}
