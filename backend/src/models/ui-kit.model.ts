/**
 * UI Kit Models
 * Task 1.1: Define UI component configuration schemas
 */

import { z } from 'zod';

/**
 * UI Kit theme preset identifiers
 */
export const UI_KIT_THEMES = ['light', 'dark', 'system', 'high-contrast'] as const;
export type UIKitTheme = (typeof UI_KIT_THEMES)[number];

/**
 * UI component categories
 */
export const COMPONENT_CATEGORIES = [
  'button',
  'input',
  'card',
  'modal',
  'toast',
  'alert',
  'badge',
  'avatar',
  'dropdown',
  'tabs',
  'table',
  'form',
  'layout',
  'navigation',
] as const;
export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

/**
 * Component size variants
 */
export const SIZE_VARIANTS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type SizeVariant = (typeof SIZE_VARIANTS)[number];

/**
 * Component color variants
 */
export const COLOR_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'warning',
  'error',
  'info',
  'neutral',
] as const;
export type ColorVariant = (typeof COLOR_VARIANTS)[number];

/**
 * Component variant configuration
 */
export interface ComponentVariant {
  name: string;
  description?: string;
  styles: Record<string, string>;
  tokens: Record<string, string>;
}

/**
 * Themed variant configuration
 */
export interface ThemedVariant {
  theme: UIKitTheme;
  variants: Record<string, ComponentVariant>;
}

/**
 * UI component configuration
 */
export interface UIComponentConfig {
  id: string;
  category: ComponentCategory;
  name: string;
  description?: string;
  defaultSize: SizeVariant;
  defaultColor: ColorVariant;
  sizes: Record<SizeVariant, ComponentVariant>;
  colors: Record<ColorVariant, ComponentVariant>;
  themedVariants: ThemedVariant[];
  metadata: Record<string, unknown>;
  version: string;
  updatedAt: Date;
}

/**
 * Collection of component configurations
 */
export interface UIComponentConfigBundle {
  tenantId: string;
  components: UIComponentConfig[];
  globalTokens: Record<UIKitTheme, Record<string, string>>;
  version: string;
  updatedAt: Date;
}

/**
 * UI configuration access record for audit
 */
export interface UIConfigAccessRecord {
  configId: string;
  category?: ComponentCategory;
  theme?: UIKitTheme;
  timestamp: Date;
  userId?: string;
  userType?: 'user' | 'candidate';
  tenantId: string;
}

/**
 * Response for UI configuration retrieval
 */
export interface UIConfigResponse {
  config: UIComponentConfigBundle;
  cachedAt?: Date;
}

/**
 * Response for themed variants retrieval
 */
export interface ThemedVariantsResponse {
  theme: UIKitTheme;
  components: Array<{
    id: string;
    category: ComponentCategory;
    name: string;
    variants: Record<string, ComponentVariant>;
  }>;
  globalTokens: Record<string, string>;
  cachedAt?: Date;
}

/**
 * Query parameters for configuration retrieval
 */
export interface GetUIConfigQuery {
  category?: ComponentCategory;
  theme?: UIKitTheme;
}

// Validation schemas
export const uiKitThemeSchema = z.enum(UI_KIT_THEMES);
export const componentCategorySchema = z.enum(COMPONENT_CATEGORIES);
export const sizeVariantSchema = z.enum(SIZE_VARIANTS);
export const colorVariantSchema = z.enum(COLOR_VARIANTS);

export const getUIConfigQuerySchema = z.object({
  category: componentCategorySchema.optional(),
  theme: uiKitThemeSchema.optional(),
});

export const getThemedVariantsQuerySchema = z.object({
  theme: uiKitThemeSchema,
  category: componentCategorySchema.optional(),
});

/**
 * Check if theme is valid
 */
export function isValidUIKitTheme(theme: string): theme is UIKitTheme {
  return UI_KIT_THEMES.includes(theme as UIKitTheme);
}

/**
 * Check if category is valid
 */
export function isValidCategory(category: string): category is ComponentCategory {
  return COMPONENT_CATEGORIES.includes(category as ComponentCategory);
}

/**
 * Default UI Kit theme
 */
export const DEFAULT_UI_KIT_THEME: UIKitTheme = 'light';
