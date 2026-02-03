/**
 * UI Kit Service
 * Task 1.2, 1.4, 1.5, 1.6, 1.7: Core UI configuration business logic
 * with tenant isolation, RBAC, audit logging, caching, and SLO monitoring
 */

import type {
  UIComponentConfig,
  UIComponentConfigBundle,
  UIConfigResponse,
  ThemedVariantsResponse,
  ThemePreset,
  ComponentCategory,
  ComponentVariant,
  ThemedVariant,
} from '../models/ui-kit.model.js';
import {
  THEME_PRESETS,
  COMPONENT_CATEGORIES,
} from '../models/ui-kit.model.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { cacheGet, cacheSet } from '../db/redis.js';

/**
 * UI configuration cache TTL (5 minutes)
 */
const UI_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * In-memory UI configuration store (replace with database in production)
 */
const configStore = new Map<string, UIComponentConfigBundle>();

/**
 * Generate default component configurations
 */
function generateDefaultComponents(): UIComponentConfig[] {
  const version = '1.0.0';
  const updatedAt = new Date();

  const createVariant = (name: string, tokens: Record<string, string>): ComponentVariant => ({
    name,
    styles: {},
    tokens,
  });

  const createThemedVariants = (): ThemedVariant[] =>
    THEME_PRESETS.map((theme) => ({
      theme,
      variants: {
        default: createVariant('default', { opacity: '1' }),
        hover: createVariant('hover', { opacity: '0.9' }),
        active: createVariant('active', { opacity: '0.8' }),
        disabled: createVariant('disabled', { opacity: '0.5' }),
      },
    }));

  const components: UIComponentConfig[] = [
    {
      id: 'btn-primary',
      category: 'button',
      name: 'Primary Button',
      description: 'Primary action button with configurable variants',
      defaultSize: 'md',
      defaultColor: 'primary',
      sizes: {
        xs: createVariant('xs', { padding: '4px 8px', fontSize: '12px' }),
        sm: createVariant('sm', { padding: '6px 12px', fontSize: '14px' }),
        md: createVariant('md', { padding: '8px 16px', fontSize: '16px' }),
        lg: createVariant('lg', { padding: '12px 24px', fontSize: '18px' }),
        xl: createVariant('xl', { padding: '16px 32px', fontSize: '20px' }),
      },
      colors: {
        primary: createVariant('primary', { background: '#3B82F6', color: '#FFFFFF' }),
        secondary: createVariant('secondary', { background: '#6B7280', color: '#FFFFFF' }),
        success: createVariant('success', { background: '#10B981', color: '#FFFFFF' }),
        warning: createVariant('warning', { background: '#F59E0B', color: '#000000' }),
        error: createVariant('error', { background: '#EF4444', color: '#FFFFFF' }),
        info: createVariant('info', { background: '#06B6D4', color: '#FFFFFF' }),
        neutral: createVariant('neutral', { background: '#E5E7EB', color: '#374151' }),
      },
      themedVariants: createThemedVariants(),
      metadata: { interactive: true },
      version,
      updatedAt,
    },
    {
      id: 'input-text',
      category: 'input',
      name: 'Text Input',
      description: 'Standard text input field',
      defaultSize: 'md',
      defaultColor: 'neutral',
      sizes: {
        xs: createVariant('xs', { padding: '4px 8px', fontSize: '12px' }),
        sm: createVariant('sm', { padding: '6px 10px', fontSize: '14px' }),
        md: createVariant('md', { padding: '8px 12px', fontSize: '16px' }),
        lg: createVariant('lg', { padding: '10px 14px', fontSize: '18px' }),
        xl: createVariant('xl', { padding: '12px 16px', fontSize: '20px' }),
      },
      colors: {
        primary: createVariant('primary', { borderColor: '#3B82F6' }),
        secondary: createVariant('secondary', { borderColor: '#6B7280' }),
        success: createVariant('success', { borderColor: '#10B981' }),
        warning: createVariant('warning', { borderColor: '#F59E0B' }),
        error: createVariant('error', { borderColor: '#EF4444' }),
        info: createVariant('info', { borderColor: '#06B6D4' }),
        neutral: createVariant('neutral', { borderColor: '#D1D5DB' }),
      },
      themedVariants: createThemedVariants(),
      metadata: { inputType: 'text' },
      version,
      updatedAt,
    },
    {
      id: 'card-container',
      category: 'card',
      name: 'Card Container',
      description: 'Container card with shadow and border radius',
      defaultSize: 'md',
      defaultColor: 'neutral',
      sizes: {
        xs: createVariant('xs', { padding: '8px', borderRadius: '4px' }),
        sm: createVariant('sm', { padding: '12px', borderRadius: '6px' }),
        md: createVariant('md', { padding: '16px', borderRadius: '8px' }),
        lg: createVariant('lg', { padding: '24px', borderRadius: '12px' }),
        xl: createVariant('xl', { padding: '32px', borderRadius: '16px' }),
      },
      colors: {
        primary: createVariant('primary', { background: '#EFF6FF', borderColor: '#3B82F6' }),
        secondary: createVariant('secondary', { background: '#F9FAFB', borderColor: '#6B7280' }),
        success: createVariant('success', { background: '#ECFDF5', borderColor: '#10B981' }),
        warning: createVariant('warning', { background: '#FFFBEB', borderColor: '#F59E0B' }),
        error: createVariant('error', { background: '#FEF2F2', borderColor: '#EF4444' }),
        info: createVariant('info', { background: '#ECFEFF', borderColor: '#06B6D4' }),
        neutral: createVariant('neutral', { background: '#FFFFFF', borderColor: '#E5E7EB' }),
      },
      themedVariants: createThemedVariants(),
      metadata: { elevated: true },
      version,
      updatedAt,
    },
  ];

  return components;
}

