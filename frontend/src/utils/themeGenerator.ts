/**
 * Theme generator utilities for CSS variable injection and theme management.
 */

import type { ThemeTokens, ColorTokens, ThemePreset, PartialThemeTokens } from '@/configs/theme.config';
import { themePresets } from '@/constants/theme.constant';

/** CSS variable name mapping for color tokens. */
const COLOR_VAR_MAP: Record<keyof ColorTokens, string> = {
  primary: '--color-primary',
  primaryHover: '--color-primary-hover',
  cta: '--color-cta',
  ctaHover: '--color-cta-hover',
  secondary: '--color-secondary',
  secondaryHover: '--color-secondary-hover',
  background: '--color-background',
  foreground: '--color-foreground',
  muted: '--color-muted',
  mutedForeground: '--color-muted-foreground',
  border: '--color-border',
  accent: '--color-accent',
  accentForeground: '--color-accent-foreground',
  destructive: '--color-destructive',
  destructiveHover: '--color-destructive-hover',
  success: '--color-success',
  warning: '--color-warning',
};

/**
 * Generate CSS variable string from theme tokens.
 */
export function generateCSSVariables(tokens: ThemeTokens): string {
  const lines: string[] = [];

  // Color tokens
  for (const [key, varName] of Object.entries(COLOR_VAR_MAP)) {
    const value = tokens.colors[key as keyof ColorTokens];
    lines.push(`${varName}: ${value};`);
  }

  // Typography tokens
  lines.push(`--font-family: ${tokens.typography.fontFamily};`);
  lines.push(`--font-family-mono: ${tokens.typography.fontFamilyMono};`);
  lines.push(`--font-size-base: ${tokens.typography.fontSizeBase};`);
  lines.push(`--font-size-sm: ${tokens.typography.fontSizeSm};`);
  lines.push(`--font-size-lg: ${tokens.typography.fontSizeLg};`);
  lines.push(`--font-size-xl: ${tokens.typography.fontSizeXl};`);
  lines.push(`--font-size-xxl: ${tokens.typography.fontSizeXxl};`);
  lines.push(`--line-height-normal: ${tokens.typography.lineHeightNormal};`);
  lines.push(`--line-height-relaxed: ${tokens.typography.lineHeightRelaxed};`);
  lines.push(`--line-height-tight: ${tokens.typography.lineHeightTight};`);

  // Spacing tokens
  lines.push(`--spacing-xs: ${tokens.spacing.xs};`);
  lines.push(`--spacing-sm: ${tokens.spacing.sm};`);
  lines.push(`--spacing-md: ${tokens.spacing.md};`);
  lines.push(`--spacing-lg: ${tokens.spacing.lg};`);
  lines.push(`--spacing-xl: ${tokens.spacing.xl};`);
  lines.push(`--spacing-xxl: ${tokens.spacing.xxl};`);
  lines.push(`--spacing-xxxl: ${tokens.spacing.xxxl};`);

  // Radius tokens
  lines.push(`--radius-none: ${tokens.radius.none};`);
  lines.push(`--radius-sm: ${tokens.radius.sm};`);
  lines.push(`--radius-md: ${tokens.radius.md};`);
  lines.push(`--radius-lg: ${tokens.radius.lg};`);
  lines.push(`--radius-full: ${tokens.radius.full};`);

  return lines.join('\n  ');
}

/**
 * Apply theme tokens to the document root as CSS variables.
 */
export function applyThemeToDocument(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  const preset = themePresets[theme];
  const root = document.documentElement;

  // Set data-theme attribute for CSS targeting
  root.setAttribute('data-theme', theme);

  // Apply class for Tailwind dark mode support
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Apply CSS variables
  const { tokens } = preset;

  // Colors
  for (const [key, varName] of Object.entries(COLOR_VAR_MAP)) {
    const value = tokens.colors[key as keyof ColorTokens];
    root.style.setProperty(varName, value);
  }

  // Typography
  root.style.setProperty('--font-family', tokens.typography.fontFamily);
  root.style.setProperty('--font-family-mono', tokens.typography.fontFamilyMono);
  root.style.setProperty('--font-size-base', tokens.typography.fontSizeBase);
  root.style.setProperty('--font-size-sm', tokens.typography.fontSizeSm);
  root.style.setProperty('--font-size-lg', tokens.typography.fontSizeLg);
  root.style.setProperty('--font-size-xl', tokens.typography.fontSizeXl);
  root.style.setProperty('--font-size-xxl', tokens.typography.fontSizeXxl);
  root.style.setProperty('--line-height-normal', tokens.typography.lineHeightNormal);
  root.style.setProperty('--line-height-relaxed', tokens.typography.lineHeightRelaxed);
  root.style.setProperty('--line-height-tight', tokens.typography.lineHeightTight);

  // Spacing
  root.style.setProperty('--spacing-xs', tokens.spacing.xs);
  root.style.setProperty('--spacing-sm', tokens.spacing.sm);
  root.style.setProperty('--spacing-md', tokens.spacing.md);
  root.style.setProperty('--spacing-lg', tokens.spacing.lg);
  root.style.setProperty('--spacing-xl', tokens.spacing.xl);
  root.style.setProperty('--spacing-xxl', tokens.spacing.xxl);
  root.style.setProperty('--spacing-xxxl', tokens.spacing.xxxl);

  // Radius
  root.style.setProperty('--radius-none', tokens.radius.none);
  root.style.setProperty('--radius-sm', tokens.radius.sm);
  root.style.setProperty('--radius-md', tokens.radius.md);
  root.style.setProperty('--radius-lg', tokens.radius.lg);
  root.style.setProperty('--radius-full', tokens.radius.full);
}

/**
 * Get a theme preset by name.
 */
export function getThemePreset(name: 'light' | 'dark'): ThemePreset {
  return themePresets[name];
}

/**
 * Generate a custom theme by merging partial tokens with a base theme.
 */
export function generateCustomTheme(
  baseName: 'light' | 'dark',
  overrides: PartialThemeTokens
): ThemeTokens {
  const base = themePresets[baseName].tokens;

  return {
    colors: { ...base.colors, ...overrides.colors },
    typography: { ...base.typography, ...overrides.typography },
    spacing: { ...base.spacing, ...overrides.spacing },
    radius: { ...base.radius, ...overrides.radius },
  };
}

/**
 * Preview a theme temporarily without persisting.
 * Returns a cleanup function to restore the previous theme.
 */
export function previewTheme(theme: 'light' | 'dark'): () => void {
  const root = document.documentElement;
  const previousTheme = root.getAttribute('data-theme') as 'light' | 'dark' | null;

  applyThemeToDocument(theme);

  return () => {
    applyThemeToDocument(previousTheme ?? 'light');
  };
}
