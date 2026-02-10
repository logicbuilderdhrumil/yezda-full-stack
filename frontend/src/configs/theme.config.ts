/**
 * Theme configuration and token schema.
 * Defines the structure for all theme tokens used across the application.
 */

/** Color token values. */
export interface ColorTokens {
  primary: string;
  primaryHover: string;
  cta: string;
  ctaHover: string;
  secondary: string;
  secondaryHover: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveHover: string;
  success: string;
  warning: string;
}

/** Typography token values. */
export interface TypographyTokens {
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSizeXxl: string;
  lineHeightNormal: string;
  lineHeightRelaxed: string;
  lineHeightTight: string;
}

/** Spacing token values. */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

/** Border radius token values. */
export interface RadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
}

/** Complete theme token schema. */
export interface ThemeTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
}

/** Partial theme token overrides for customization. */
export interface PartialThemeTokens {
  colors?: Partial<ColorTokens>;
  typography?: Partial<TypographyTokens>;
  spacing?: Partial<SpacingTokens>;
  radius?: Partial<RadiusTokens>;
}

/** Theme preset definition. */
export interface ThemePreset {
  name: string;
  displayName: string;
  tokens: ThemeTokens;
}

/** Default typography tokens shared across themes. */
export const defaultTypography: TypographyTokens = {
  fontFamily:
    "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  fontSizeBase: '1rem',
  fontSizeSm: '0.875rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  fontSizeXxl: '1.5rem',
  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.75',
  lineHeightTight: '1.25',
};

/** Default spacing tokens. */
export const defaultSpacing: SpacingTokens = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
  xxxl: '4rem',
};

/** Default radius tokens. */
export const defaultRadius: RadiusTokens = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
};
