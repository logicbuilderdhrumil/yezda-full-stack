/**
 * In-memory UI Kit repository.
 */
import type { IUIKitRepository, UIConfigQuery, ThemedVariantQuery } from '../../domain/ports/IUIKitRepository.js';
import type { UITheme, UICategory, UIComponentConfig, ThemedVariant, UIKitHealth } from '../../domain/entities/ui-kit.entity.js';

const DEFAULT_THEMES: UITheme[] = [
  { id: 'light', name: 'Light', description: 'Default light theme' },
  { id: 'dark', name: 'Dark', description: 'Default dark theme' },
];

const DEFAULT_CATEGORIES: UICategory[] = [
  { id: 'form', name: 'Form Controls', description: 'Input elements', componentCount: 5 },
  { id: 'layout', name: 'Layout', description: 'Layout components', componentCount: 3 },
  { id: 'data', name: 'Data Display', description: 'Data visualization', componentCount: 4 },
];

export class InMemoryUIKitRepository implements IUIKitRepository {
  private startTime = Date.now();

  async getThemes(): Promise<UITheme[]> {
    return DEFAULT_THEMES;
  }

  async getCategories(): Promise<UICategory[]> {
    return DEFAULT_CATEGORIES;
  }

  async getConfig(_query: UIConfigQuery): Promise<UIComponentConfig[]> {
    return [];
  }

  async getThemedVariants(_query: ThemedVariantQuery): Promise<ThemedVariant[]> {
    return [];
  }

  async getHealth(): Promise<UIKitHealth> {
    return {
      status: 'healthy',
      uptime: Date.now() - this.startTime,
      cacheHitRate: 0.85,
      sloCompliance: { latency: true, availability: true },
    };
  }
}