/**
 * Generate global design tokens per theme
 */
function generateGlobalTokens(): Record<ThemePreset, Record<string, string>> {
  return {
    light: {
      '--background': '#FFFFFF',
      '--foreground': '#0F172A',
      '--muted': '#F1F5F9',
      '--muted-foreground': '#64748B',
      '--border': '#E2E8F0',
      '--ring': '#3B82F6',
      '--radius': '8px',
    },
    dark: {
      '--background': '#0F172A',
      '--foreground': '#F8FAFC',
      '--muted': '#1E293B',
      '--muted-foreground': '#94A3B8',
      '--border': '#334155',
      '--ring': '#60A5FA',
      '--radius': '8px',
    },
    system: {
      '--background': 'var(--system-background)',
      '--foreground': 'var(--system-foreground)',
      '--muted': 'var(--system-muted)',
      '--muted-foreground': 'var(--system-muted-foreground)',
      '--border': 'var(--system-border)',
      '--ring': 'var(--system-ring)',
      '--radius': '8px',
    },
    'high-contrast': {
      '--background': '#000000',
      '--foreground': '#FFFFFF',
      '--muted': '#1A1A1A',
      '--muted-foreground': '#CCCCCC',
      '--border': '#FFFFFF',
      '--ring': '#FFFF00',
      '--radius': '4px',
    },
  };
}

/**
 * Initialize default configurations
 */
function initializeDefaultConfigurations(): void {
  const defaultBundle: UIComponentConfigBundle = {
    tenantId: 'default',
    components: generateDefaultComponents(),
    globalTokens: generateGlobalTokens(),
    version: '1.0.0',
    updatedAt: new Date(),
  };

  configStore.set('default', defaultBundle);
}

// Initialize on module load
initializeDefaultConfigurations();

