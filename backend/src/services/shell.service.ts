/**
 * Shell Configuration Service
 * Task 1.2, 1.3, 1.5, 1.6: Shell configuration, navigation, preferences, and audit
 */

import type {
  ShellConfig,
  ShellLayout,
  ShellFeatures,
  ShellBranding,
  NavigationConfig,
  NavItem,
  RoutePoliciesConfig,
  RoutePolicy,
  PreferenceDefaults,
  ThemeMode,
  LocaleConfig,
  UserPreference,
  PreferenceUpdateRequest,
} from '../models/shell.model.js';
import { auditService } from './audit.service.js';
import { cacheGet, cacheSet } from '../db/redis.js';

// Cache TTL constants
const SHELL_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PREFERENCES_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Cache key prefixes
const CACHE_PREFIX = {
  SHELL_CONFIG: 'shell:config',
  NAVIGATION: 'shell:nav',
  ROUTE_POLICIES: 'shell:policies',
  PREFERENCES: 'shell:prefs',
};

/**
 * Default shell layout configuration
 */
const DEFAULT_LAYOUT: ShellLayout = {
  header: {
    visible: true,
    showSearch: true,
    showNotifications: true,
  },
  sidebar: {
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
    position: 'left',
  },
  content: {
    maxWidth: '1280px',
    padding: '24px',
  },
};

/**
 * Default shell features
 */
const DEFAULT_FEATURES: ShellFeatures = {
  mfaEnabled: true,
  notificationsEnabled: true,
  themeToggle: true,
  languageSwitch: true,
};

/**
 * Default branding
 */
const DEFAULT_BRANDING: ShellBranding = {
  appName: 'Yezda',
  primaryColor: '#3b82f6',
};

/**
 * Available locales
 */
const AVAILABLE_LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'es', name: 'Español', direction: 'ltr' },
  { code: 'fr', name: 'Français', direction: 'ltr' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
];

/**
 * Default navigation items with role-based access
 */
