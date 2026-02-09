import type { ThemePreset, ThemePreference, ThemePreferenceUpdate, ThemePresetId } from '../entities/theme.entity.js';

export interface IThemeRepository {
  getPresets(): Promise<ThemePreset[]>;
  getPresetById(presetId: ThemePresetId): Promise<ThemePreset | null>;
  getPreference(tenantId: string, userId: string): Promise<ThemePreference | null>;
  upsertPreference(tenantId: string, userId: string, userType: 'user' | 'candidate', update: ThemePreferenceUpdate): Promise<ThemePreference>;
}
