/**
 * Template Layouts Tests
 * Task 1.4: Tests for layout data responses
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { templateLayoutsService } from '../src/services/template-layouts.service.js';
import {
  templateLayoutsMetricsService,
  TEMPLATE_LAYOUT_SLOS,
} from '../src/services/template-layouts-metrics.service.js';
import type { LayoutAccessContext } from '../src/models/template-layouts.model.js';

// Mock Redis cache
vi.mock('../src/db/redis.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDel: vi.fn().mockResolvedValue(undefined),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 }),
}));

// Mock audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
    logAnomaly: vi.fn(),
  },
}));

// Mock metrics service
vi.mock('../src/services/metrics.service.js', () => ({
  metricsService: {
    incrementCounter: vi.fn(),
    recordLatency: vi.fn(),
    getMetrics: vi.fn(() => []),
  },
}));

describe('Template Layouts Service', () => {
  beforeEach(() => {
    templateLayoutsService.clearMockData();
    vi.clearAllMocks();
  });

  describe('getLayoutNavigation', () => {
    it('should return layout navigation metadata', async () => {
      const context: LayoutAccessContext = {
        userId: 'test-user-123',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: ['candidate:read', 'screening:read', 'report:read', 'settings:read'],
      };

      const navigation = await templateLayoutsService.getLayoutNavigation(context);

      expect(navigation).toHaveProperty('header');
      expect(navigation).toHaveProperty('sideNav');
      expect(navigation).toHaveProperty('version');
      expect(navigation.version).toBe('1.0.0');

      // Verify header structure
      expect(navigation.header).toHaveProperty('title');
      expect(navigation.header).toHaveProperty('showSearch');
      expect(navigation.header).toHaveProperty('showNotifications');
      expect(navigation.header).toHaveProperty('showProfile');
      expect(navigation.header).toHaveProperty('navItems');
      expect(Array.isArray(navigation.header.navItems)).toBe(true);

      // Verify side nav structure
      expect(navigation.sideNav).toHaveProperty('visible');
      expect(navigation.sideNav).toHaveProperty('collapsible');
      expect(navigation.sideNav).toHaveProperty('defaultCollapsed');
      expect(navigation.sideNav).toHaveProperty('position');
      expect(navigation.sideNav).toHaveProperty('items');
      expect(Array.isArray(navigation.sideNav.items)).toBe(true);
    });

    it('should filter navigation items by user authorities', async () => {
      const context: LayoutAccessContext = {
        userId: 'test-user-123',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: ['candidate:read', 'screening:read'],
      };

      const navigation = await templateLayoutsService.getLayoutNavigation(context);
      const sideNavItems = navigation.sideNav.items;

      // Dashboard should be visible (no authorities required)
      expect(sideNavItems.some((item) => item.id === 'dashboard')).toBe(true);

      // Candidates should be visible (user has candidate:read)
      expect(sideNavItems.some((item) => item.id === 'candidates')).toBe(true);

      // Screenings should be visible (user has screening:read)
      expect(sideNavItems.some((item) => item.id === 'screenings')).toBe(true);

      // Reports should NOT be visible (requires report:read)
      expect(sideNavItems.some((item) => item.id === 'reports')).toBe(false);

      // Admin should NOT be visible (requires admin authority)
      expect(sideNavItems.some((item) => item.id === 'admin')).toBe(false);
    });

    it('should filter admin navigation for users with admin authority', async () => {
      const context: LayoutAccessContext = {
        userId: 'admin-user',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: ['admin', 'candidate:read'],
      };

      const navigation = await templateLayoutsService.getLayoutNavigation(context);
      const sideNavItems = navigation.sideNav.items;

      // Admin should be visible
      expect(sideNavItems.some((item) => item.id === 'admin')).toBe(true);
    });

    it('should show limited navigation for candidates', async () => {
      const context: LayoutAccessContext = {
        userId: 'candidate-user',
        userType: 'candidate',
        tenantId: 'tenant-1',
        authorities: ['candidate:self'],
      };

      const navigation = await templateLayoutsService.getLayoutNavigation(context);
      const sideNavItems = navigation.sideNav.items;

      // Dashboard should be visible (no authorities required)
      expect(sideNavItems.some((item) => item.id === 'dashboard')).toBe(true);

      // Candidates should NOT be visible (requires candidate:read)
      expect(sideNavItems.some((item) => item.id === 'candidates')).toBe(false);
    });
  });

  describe('getGlobalControlSummary', () => {
    it('should return profile and notification summary', async () => {
      const context: LayoutAccessContext = {
        userId: 'test-user',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: ['candidate:read'],
      };

      const summary = await templateLayoutsService.getGlobalControlSummary(context);

      expect(summary).toHaveProperty('profile');
      expect(summary).toHaveProperty('notifications');

      // Verify profile structure
      expect(summary.profile).toHaveProperty('id');
      expect(summary.profile).toHaveProperty('displayName');
      expect(summary.profile).toHaveProperty('email');
      expect(summary.profile).toHaveProperty('role');

      // Verify notification structure
      expect(summary.notifications).toHaveProperty('unreadCount');
      expect(summary.notifications).toHaveProperty('hasUrgent');
      expect(summary.notifications).toHaveProperty('lastUpdated');
    });

    it('should return default profile for new users', async () => {
      const context: LayoutAccessContext = {
        userId: 'new-user-123',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: [],
      };

      const summary = await templateLayoutsService.getGlobalControlSummary(context);

      expect(summary.profile.id).toBe('new-user-123');
      expect(summary.profile.displayName).toBe('System User');
      expect(summary.notifications.unreadCount).toBe(0);
    });

    it('should return candidate-specific profile for candidates', async () => {
      const context: LayoutAccessContext = {
        userId: 'candidate-123',
        userType: 'candidate',
        tenantId: 'tenant-1',
        authorities: [],
      };

      const summary = await templateLayoutsService.getGlobalControlSummary(context);

      expect(summary.profile.displayName).toBe('Candidate User');
      expect(summary.profile.role).toBe('candidate');
    });

    it('should use custom profile when set', async () => {
      templateLayoutsService.setMockProfile('custom-user', 'user', 'tenant-1', {
        id: 'custom-user',
        displayName: 'Custom Display Name',
        email: 'custom@example.com',
        role: 'admin',
        organizationName: 'Test Organization',
        tenantId: 'tenant-1',
      });

      const context: LayoutAccessContext = {
        userId: 'custom-user',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: [],
      };

      const summary = await templateLayoutsService.getGlobalControlSummary(context);

      expect(summary.profile.displayName).toBe('Custom Display Name');
      expect(summary.profile.email).toBe('custom@example.com');
      expect(summary.profile.organizationName).toBe('Test Organization');
    });

    it('should use custom notification summary when set', async () => {
      templateLayoutsService.setMockNotificationSummary('notif-user', 'user', 'tenant-1', {
        unreadCount: 5,
        hasUrgent: true,
        lastUpdated: new Date(),
      });

      const context: LayoutAccessContext = {
        userId: 'notif-user',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: [],
      };

      const summary = await templateLayoutsService.getGlobalControlSummary(context);

      expect(summary.notifications.unreadCount).toBe(5);
      expect(summary.notifications.hasUrgent).toBe(true);
    });
  });

  describe('Tenant Isolation', () => {
    it('should deny access for cross-tenant requests', () => {
      const validation = templateLayoutsService.validateTenantAccess('tenant-2', 'tenant-1');
      
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Cross-tenant access denied');
    });

    it('should allow access when tenant matches', () => {
      const validation = templateLayoutsService.validateTenantAccess('tenant-1', 'tenant-1');
      
      expect(validation.valid).toBe(true);
      expect(validation.reason).toBeUndefined();
    });

    it('should allow access when no tenant is specified', () => {
      const validation = templateLayoutsService.validateTenantAccess(undefined, 'tenant-1');
      
      expect(validation.valid).toBe(true);
    });

    it('should deny access when user has no tenant', () => {
      const validation = templateLayoutsService.validateTenantAccess('tenant-1', undefined);
      
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('User has no tenant association');
    });
  });

  describe('Audit Logging', () => {
    it('should log access denied events', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      templateLayoutsService.logAccessDenied(
        'test-user',
        'user',
        'Cross-tenant access denied',
        'tenant-2',
        '127.0.0.1'
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'GUARD_AUTH_DENIED',
          actorId: 'test-user',
          actorType: 'user',
          success: false,
        })
      );
    });

    it('should log navigation access', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      const context: LayoutAccessContext = {
        userId: 'audit-test-user',
        userType: 'user',
        tenantId: 'tenant-1',
        authorities: ['candidate:read'],
      };

      await templateLayoutsService.getLayoutNavigation(context);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'SHELL_CONFIG_ACCESSED',
          actorId: 'audit-test-user',
          actorType: 'user',
          success: true,
        })
      );
    });
  });
});

describe('Template Layouts Metrics Service', () => {
  describe('SLO Checking', () => {
    it('should check SLOs and return status', () => {
      const sloStatus = templateLayoutsMetricsService.checkSLOs();

      expect(sloStatus).toHaveProperty('met');
      expect(sloStatus).toHaveProperty('violations');
      expect(typeof sloStatus.met).toBe('boolean');
      expect(Array.isArray(sloStatus.violations)).toBe(true);
    });

    it('should return healthy status when no violations', () => {
      const sloStatus = templateLayoutsMetricsService.checkSLOs();

      // With no metrics recorded, should be healthy
      expect(sloStatus.met).toBe(true);
      expect(sloStatus.violations).toHaveLength(0);
    });
  });

  describe('Health Summary', () => {
    it('should return comprehensive health summary', () => {
      const health = templateLayoutsMetricsService.getHealthSummary();

      expect(health).toHaveProperty('navigationLatencyP99Ms');
      expect(health).toHaveProperty('profileSummaryLatencyP99Ms');
      expect(health).toHaveProperty('cacheHitRate');
      expect(health).toHaveProperty('rateLimitHits');
      expect(health).toHaveProperty('accessDeniedCount');
      expect(health).toHaveProperty('sloStatus');

      expect(typeof health.navigationLatencyP99Ms).toBe('number');
      expect(typeof health.profileSummaryLatencyP99Ms).toBe('number');
      expect(typeof health.cacheHitRate).toBe('number');
      expect(typeof health.rateLimitHits).toBe('number');
      expect(typeof health.accessDeniedCount).toBe('number');
    });
  });

  describe('Metric Recording', () => {
    it('should record navigation request metrics', () => {
      expect(() => {
        templateLayoutsMetricsService.recordNavigationRequest(true, 45);
      }).not.toThrow();
    });

    it('should record profile summary request metrics', () => {
      expect(() => {
        templateLayoutsMetricsService.recordProfileSummaryRequest(true, 60);
      }).not.toThrow();
    });

    it('should record cache hit metrics', () => {
      expect(() => {
        templateLayoutsMetricsService.recordCacheHit('navigation');
      }).not.toThrow();
    });

    it('should record cache miss metrics', () => {
      expect(() => {
        templateLayoutsMetricsService.recordCacheMiss('navigation');
      }).not.toThrow();
    });

    it('should record access denied metrics', () => {
      expect(() => {
        templateLayoutsMetricsService.recordAccessDenied('tenant_mismatch');
      }).not.toThrow();
    });

    it('should record rate limit hit metrics', () => {
      expect(() => {
        templateLayoutsMetricsService.recordRateLimitHit('/navigation');
      }).not.toThrow();
    });
  });
});

describe('Template Layouts SLO Targets', () => {
  it('should define appropriate latency SLO targets', () => {
    expect(TEMPLATE_LAYOUT_SLOS.NAVIGATION_LATENCY_P99_MS).toBe(100);
    expect(TEMPLATE_LAYOUT_SLOS.NAVIGATION_LATENCY_P95_MS).toBe(50);
    expect(TEMPLATE_LAYOUT_SLOS.PROFILE_SUMMARY_LATENCY_P99_MS).toBe(150);
    expect(TEMPLATE_LAYOUT_SLOS.PROFILE_SUMMARY_LATENCY_P95_MS).toBe(75);
  });

  it('should define appropriate availability SLO targets', () => {
    expect(TEMPLATE_LAYOUT_SLOS.AVAILABILITY_RATE).toBe(99.9);
  });

  it('should define appropriate cache SLO targets', () => {
    expect(TEMPLATE_LAYOUT_SLOS.CACHE_HIT_RATE_MIN).toBe(80);
  });

  it('should define appropriate rate limiting SLO targets', () => {
    expect(TEMPLATE_LAYOUT_SLOS.MAX_RATE_LIMIT_HITS_PER_MINUTE).toBe(100);
    expect(TEMPLATE_LAYOUT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE).toBe(50);
  });
});

describe('Template Layouts Rate Limiting', () => {
  it('should export rate limit middlewares', async () => {
    const rateLimitModule = await import(
      '../src/middleware/template-layouts-rate-limit.middleware.js'
    );

    expect(rateLimitModule.templateLayoutNavigationRateLimiter).toBeDefined();
    expect(typeof rateLimitModule.templateLayoutNavigationRateLimiter).toBe('function');
    expect(rateLimitModule.templateLayoutProfileRateLimiter).toBeDefined();
    expect(typeof rateLimitModule.templateLayoutProfileRateLimiter).toBe('function');
  });
});

describe('Template Layouts Model Types', () => {
  it('should export model types', async () => {
    const models = await import('../src/models/template-layouts.model.js');
    expect(models).toBeDefined();
  });
});

describe('Cache Invalidation', () => {
  it('should allow cache invalidation for navigation', async () => {
    await expect(
      templateLayoutsService.invalidateNavigationCache('user-1', 'user', 'tenant-1')
    ).resolves.toBeUndefined();
  });
});

describe('Mock Data Management', () => {
  beforeEach(() => {
    templateLayoutsService.clearMockData();
  });

  it('should clear mock data', async () => {
    // Set some mock data
    templateLayoutsService.setMockProfile('test-user', 'user', 'tenant-1', {
      id: 'test-user',
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'user',
      tenantId: 'tenant-1',
    });

    // Clear it
    templateLayoutsService.clearMockData();

    // Verify it returns default profile now
    const context: LayoutAccessContext = {
      userId: 'test-user',
      userType: 'user',
      tenantId: 'tenant-1',
      authorities: [],
    };

    const summary = await templateLayoutsService.getGlobalControlSummary(context);
    // Default profile has generic display name
    expect(summary.profile.displayName).toBe('System User');
  });
});