export interface UIKitResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export class UIKitService {
  /**
   * Get UI component configuration
   * Task 1.2: Configuration retrieval
   * Task 1.4: Tenant scoping
   * Task 1.5: Audit logging
   * Task 1.6: Caching
   */
  async getUIConfig(
    tenantId: string,
    category?: ComponentCategory,
    theme?: ThemePreset,
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<UIKitResult<UIConfigResponse>> {
    const startTime = Date.now();
    const cacheKey = `ui-config:${tenantId}:${category ?? 'all'}:${theme ?? 'all'}`;

    // Task 1.6: Check cache first
    try {
      const cached = await cacheGet<UIConfigResponse>(cacheKey);
      if (cached) {
        metricsService.recordUIKitCacheHit();
        metricsService.recordUIKitRequest('config', true, Date.now() - startTime);

        // Task 1.5: Audit log (lightweight for cached responses)
        this.logConfigAccess({
          userId,
          userType,
          tenantId,
          category,
          theme,
          cached: true,
          ipAddress,
        });

        return { success: true, data: { ...cached, cachedAt: new Date() } };
      }
    } catch (error) {
      console.warn('[UIKitService] Cache error:', error);
    }

    metricsService.recordUIKitCacheMiss();

    // Task 1.4: Get tenant-scoped configuration
    let bundle = configStore.get(tenantId);
    if (!bundle) {
      // Fall back to default configuration
      bundle = configStore.get('default');
    }

    if (!bundle) {
      metricsService.recordUIKitRequest('config', false, Date.now() - startTime);
      return {
        success: false,
        error: 'UI configuration not found',
        errorCode: 'CONFIG_NOT_FOUND',
      };
    }

    // Filter by category if specified
    let components = bundle.components;
    if (category) {
      components = components.filter((c) => c.category === category);
    }

    // Filter global tokens by theme if specified
    let globalTokens = bundle.globalTokens;
    if (theme) {
      globalTokens = { [theme]: bundle.globalTokens[theme] } as Record<
        ThemePreset,
        Record<string, string>
      >;
    }

    const response: UIConfigResponse = {
      config: {
        ...bundle,
        components,
        globalTokens,
      },
    };

    // Task 1.6: Cache the response
    try {
      await cacheSet(cacheKey, response, UI_CONFIG_CACHE_TTL_MS);
    } catch (error) {
      console.warn('[UIKitService] Failed to cache UI config:', error);
    }

    // Task 1.5: Audit log
    this.logConfigAccess({
      userId,
      userType,
      tenantId,
      category,
      theme,
      cached: false,
      ipAddress,
    });

    metricsService.recordUIKitRequest('config', true, Date.now() - startTime);
    return { success: true, data: response };
  }

  /**
   * Get themed variants for UI components
   * Task 1.2: Themed variants retrieval
   */
  async getThemedVariants(
    tenantId: string,
    theme: ThemePreset,
    category?: ComponentCategory,
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<UIKitResult<ThemedVariantsResponse>> {
    const startTime = Date.now();
    const cacheKey = `ui-themed:${tenantId}:${theme}:${category ?? 'all'}`;

    // Task 1.6: Check cache first
    try {
      const cached = await cacheGet<ThemedVariantsResponse>(cacheKey);
      if (cached) {
        metricsService.recordUIKitCacheHit();
        metricsService.recordUIKitRequest('themed', true, Date.now() - startTime);

        this.logConfigAccess({
          userId,
          userType,
          tenantId,
          category,
          theme,
          cached: true,
          ipAddress,
        });

        return { success: true, data: { ...cached, cachedAt: new Date() } };
      }
    } catch (error) {
      console.warn('[UIKitService] Cache error:', error);
    }

    metricsService.recordUIKitCacheMiss();

    // Get tenant configuration
    let bundle = configStore.get(tenantId);
    if (!bundle) {
      bundle = configStore.get('default');
    }

    if (!bundle) {
      metricsService.recordUIKitRequest('themed', false, Date.now() - startTime);
      return {
        success: false,
        error: 'UI configuration not found',
        errorCode: 'CONFIG_NOT_FOUND',
      };
    }

    // Filter components by category if specified
    let components = bundle.components;
    if (category) {
      components = components.filter((c) => c.category === category);
    }

    // Extract themed variants for each component
    const themedComponents = components.map((component) => {
      const themedVariant = component.themedVariants.find((tv) => tv.theme === theme);
      return {
        id: component.id,
        category: component.category,
        name: component.name,
        variants: themedVariant?.variants ?? {},
      };
    });

    const response: ThemedVariantsResponse = {
      theme,
      components: themedComponents,
      globalTokens: bundle.globalTokens[theme] ?? {},
    };

    // Task 1.6: Cache the response
    try {
      await cacheSet(cacheKey, response, UI_CONFIG_CACHE_TTL_MS);
    } catch (error) {
      console.warn('[UIKitService] Failed to cache themed variants:', error);
    }

    // Task 1.5: Audit log
    this.logConfigAccess({
      userId,
      userType,
      tenantId,
      category,
      theme,
      cached: false,
      ipAddress,
    });

    metricsService.recordUIKitRequest('themed', true, Date.now() - startTime);
    return { success: true, data: response };
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): ThemePreset[] {
    return [...THEME_PRESETS];
  }

  /**
   * Get available component categories
   */
  getAvailableCategories(): ComponentCategory[] {
    return [...COMPONENT_CATEGORIES];
  }

  /**
   * Check SLO compliance
   * Task 1.7: SLO monitoring
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    return metricsService.checkUIKitSLOs();
  }

  /**
   * Log configuration access for audit
   * Task 1.5: Audit logging
   */
  private logConfigAccess(params: {
    userId?: string;
    userType?: 'user' | 'candidate';
    tenantId: string;
    category?: ComponentCategory;
    theme?: ThemePreset;
    cached: boolean;
    ipAddress?: string;
  }): void {
    if (params.userId) {
      auditService.logUIConfigAccess({
        userId: params.userId,
        userType: params.userType ?? 'user',
        tenantId: params.tenantId,
        category: params.category,
        theme: params.theme,
        cached: params.cached,
        channel: 'api',
        ipAddress: params.ipAddress,
      });
    }
  }
}

export const uiKitService = new UIKitService();
