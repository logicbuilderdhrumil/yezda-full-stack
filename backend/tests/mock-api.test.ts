/**
 * Mock API Tests
 * Tests for mock API mode functionality including:
 * - Fixture responses for core endpoints
 * - Mock service functionality
 * - Environment validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import fixtures directly - these don't need mocking
import {
  mockUsers,
  getMockAuthResponse,
  findMockUserByEmail,
  findMockUserById,
} from '../src/fixtures/auth.fixtures.js';
import {
  findMockUserProfileById,
  findMockUserProfilesByTenant,
} from '../src/fixtures/users.fixtures.js';
import {
  findMockNotificationsForUser,
  findMockNotificationById,
  getMockUnreadCount,
} from '../src/fixtures/notifications.fixtures.js';
import {
  findMockStateEntriesForUser,
  findMockStateEntryByKey,
} from '../src/fixtures/state-store.fixtures.js';
import {
  findMockShellConfigByTenant,
  getMockNavigationForRoles,
} from '../src/fixtures/shell.fixtures.js';
import { getFixtureManifest } from '../src/fixtures/index.js';

describe('Mock Fixtures', () => {
  describe('Auth Fixtures', () => {
    it('should provide mock users with required fields', () => {
      expect(mockUsers.length).toBeGreaterThan(0);

      const adminUser = mockUsers.find((u) => u.roles.includes('platform_admin'));
      expect(adminUser).toBeDefined();
      expect(adminUser?.email).toBeDefined();
      expect(adminUser?.firstName).toBeDefined();
      expect(adminUser?.lastName).toBeDefined();
      expect(adminUser?.tenantId).toBeDefined();
    });

    it('should find users by email (case-insensitive)', () => {
      const adminByEmail = findMockUserByEmail('admin@mock.yezda.dev');
      expect(adminByEmail).toBeDefined();
      expect(adminByEmail?.roles).toContain('platform_admin');

      const adminByUpperCase = findMockUserByEmail('ADMIN@MOCK.YEZDA.DEV');
      expect(adminByUpperCase).toBeDefined();
      expect(adminByUpperCase?.id).toBe(adminByEmail?.id);
    });

    it('should find users by ID', () => {
      const adminById = findMockUserById('mock-user-admin-001');
      expect(adminById).toBeDefined();
      expect(adminById?.email).toBe('admin@mock.yezda.dev');
    });

    it('should return null for unknown email', () => {
      const result = findMockUserByEmail('nonexistent@example.com');
      expect(result).toBeUndefined();
    });

    it('should return auth response with tokens', () => {
      const response = getMockAuthResponse('mock-user-admin-001');

      expect(response).toBeDefined();
      expect(response?.accessToken).toContain('mock-access-token');
      expect(response?.refreshToken).toContain('mock-refresh-token');
      expect(response?.expiresIn).toBe(900);
      expect(response?.user.email).toBe('admin@mock.yezda.dev');
      // Password hash should not be included in response
      expect((response?.user as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should return null for unknown user ID', () => {
      const response = getMockAuthResponse('unknown-user-id');
      expect(response).toBeNull();
    });

    it('should include different user types', () => {
      const users = mockUsers.filter((u) => u.type === 'user');
      const candidates = mockUsers.filter((u) => u.type === 'candidate');

      expect(users.length).toBeGreaterThan(0);
      expect(candidates.length).toBeGreaterThan(0);
    });
  });

  describe('User Profile Fixtures', () => {
    it('should find profile by user ID', () => {
      const profile = findMockUserProfileById('mock-user-admin-001');

      expect(profile).toBeDefined();
      expect(profile?.email).toBe('admin@mock.yezda.dev');
      expect(profile?.preferences).toBeDefined();
      expect(profile?.preferences.theme).toBeDefined();
      expect(profile?.preferences.language).toBeDefined();
    });

    it('should return undefined for unknown user ID', () => {
      const profile = findMockUserProfileById('unknown-id');
      expect(profile).toBeUndefined();
    });

    it('should find profiles by tenant', () => {
      const tenantUsers = findMockUserProfilesByTenant('mock-tenant-001');

      expect(tenantUsers.length).toBeGreaterThan(0);
      tenantUsers.forEach((user) => {
        expect(user.tenantId).toBe('mock-tenant-001');
      });
    });

    it('should return empty array for unknown tenant', () => {
      const users = findMockUserProfilesByTenant('unknown-tenant');
      expect(users).toEqual([]);
    });
  });

  describe('Notification Fixtures', () => {
    it('should find notifications for user', () => {
      const notifications = findMockNotificationsForUser('mock-user-admin-001', 'user');

      expect(notifications.length).toBeGreaterThan(0);
      notifications.forEach((n) => {
        expect(n.userId).toBe('mock-user-admin-001');
        expect(n.userType).toBe('user');
      });
    });

    it('should find notification by ID', () => {
      const notification = findMockNotificationById('mock-notification-001');

      expect(notification).toBeDefined();
      expect(notification?.title).toBe('Welcome to Mock Mode');
      expect(notification?.type).toBe('info');
    });

    it('should return undefined for unknown notification ID', () => {
      const notification = findMockNotificationById('unknown-notification');
      expect(notification).toBeUndefined();
    });

    it('should calculate unread count correctly', () => {
      const unreadCount = getMockUnreadCount('mock-user-admin-001', 'user');
      const notifications = findMockNotificationsForUser('mock-user-admin-001', 'user');
      const manualCount = notifications.filter((n) => !n.read).length;

      expect(unreadCount).toBe(manualCount);
    });

    it('should include various notification types', () => {
      const notification001 = findMockNotificationById('mock-notification-001');
      const notification004 = findMockNotificationById('mock-notification-004');
      const notification005 = findMockNotificationById('mock-notification-005');

      expect(notification001?.type).toBe('info');
      expect(notification004?.type).toBe('warning');
      expect(notification005?.type).toBe('error');
    });
  });

  describe('State Store Fixtures', () => {
    it('should find state entries for user', () => {
      const entries = findMockStateEntriesForUser(
        'mock-user-admin-001',
        'user',
        'mock-tenant-001'
      );

      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((e) => {
        expect(e.userId).toBe('mock-user-admin-001');
        expect(e.tenantId).toBe('mock-tenant-001');
      });
    });

    it('should find state entry by key', () => {
      const entry = findMockStateEntryByKey(
        'mock-user-admin-001',
        'user',
        'mock-tenant-001',
        'dashboard.layout'
      );

      expect(entry).toBeDefined();
      expect(entry?.key).toBe('dashboard.layout');
      
      // Value should be valid JSON
      const value = JSON.parse(entry?.value || '{}');
      expect(value.widgets).toBeDefined();
    });

    it('should return undefined for unknown key', () => {
      const entry = findMockStateEntryByKey(
        'mock-user-admin-001',
        'user',
        'mock-tenant-001',
        'unknown.key'
      );

      expect(entry).toBeUndefined();
    });

    it('should return empty array for user with no entries', () => {
      const entries = findMockStateEntriesForUser(
        'unknown-user',
        'user',
        'mock-tenant-001'
      );

      expect(entries).toEqual([]);
    });
  });

  describe('Shell Fixtures', () => {
    it('should find shell config by tenant', () => {
      const config = findMockShellConfigByTenant('mock-tenant-001');

      expect(config).toBeDefined();
      expect(config?.branding.companyName).toBe('Mock Screening Co.');
      expect(config?.branding.primaryColor).toBeDefined();
      expect(config?.navigation.items.length).toBeGreaterThan(0);
    });

    it('should return undefined for unknown tenant', () => {
      const config = findMockShellConfigByTenant('unknown-tenant');
      expect(config).toBeUndefined();
    });

    it('should filter navigation by roles', () => {
      const adminNav = getMockNavigationForRoles('mock-tenant-001', ['platform_admin']);
      const viewerNav = getMockNavigationForRoles('mock-tenant-001', ['platform_viewer']);

      // Admin should have access to settings, viewer should not
      const adminHasSettings = adminNav.some((item) => item.id === 'nav-settings');
      const viewerHasSettings = viewerNav.some((item) => item.id === 'nav-settings');

      expect(adminHasSettings).toBe(true);
      expect(viewerHasSettings).toBe(false);
    });

    it('should return empty navigation for unknown tenant', () => {
      const nav = getMockNavigationForRoles('unknown-tenant', ['platform_admin']);
      expect(nav).toEqual([]);
    });

    it('should include feature flags in config', () => {
      const config = findMockShellConfigByTenant('mock-tenant-001');

      expect(config?.features).toBeDefined();
      expect(typeof config?.features.mfaRequired).toBe('boolean');
      expect(typeof config?.features.selfRegistration).toBe('boolean');
      expect(typeof config?.features.documentUpload).toBe('boolean');
    });
  });

  describe('Fixture Manifest', () => {
    it('should provide manifest with all fixture categories', () => {
      const manifest = getFixtureManifest();

      expect(manifest.auth).toBeDefined();
      expect(manifest.users).toBeDefined();
      expect(manifest.notifications).toBeDefined();
      expect(manifest.stateStore).toBeDefined();
      expect(manifest.shell).toBeDefined();
    });

    it('should include metadata for each fixture', () => {
      const manifest = getFixtureManifest();

      Object.values(manifest).forEach((fixture) => {
        expect(fixture.name).toBeDefined();
        expect(fixture.description).toBeDefined();
        expect(fixture.lastUpdated).toBeDefined();
        expect(typeof fixture.recordCount).toBe('number');
      });
    });
  });
});

describe('Mock Mode Configuration', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';
    process.env.MOCK_API_ENABLED = 'false';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete process.env.MOCK_API_ENABLED;
  });

  it('should export configuration functions', async () => {
    const {
      isMockModeEnabled,
      canEnableMockMode,
      getMockModeBlockedReason,
      mockConfig,
    } = await import('../src/config/mock.config.js');

    expect(typeof isMockModeEnabled).toBe('function');
    expect(typeof canEnableMockMode).toBe('function');
    expect(typeof getMockModeBlockedReason).toBe('function');
    expect(mockConfig).toBeDefined();
  });

  it('should allow mock mode in development environment', async () => {
    process.env.NODE_ENV = 'development';
    vi.resetModules();

    const { canEnableMockMode } = await import('../src/config/mock.config.js');
    expect(canEnableMockMode()).toBe(true);
  });

  it('should allow mock mode in test environment', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();

    const { canEnableMockMode } = await import('../src/config/mock.config.js');
    expect(canEnableMockMode()).toBe(true);
  });
});

describe('Mock API Service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should provide status information', async () => {
    const { mockApiService } = await import('../src/services/mock-api.service.js');

    const status = mockApiService.getStatus();

    expect(status).toHaveProperty('enabled');
    expect(status).toHaveProperty('environment');
    expect(status).toHaveProperty('canEnable');
    expect(status).toHaveProperty('blockedReason');
  });

  it('should provide fixture manifest', async () => {
    const { mockApiService } = await import('../src/services/mock-api.service.js');

    const manifest = mockApiService.getFixtureManifest();

    expect(manifest).toHaveProperty('auth');
    expect(manifest).toHaveProperty('users');
    expect(manifest).toHaveProperty('notifications');
    expect(manifest).toHaveProperty('stateStore');
    expect(manifest).toHaveProperty('shell');
  });

  it('should expose auth fixture methods', async () => {
    const { mockApiService } = await import('../src/services/mock-api.service.js');

    const allUsers = mockApiService.getAllUsers();
    expect(allUsers.length).toBeGreaterThan(0);

    const user = mockApiService.findUserByEmail('admin@mock.yezda.dev');
    expect(user).toBeDefined();

    const authResponse = mockApiService.getMockAuthResponse('mock-user-admin-001');
    expect(authResponse).toBeDefined();
  });

  it('should expose profile fixture methods', async () => {
    const { mockApiService } = await import('../src/services/mock-api.service.js');

    const profile = mockApiService.getUserProfile('mock-user-admin-001');
    expect(profile).toBeDefined();

    const tenantUsers = mockApiService.getUsersByTenant('mock-tenant-001');
    expect(tenantUsers.length).toBeGreaterThan(0);
  });

  it('should expose notification fixture methods', async () => {
    const { mockApiService } = await import('../src/services/mock-api.service.js');

    const notifications = mockApiService.getNotificationsForUser('mock-user-admin-001', 'user');
    expect(notifications.length).toBeGreaterThan(0);

    const notification = mockApiService.getNotificationById('mock-notification-001');
    expect(notification).toBeDefined();

    const unreadCount = mockApiService.getUnreadCount('mock-user-admin-001', 'user');
    expect(typeof unreadCount).toBe('number');
  });

  it('should expose state store fixture methods', async () => {
    const { mockApiService } = await import('../src/services/mock-api.service.js');

    const entries = mockApiService.getStateEntriesForUser(
      'mock-user-admin-001',
      'user',
      'mock-tenant-001'
    );
    expect(entries.length).toBeGreaterThan(0);

    const entry = mockApiService.getStateEntryByKey(
      'mock-user-admin-001',
      'user',
      'mock-tenant-001',
      'dashboard.layout'
    );
    expect(entry).toBeDefined();
  });

  it('should expose shell fixture methods', async () => {
    const { mockApiService } = await import('../src/services/mock-api.service.js');

    const config = mockApiService.getShellConfig('mock-tenant-001');
    expect(config).toBeDefined();

    const navigation = mockApiService.getNavigationForRoles('mock-tenant-001', ['platform_admin']);
    expect(navigation.length).toBeGreaterThan(0);
  });
});
