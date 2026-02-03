/**
 * Theme System Models
 * Task 1.1: Define theme token and preset schemas
 */

/** Available theme preset identifiers */
export type ThemePresetId = 'light' | 'dark' | 'high-contrast';

/** Color token structure for theme tokens */
export interface ColorTokens {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
}

/** Typography tokens */
export interface TypographyTokens {
  fontFamily: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontSizeXl: string;
  lineHeightBase: string;
  lineHeightTight: string;
  lineHeightRelaxed: string;
}

/** Spacing tokens */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/** Border radius tokens */
export interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

/** Complete theme token set */
export interface ThemeTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
}

/** Deep partial type for custom token overrides */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Custom tokens for partial overrides */
export type CustomThemeTokens = DeepPartial<ThemeTokens>;

/** Theme preset with metadata */
export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

/** User theme preference stored in database */
export interface ThemePreference {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  presetId: ThemePresetId;
  customTokens?: CustomThemeTokens;
  createdAt: Date;
  updatedAt: Date;
}

/** Theme preference update request */
export interface ThemePreferenceUpdate {
  presetId?: ThemePresetId;
  customTokens?: CustomThemeTokens;
}

/** Theme operation result */
export interface ThemeOperationResult<T = unknown> {
  success: boolean;
  error?: string;
  errorCode?: string;
  data?: T;
}

/** Theme audit event types */
export type ThemeEventType =
  | 'THEME_PRESET_FETCHED'
  | 'THEME_PREFERENCE_READ'
  | 'THEME_PREFERENCE_UPDATED'
  | 'THEME_ACCESS_DENIED';

/** Rate limit configuration for theme operations */
export interface ThemeRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/** SLO targets for theme operations */
export const THEME_SLOS = {
  // Latency SLOs
  READ_LATENCY_P99_MS: 50,
  WRITE_LATENCY_P99_MS: 100,

  // Availability SLOs
  READ_SUCCESS_RATE: 99.9,
  WRITE_SUCCESS_RATE: 99.5,

  // Rate limits
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  DEFAULT_READ_RATE_LIMIT_MAX_REQUESTS: 120, // 120 reads per minute
  DEFAULT_WRITE_RATE_LIMIT_MAX_REQUESTS: 30, // 30 writes per minute

  // Cache TTL
  PRESET_CACHE_TTL_MS: 300000, // 5 minutes
  PREFERENCE_CACHE_TTL_MS: 60000, // 1 minute
} as const;

/** Default theme tokens for light theme */
export const LIGHT_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: 'hsl(222.2 47.4% 11.2%)',
    primaryForeground: 'hsl(210 40% 98%)',
    secondary: 'hsl(210 40% 96.1%)',
    secondaryForeground: 'hsl(222.2 47.4% 11.2%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    muted: 'hsl(210 40% 96.1%)',
    mutedForeground: 'hsl(215.4 16.3% 46.9%)',
    accent: 'hsl(210 40% 96.1%)',
    accentForeground: 'hsl(222.2 47.4% 11.2%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: 'hsl(222.2 84% 4.9%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(222.2 84% 4.9%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(222.2 84% 4.9%)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizeBase: '1rem',
    fontSizeSm: '0.875rem',
    fontSizeLg: '1.125rem',
    fontSizeXl: '1.25rem',
    lineHeightBase: '1.5',
    lineHeightTight: '1.25',
    lineHeightRelaxed: '1.75',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
};

/** Default theme tokens for dark theme */
export const DARK_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: 'hsl(210 40% 98%)',
    primaryForeground: 'hsl(222.2 47.4% 11.2%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    background: 'hsl(222.2 84% 4.9%)',
    foreground: 'hsl(210 40% 98%)',
    muted: 'hsl(217.2 32.6% 17.5%)',
    mutedForeground: 'hsl(215 20.2% 65.1%)',
    accent: 'hsl(217.2 32.6% 17.5%)',
    accentForeground: 'hsl(210 40% 98%)',
    destructive: 'hsl(0 62.8% 30.6%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(217.2 32.6% 17.5%)',
    input: 'hsl(217.2 32.6% 17.5%)',
    ring: 'hsl(212.7 26.8% 83.9%)',
    card: 'hsl(222.2 84% 4.9%)',
    cardForeground: 'hsl(210 40% 98%)',
    popover: 'hsl(222.2 84% 4.9%)',
    popoverForeground: 'hsl(210 40% 98%)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizeBase: '1rem',
    fontSizeSm: '0.875rem',
    fontSizeLg: '1.125rem',
    fontSizeXl: '1.25rem',
    lineHeightBase: '1.5',
    lineHeightTight: '1.25',
    lineHeightRelaxed: '1.75',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
};

/** Default theme tokens for high-contrast theme */
export const HIGH_CONTRAST_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: 'hsl(0 0% 0%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(0 0% 95%)',
    secondaryForeground: 'hsl(0 0% 0%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(0 0% 0%)',
    muted: 'hsl(0 0% 90%)',
    mutedForeground: 'hsl(0 0% 20%)',
    accent: 'hsl(210 100% 50%)',
    accentForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(0 100% 40%)',
    destructiveForeground: 'hsl(0 0% 100%)',
    border: 'hsl(0 0% 0%)',
    input: 'hsl(0 0% 0%)',
    ring: 'hsl(210 100% 50%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(0 0% 0%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(0 0% 0%)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizeBase: '1.125rem',
    fontSizeSm: '1rem',
    fontSizeLg: '1.25rem',
    fontSizeXl: '1.5rem',
    lineHeightBase: '1.6',
    lineHeightTight: '1.4',
    lineHeightRelaxed: '1.8',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
};

/** All available theme presets */
export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  light: {
    id: 'light',
    name: 'Light',
    description: 'Default light theme with accessible contrast.',
    tokens: LIGHT_THEME_TOKENS,
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme optimized for low-light environments.',
    tokens: DARK_THEME_TOKENS,
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'High contrast theme for improved accessibility.',
    tokens: HIGH_CONTRAST_THEME_TOKENS,
  },
};

/** Default theme preset ID */
export const DEFAULT_THEME_PRESET_ID: ThemePresetId = 'light';