const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    path: '/dashboard',
    authorities: [],
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: 'users',
    path: '/candidates',
    authorities: ['candidate:read'],
    children: [
      {
        id: 'candidates-list',
        label: 'All Candidates',
        path: '/candidates',
        authorities: ['candidate:read'],
      },
      {
        id: 'candidates-add',
        label: 'Add Candidate',
        path: '/candidates/new',
        authorities: ['candidate:write'],
      },
    ],
  },
  {
    id: 'screenings',
    label: 'Screenings',
    icon: 'clipboard',
    path: '/screenings',
    authorities: ['screening:read'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'chart',
    path: '/reports',
    authorities: ['report:read'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    authorities: ['settings:read'],
    children: [
      {
        id: 'settings-account',
        label: 'Account',
        path: '/settings/account',
        authorities: [],
      },
      {
        id: 'settings-organization',
        label: 'Organization',
        path: '/settings/organization',
        authorities: ['org:admin'],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'shield',
    path: '/admin',
    authorities: ['admin'],
    children: [
      {
        id: 'admin-users',
        label: 'Users',
        path: '/admin/users',
        authorities: ['admin'],
      },
      {
        id: 'admin-audit',
        label: 'Audit Log',
        path: '/admin/audit',
        authorities: ['admin'],
      },
    ],
  },
];

/**
 * Route policies for public and protected routes
 */
const ROUTE_POLICIES: RoutePolicy[] = [
  { route: '/health', public: true },
  { route: '/api/v1/auth/signin', public: true, methods: ['POST'] },
  { route: '/api/v1/auth/signup', public: true, methods: ['POST'] },
  { route: '/api/v1/auth/refresh', public: true, methods: ['POST'] },
  { route: '/api/v1/auth/password/*', public: true, methods: ['POST'] },
  { route: '/api/v1/shell/config', public: true, methods: ['GET'] },
  { route: '/api/v1/shell/policies', public: true, methods: ['GET'] },
  { route: '/api/v1/shell/preferences/defaults', public: true, methods: ['GET'] },
  { route: '/api/v1/shell/navigation', public: false, authorities: [] },
  { route: '/api/v1/shell/preferences', public: false, authorities: [] },
  { route: '/api/v1/candidates', public: false, authorities: ['candidate:read'] },
  { route: '/api/v1/screenings', public: false, authorities: ['screening:read'] },
  { route: '/api/v1/reports', public: false, authorities: ['report:read'] },
  { route: '/api/v1/admin/*', public: false, authorities: ['admin'] },
];

// In-memory preference storage (would be replaced by database repository in production)
const userPreferences = new Map<string, UserPreference>();

export class ShellService {
  /**
   * Get shell configuration
   * Task 1.2: Shell layout, features, and branding
   */
  async getShellConfig(tenantId?: string): Promise<ShellConfig> {
    const cacheKey = `${CACHE_PREFIX.SHELL_CONFIG}:${tenantId ?? 'default'}`;

    // Check cache first
    try {
      const cached = await cacheGet<ShellConfig>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Cache miss or error, continue to generate
    }

    const config: ShellConfig = {
      version: '1.0.0',
      layout: { ...DEFAULT_LAYOUT },
      features: { ...DEFAULT_FEATURES },
      branding: { ...DEFAULT_BRANDING },
    };

    // Cache the result
    try {
      await cacheSet(cacheKey, config, SHELL_CONFIG_CACHE_TTL_MS);
    } catch {
      // Cache set error, continue without caching
    }

    return config;
  }

  /**
   * Get navigation items filtered by user authority
   * Task 1.2: Role-based navigation
   */
  async getNavigation(
    userAuthorities: string[],
    userId?: string,
    userType?: 'user' | 'candidate',
    tenantId?: string
  ): Promise<NavigationConfig> {
    // Filter navigation items by authority
    const filteredItems = this.filterNavItemsByAuthority(NAVIGATION_ITEMS, userAuthorities);

    // Log access for audit
    if (userId && userType) {
      auditService.log({
        eventType: 'SHELL_CONFIG_ACCESSED',
        actorId: userId,
        actorType: userType,
        channel: 'api',
        metadata: {
          resource: 'navigation',
          tenantId,
          itemCount: filteredItems.length,
        },
        success: true,
      });
    }

    return {
      items: filteredItems,
      defaultPath: '/dashboard',
    };
  }

  /**
   * Filter navigation items recursively by user authorities
   */
  private filterNavItemsByAuthority(items: NavItem[], userAuthorities: string[]): NavItem[] {
    return items
      .filter((item) => {
        // If no authorities required, allow access
        if (!item.authorities || item.authorities.length === 0) {
          return true;
        }
        // Check if user has at least one required authority
        return item.authorities.some((auth) => userAuthorities.includes(auth));
      })
      .map((item) => ({
        ...item,
        children: item.children
          ? this.filterNavItemsByAuthority(item.children, userAuthorities)
          : undefined,
      }))
      .filter((item) => !item.hidden);
  }

  /**
   * Get route policies for access control
   * Task 1.2: Route policy metadata
   */
  async getRoutePolicies(): Promise<RoutePoliciesConfig> {
    const cacheKey = CACHE_PREFIX.ROUTE_POLICIES;

    try {
      const cached = await cacheGet<RoutePoliciesConfig>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Cache miss
    }

    const config: RoutePoliciesConfig = {
      version: '1.0.0',
      policies: [...ROUTE_POLICIES],
    };

    try {
      await cacheSet(cacheKey, config, SHELL_CONFIG_CACHE_TTL_MS);
    } catch {
      // Cache error
    }

    return config;
  }

  /**
   * Get theme and locale preference defaults
   * Task 1.3: Preference defaults
   */
  async getPreferenceDefaults(): Promise<PreferenceDefaults> {
    return {
      theme: 'system',
      locale: AVAILABLE_LOCALES[0],
      availableThemes: ['light', 'dark', 'system'],
      availableLocales: AVAILABLE_LOCALES,
    };
  }

  /**
   * Get user preferences
   * Task 1.3, 1.5: User preferences with tenant isolation
   */
  async getUserPreferences(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId?: string
  ): Promise<UserPreference | null> {
    const key = this.buildPreferenceKey(userId, userType, tenantId);
    
    // Check cache
    try {
      const cached = await cacheGet<UserPreference>(`${CACHE_PREFIX.PREFERENCES}:${key}`);
      if (cached) {
        return cached;
      }
    } catch {
      // Cache miss
    }

    const preference = userPreferences.get(key);
    
    if (preference) {
      try {
        await cacheSet(`${CACHE_PREFIX.PREFERENCES}:${key}`, preference, PREFERENCES_CACHE_TTL_MS);
      } catch {
        // Cache error
      }
    }

    return preference ?? null;
  }

  /**
   * Update user preferences
   * Task 1.3, 1.5, 1.6: Update preferences with tenant isolation and audit
   */
  async updateUserPreferences(
    userId: string,
    userType: 'user' | 'candidate',
    update: PreferenceUpdateRequest,
    tenantId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserPreference> {
    const key = this.buildPreferenceKey(userId, userType, tenantId);
    const now = new Date();

    const existing = userPreferences.get(key);
    const preference: UserPreference = {
      id: existing?.id ?? `pref-${userId}-${Date.now()}`,
      userId,
      userType,
      tenantId,
      theme: update.theme ?? existing?.theme ?? 'system',
      localeCode: update.localeCode ?? existing?.localeCode ?? 'en',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    userPreferences.set(key, preference);

    // Invalidate cache
    try {
      const { cacheDel } = await import('../db/redis.js');
      await cacheDel(`${CACHE_PREFIX.PREFERENCES}:${key}`);
    } catch {
      // Cache invalidation error
    }

    // Audit log
    auditService.log({
      eventType: 'SHELL_PREFERENCE_UPDATED',
      actorId: userId,
      actorType: userType,
      channel: 'api',
      ipAddress,
      userAgent,
      metadata: {
        tenantId,
        changes: update,
        previousTheme: existing?.theme,
        previousLocale: existing?.localeCode,
      },
      success: true,
    });

    return preference;
  }

  /**
   * Build preference storage key with tenant isolation
   */
  private buildPreferenceKey(userId: string, userType: string, tenantId?: string): string {
    return tenantId ? `${tenantId}:${userType}:${userId}` : `${userType}:${userId}`;
  }

  /**
   * Validate theme value
   */
  isValidTheme(theme: string): theme is ThemeMode {
    return ['light', 'dark', 'system'].includes(theme);
  }

  /**
   * Validate locale code
   */
  isValidLocaleCode(code: string): boolean {
    return AVAILABLE_LOCALES.some((locale) => locale.code === code);
  }
}

export const shellService = new ShellService();
