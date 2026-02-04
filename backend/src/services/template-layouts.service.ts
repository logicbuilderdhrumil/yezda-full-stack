/**
 * Template Layouts Service
 * Task 1.2, 1.3, 1.5, 1.6: Navigation metadata, profile/notification summaries,
 * tenant isolation, and audit logging
 */

import type {
  TemplateLayoutNavigation,
  HeaderMetadata,
  SideNavMetadata,
  HeaderNavItem,
  SideNavItem,
  GlobalControlSummary,
  ProfileSummary,
  NotificationSummary,
  LayoutAccessContext,
} from '../models/template-layouts.model.js';
import { auditService } from './audit.service.js';
import { cacheGet, cacheSet, cacheDel } from '../db/redis.js';

// Cache TTL constants
const NAVIGATION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// Cache key prefixes
const CACHE_PREFIX = {
  NAVIGATION: 'layout:nav',
  PROFILE_SUMMARY: 'layout:profile',
  NOTIFICATION_SUMMARY: 'layout:notif',
};

/**
 * Default header navigation items
 */
const DEFAULT_HEADER_NAV_ITEMS: HeaderNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    path: '/dashboard',
    action: 'link',
  },
  {
    id: 'help',
    label: 'Help',
    icon: 'help-circle',
    action: 'dropdown',
    children: [
      { id: 'docs', label: 'Documentation', path: '/docs', action: 'link' },
      { id: 'support', label: 'Support', path: '/support', action: 'link' },
    ],
  },
];

/**
 * Default side navigation items with role-based access
 */
