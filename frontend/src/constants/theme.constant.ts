/**
 * Theme constants and preset definitions.
 * Provides light and dark theme presets with complete token values.
 */

import type { ThemePreset, ColorTokens } from '@/configs/theme.config';
import {
  defaultTypography,
  defaultSpacing,
  defaultRadius,
} from '@/configs/theme.config';

/** Light theme color tokens. */
export const lightColors: ColorTokens = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  secondary: '#64748b',
  secondaryHover: '#475569',
  background: '#ffffff',
  foreground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  accent: '#f1f5f9',
  accentForeground: '#0f172a',
  destructive: '#dc2626',
  destructiveHover: '#b91c1c',
  success: '#16a34a',
  warning: '#ca8a04',
};

/** Dark theme color tokens. */
export const darkColors: ColorTokens = {
  primary: '#3b82f6',
  primaryHover: '#60a5fa',
  secondary: '#94a3b8',
  secondaryHover: '#cbd5e1',
  background: '#0f172a',
  foreground: '#f8fafc',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  border: '#334155',
  accent: '#1e293b',
  accentForeground: '#f8fafc',
  destructive: '#ef4444',
  destructiveHover: '#f87171',
  success: '#22c55e',
  warning: '#eab308',
};

/** Light theme preset. */
export const lightTheme: ThemePreset = {
  name: 'light',
  displayName: 'Light',
  tokens: {
    colors: lightColors,
    typography: defaultTypography,
    spacing: defaultSpacing,
    radius: defaultRadius,
  },
};

/** Dark theme preset. */
export const darkTheme: ThemePreset = {
  name: 'dark',
  displayName: 'Dark',
  tokens: {
    colors: darkColors,
    typography: defaultTypography,
    spacing: defaultSpacing,
    radius: defaultRadius,
  },
};

/** All available theme presets. */
export const themePresets: Record<'light' | 'dark', ThemePreset> = {
  light: lightTheme,
  dark: darkTheme,
};

/** Default theme name. */
export const DEFAULT_THEME = 'light' as const;
