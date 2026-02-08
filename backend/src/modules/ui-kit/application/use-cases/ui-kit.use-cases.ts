/**
 * UI Kit use cases.
 */
import type { IUIKitRepository, UITheme, UICategory, UIComponentConfig, ThemedVariant, UIKitHealth, UIConfigQuery, ThemedVariantQuery } from '../../domain/index.js';

export class GetAvailableThemes {
  constructor(private repo: IUIKitRepository) {}
  async execute(): Promise<UITheme[]> {
    return this.repo.getThemes();
  }
}

export class GetAvailableCategories {
  constructor(private repo: IUIKitRepository) {}
  async execute(): Promise<UICategory[]> {
    return this.repo.getCategories();
  }
}

export class GetUIConfig {
  constructor(private repo: IUIKitRepository) {}
  async execute(query: UIConfigQuery): Promise<UIComponentConfig[]> {
    return this.repo.getConfig(query);
  }
}

export class GetThemedVariants {
  constructor(private repo: IUIKitRepository) {}
  async execute(query: ThemedVariantQuery): Promise<ThemedVariant[]> {
    return this.repo.getThemedVariants(query);
  }
}

export class GetUIKitHealth {
  constructor(private repo: IUIKitRepository) {}
  async execute(): Promise<UIKitHealth> {
    return this.repo.getHealth();
  }
}
