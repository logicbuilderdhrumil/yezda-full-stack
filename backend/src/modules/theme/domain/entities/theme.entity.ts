/**
 * Theme Domain Entities
 * Migrated from legacy theme.model.ts — preserves all presets and token types.
 */

export type ThemePresetId = 'light' | 'dark' | 'high-contrast';
export interface ColorTokens { primary: string; primaryForeground: string; secondary: string; secondaryForeground: string; background: string; foreground: string; muted: string; mutedForeground: string; accent: string; accentForeground: string; destructive: string; destructiveForeground: string; border: string; input: string; ring: string; card: string; cardForeground: string; popover: string; popoverForeground: string; }
export interface TypographyTokens { fontFamily: string; fontSizeBase: string; fontSizeSm: string; fontSizeLg: string; fontSizeXl: string; lineHeightBase: string; lineHeightTight: string; lineHeightRelaxed: string; }
export interface SpacingTokens { xs: string; sm: string; md: string; lg: string; xl: string; xxl: string; }
export interface RadiusTokens { sm: string; md: string; lg: string; full: string; }
export interface ThemeTokens { colors: ColorTokens; typography: TypographyTokens; spacing: SpacingTokens; radius: RadiusTokens; }
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };
export type CustomThemeTokens = DeepPartial<ThemeTokens>;
export interface ThemePreset { id: ThemePresetId; name: string; description: string; tokens: ThemeTokens; }
export interface ThemePreference { id: string; tenantId: string; userId: string; userType: 'user' | 'candidate'; presetId: ThemePresetId; customTokens?: CustomThemeTokens; createdAt: Date; updatedAt: Date; }
export interface ThemePreferenceUpdate { presetId?: ThemePresetId; customTokens?: CustomThemeTokens; }
export type ThemeEventType = 'THEME_PRESET_FETCHED' | 'THEME_PREFERENCE_READ' | 'THEME_PREFERENCE_UPDATED' | 'THEME_ACCESS_DENIED';
export interface RequestContext { userId: string; userType: 'user' | 'candidate'; tenantId: string; ipAddress?: string; channel?: 'web' | 'mobile' | 'api'; }
export type OperationResult<T> = { success: true; data: T } | { success: false; error: string; code: string };
export const DEFAULT_THEME_PRESET_ID: ThemePresetId = 'light';
