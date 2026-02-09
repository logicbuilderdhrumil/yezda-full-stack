/**
 * UI Kit domain entity.
 */
export interface UITheme {
  id: string;
  name: string;
  description: string;
}

export interface UICategory {
  id: string;
  name: string;
  description: string;
  componentCount: number;
}

export interface UIComponentConfig {
  componentId: string;
  category: string;
  theme: string;
  config: Record<string, unknown>;
  version: string;
}

export interface ThemedVariant {
  componentId: string;
  theme: string;
  variant: string;
  styles: Record<string, unknown>;
}

export interface UIKitHealth {
  status: string;
  uptime: number;
  cacheHitRate: number;
  sloCompliance: Record<string, boolean>;
}