const DEFAULT_SIDE_NAV_ITEMS: SideNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    path: '/dashboard',
    order: 1,
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: 'users',
    path: '/candidates',
    authorities: ['candidate:read'],
    order: 2,
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
    order: 3,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'chart',
    path: '/reports',
    authorities: ['report:read'],
    order: 4,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    authorities: ['settings:read'],
    order: 5,
    children: [
      {
        id: 'settings-account',
        label: 'Account',
        path: '/settings/account',
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
    order: 6,
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

// In-memory mock user profile storage (would be fetched from user service in production)
const mockProfiles = new Map<string, ProfileSummary>();

// In-memory mock notification counts (would be fetched from notification service in production)
const mockNotificationCounts = new Map<string, NotificationSummary>();

export class TemplateLayoutsService {
  /**
   * Get template layout navigation metadata
   * Task 1.2: Header and side navigation structures
   */
  async getLayoutNavigation(
    context: LayoutAccessContext
  ): Promise<TemplateLayoutNavigation> {
    const { userId, userType, tenantId, authorities } = context;
    const cacheKey = this.buildNavigationCacheKey(userId, userType, tenantId);

    // Check cache first
    try {
      const cached = await cacheGet<TemplateLayoutNavigation>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Cache miss or error, continue to generate
    }

    // Build header metadata
    const header: HeaderMetadata = {
      title: 'Yezda',
      showSearch: true,
      showNotifications: true,
      showProfile: true,
      navItems: this.filterHeaderNavItems(DEFAULT_HEADER_NAV_ITEMS, authorities),
    };

    // Build side navigation metadata
    const sideNav: SideNavMetadata = {
      visible: true,
      collapsible: true,
      defaultCollapsed: false,
      position: 'left',
      items: this.filterSideNavItems(DEFAULT_SIDE_NAV_ITEMS, authorities),
    };

    const result: TemplateLayoutNavigation = {
      header,
      sideNav,
      version: '1.0.0',
    };

    // Cache the result
    try {
      await cacheSet(cacheKey, result, NAVIGATION_CACHE_TTL_MS);
    } catch {
      // Cache set error, continue without caching
    }

    // Audit log
    auditService.log({
      eventType: 'SHELL_CONFIG_ACCESSED',
      actorId: userId,
      actorType: userType,
      channel: 'api',
      metadata: {
        resource: 'layout_navigation',
        tenantId,
        headerItemCount: header.navItems.length,
        sideNavItemCount: sideNav.items.length,
      },
      success: true,
    });

    return result;
  }

  /**
   * Get profile and notification summary
   * Task 1.3: Profile and notification data for templates
   */
  async getGlobalControlSummary(
    context: LayoutAccessContext
  ): Promise<GlobalControlSummary> {
    const { userId, userType, tenantId } = context;

    // Get profile summary
    const profile = await this.getProfileSummary(userId, userType, tenantId);

    // Get notification summary
    const notifications = await this.getNotificationSummary(userId, userType, tenantId);

    // Audit log
    auditService.log({
      eventType: 'SHELL_CONFIG_ACCESSED',
      actorId: userId,
      actorType: userType,
      channel: 'api',
      metadata: {
        resource: 'profile_summary',
        tenantId,
        notificationCount: notifications.unreadCount,
      },
      success: true,
    });

    return { profile, notifications };
  }

  /**
   * Get profile summary for a user
   */
  private async getProfileSummary(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId?: string
  ): Promise<ProfileSummary> {
    const cacheKey = `${CACHE_PREFIX.PROFILE_SUMMARY}:${tenantId ?? 'default'}:${userType}:${userId}`;

    // Check cache
    try {
      const cached = await cacheGet<ProfileSummary>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Cache miss
    }

    // Get from mock storage or generate default
    const key = this.buildUserKey(userId, userType, tenantId);
    let profile = mockProfiles.get(key);

    if (!profile) {
      // Generate default profile
      profile = {
        id: userId,
        displayName: userType === 'candidate' ? 'Candidate User' : 'System User',
        email: `${userId}@example.com`,
        role: userType === 'candidate' ? 'candidate' : 'user',
        tenantId,
      };
      mockProfiles.set(key, profile);
    }

    // Cache result
    try {
      await cacheSet(cacheKey, profile, PROFILE_CACHE_TTL_MS);
    } catch {
      // Cache error
    }

    return profile;
  }

  /**
   * Get notification summary for a user
   */
  private async getNotificationSummary(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId?: string
  ): Promise<NotificationSummary> {
    const cacheKey = `${CACHE_PREFIX.NOTIFICATION_SUMMARY}:${tenantId ?? 'default'}:${userType}:${userId}`;

    // Check cache
    try {
      const cached = await cacheGet<NotificationSummary>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Cache miss
    }

    // Get from mock storage or generate default
    const key = this.buildUserKey(userId, userType, tenantId);
    let summary = mockNotificationCounts.get(key);

    if (!summary) {
      // Generate default notification summary
      summary = {
        unreadCount: 0,
        hasUrgent: false,
        lastUpdated: new Date(),
      };
      mockNotificationCounts.set(key, summary);
    }

    // Cache result
    try {
      await cacheSet(cacheKey, summary, PROFILE_CACHE_TTL_MS);
    } catch {
      // Cache error
    }

    return summary;
  }

  /**
   * Filter header nav items by authorities
   */
  private filterHeaderNavItems(
    items: HeaderNavItem[],
    authorities: string[]
  ): HeaderNavItem[] {
    return items
      .filter((item) => {
        if (!item.authorities || item.authorities.length === 0) {
          return true;
        }
        return item.authorities.some((auth) => authorities.includes(auth));
      })
      .map((item) => ({
        ...item,
        children: item.children
          ? this.filterHeaderNavItems(item.children, authorities)
          : undefined,
      }));
  }

  /**
   * Filter side nav items by authorities
   */
  private filterSideNavItems(
    items: SideNavItem[],
    authorities: string[]
  ): SideNavItem[] {
    return items
      .filter((item) => {
        if (!item.authorities || item.authorities.length === 0) {
          return true;
        }
        return item.authorities.some((auth) => authorities.includes(auth));
      })
      .map((item) => ({
        ...item,
        children: item.children
          ? this.filterSideNavItems(item.children, authorities)
          : undefined,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /**
   * Build cache key for navigation
   */
  private buildNavigationCacheKey(
    userId: string,
    userType: string,
    tenantId?: string
  ): string {
    return `${CACHE_PREFIX.NAVIGATION}:${tenantId ?? 'default'}:${userType}:${userId}`;
  }

  /**
   * Build user key for storage
   */
  private buildUserKey(
    userId: string,
    userType: string,
    tenantId?: string
  ): string {
    return tenantId ? `${tenantId}:${userType}:${userId}` : `${userType}:${userId}`;
  }

  /**
   * Validate tenant access
   * Task 1.5: Tenant isolation for layout data
   */
  validateTenantAccess(
    requestedTenantId: string | undefined,
    userTenantId: string | undefined
  ): { valid: boolean; reason?: string } {
    // If no tenant specified, allow (will use user's default tenant)
    if (!requestedTenantId) {
      return { valid: true };
    }

    // If user has no tenant, deny cross-tenant access
    if (!userTenantId) {
      return { valid: false, reason: 'User has no tenant association' };
    }

    // Tenant must match
    if (requestedTenantId !== userTenantId) {
      return {
        valid: false,
        reason: 'Cross-tenant access denied',
      };
    }

    return { valid: true };
  }

  /**
   * Log layout access denied event
   * Task 1.6: Audit logging for denied access
   */
  logAccessDenied(
    userId: string,
    userType: 'user' | 'candidate',
    reason: string,
    requestedTenantId?: string,
    ipAddress?: string
  ): void {
    auditService.log({
      eventType: 'GUARD_AUTH_DENIED',
      actorId: userId,
      actorType: userType,
      channel: 'api',
      ipAddress,
      metadata: {
        resource: 'template_layout',
        reason,
        requestedTenantId,
      },
      success: false,
      errorMessage: reason,
    });
  }

  /**
   * Invalidate navigation cache for a user
   */
  async invalidateNavigationCache(
    userId: string,
    userType: string,
    tenantId?: string
  ): Promise<void> {
    const cacheKey = this.buildNavigationCacheKey(userId, userType, tenantId);
    try {
      await cacheDel(cacheKey);
    } catch {
      // Cache deletion error
    }
  }

  /**
   * Update mock profile data (for testing/development)
   */
  setMockProfile(userId: string, userType: 'user' | 'candidate', tenantId: string | undefined, profile: ProfileSummary): void {
    const key = this.buildUserKey(userId, userType, tenantId);
    mockProfiles.set(key, profile);
  }

  /**
   * Update mock notification data (for testing/development)
   */
  setMockNotificationSummary(userId: string, userType: 'user' | 'candidate', tenantId: string | undefined, summary: NotificationSummary): void {
    const key = this.buildUserKey(userId, userType, tenantId);
    mockNotificationCounts.set(key, summary);
  }

  /**
   * Clear mock data (for testing)
   */
  clearMockData(): void {
    mockProfiles.clear();
    mockNotificationCounts.clear();
  }
}

export const templateLayoutsService = new TemplateLayoutsService();
