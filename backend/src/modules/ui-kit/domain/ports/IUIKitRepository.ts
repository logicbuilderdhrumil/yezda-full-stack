/**
 * UI Kit repository port.
 */
import type { UITheme, UICategory, UIComponentConfig, ThemedVariant, UIKitHealth } from '../entities/ui-kit.entity.js';

export interface UIConfigQuery {
  theme?: string;
  category?: string;
}

export interface ThemedVariantQuery {
  theme?: string;
  componentId?: string;
}

export interface IUIKitRepository {
  getThemes(): Promise<UITheme[]>;
  getCategories(): Promise<UICategory[]>;
  getConfig(query: UIConfigQuery): Promise<UIComponentConfig[]>;
  getThemedVariants(query: ThemedVariantQuery): Promise<ThemedVariant[]>;
  getHealth(): Promise<UIKitHealth>;
}
