/**
 * Notification Tests
 * Task 1.4: Tests for notification lifecycle and ordering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationService } from '../src/services/notification.service.js';
import { notificationRepository } from '../src/repositories/notification.repository.js';
import { notificationMetricsService, NOTIFICATION_SLOS } from '../src/services/notification-metrics.service.js';
import {
  calculateExpirationDate,
  getRetentionDays,
  NOTIFICATION_RETENTION,
  type CreateNotificationInput,
} from '../src/models/notification.model.js';

// Mock the notification repository
vi.mock('../src/repositories/notification.repository.js', () => {
  const notifications = new Map<string, {
    id: string;
    tenantId: string;
    userId: string;
    userType: 'user' | 'candidate';
    type: string;
    priority: string;
    title: string;
    body: string;
    status: 'read' | 'unread';
    actionUrl?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    readAt?: Date;
    expiresAt: Date;
  }>();

  let idCounter = 0;

  return {
    notificationRepository: {
      create: vi.fn(async (input: CreateNotificationInput, expiresAt: Date) => {
        idCounter++;
        const id = `notif-${idCounter}`;
        const notification = {
          id,
          tenantId: input.tenantId,
          userId: input.userId,
          userType: input.userType,
          type: input.type,
          priority: input.priority ?? 'normal',
          title: input.title,
          body: input.body,
          status: 'unread' as const,
          actionUrl: input.actionUrl,
          metadata: input.metadata,
          createdAt: new Date(),
          expiresAt,
        };
        notifications.set(id, notification);
        return notification;
      }),

      findById: vi.fn(async (id: string) => {
        return notifications.get(id);
      }),

      findByIdForUser: vi.fn(async (
        id: string,
        tenantId: string,
        userId: string,
        userType: 'user' | 'candidate'
      ) => {
        const notification = notifications.get(id);
        if (
          notification &&
          notification.tenantId === tenantId &&
          notification.userId === userId &&
          notification.userType === userType
        ) {
          return notification;
        }
        return undefined;
      }),

      listForUser: vi.fn(async (
        tenantId: string,
        userId: string,
        userType: 'user' | 'candidate',
        filters: Record<string, unknown> = {},
        pagination: { limit?: number; cursor?: string } = {}
      ) => {
        const matchingNotifications = [];
        for (const notification of notifications.values()) {
          if (
            notification.tenantId === tenantId &&
            notification.userId === userId &&
            notification.userType === userType &&
            notification.expiresAt > new Date()
          ) {
            if (filters.status && notification.status !== filters.status) continue;
            if (filters.type && notification.type !== filters.type) continue;
            if (filters.priority && notification.priority !== filters.priority) continue;
            matchingNotifications.push(notification);
          }
        }
        // Sort by createdAt descending (reverse chronological)
        matchingNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        const limit = pagination.limit ?? 20;
        return {
          notifications: matchingNotifications.slice(0, limit),
          total: matchingNotifications.length,
        };
      }),

      updateStatus: vi.fn(async (id: string, status: 'read' | 'unread') => {
        const notification = notifications.get(id);
        if (notification) {
          notification.status = status;
          notification.readAt = status === 'read' ? new Date() : undefined;
          return true;
        }
        return false;
      }),

      markManyAsRead: vi.fn(async (
        tenantId: string,
        userId: string,
        userType: 'user' | 'candidate',
        ids?: string[]
      ) => {
        let count = 0;
        for (const notification of notifications.values()) {
          if (
            notification.tenantId === tenantId &&
            notification.userId === userId &&
            notification.userType === userType &&
            notification.status === 'unread' &&
            (!ids || ids.includes(notification.id))
          ) {
            notification.status = 'read';
            notification.readAt = new Date();
            count++;
          }
        }
        return count;
      }),

      getUnreadCount: vi.fn(async (
        tenantId: string,
        userId: string,
        userType: 'user' | 'candidate'
      ) => {
        let count = 0;
        for (const notification of notifications.values()) {
          if (
            notification.tenantId === tenantId &&
            notification.userId === userId &&
            notification.userType === userType &&
            notification.status === 'unread' &&
            notification.expiresAt > new Date()
          ) {
            count++;
          }
        }
        return count;
      }),

      verifyTenantOwnership: vi.fn(async (
        id: string,
        tenantId: string,
        userId: string,
        userType: 'user' | 'candidate'
      ) => {
        const notification = notifications.get(id);
        return (
          notification !== undefined &&
          notification.tenantId === tenantId &&
          notification.userId === userId &&
          notification.userType === userType
        );
      }),

      delete: vi.fn(async (id: string) => {
        return notifications.delete(id);
      }),

      cleanupExpired: vi.fn(async () => {
        let count = 0;
        const now = new Date();
        for (const [id, notification] of notifications.entries()) {
          if (notification.expiresAt < now) {
            notifications.delete(id);
            count++;
          }
        }
        return count;
      }),

      // Test helper to clear notifications
      _clear: () => {
        notifications.clear();
        idCounter = 0;
      },
    },
    NotificationRepository: vi.fn(),
  };
});

// Mock audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

const requestContext = {
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  channel: 'api' as const,
};

describe('Notification Model', () => {
  describe('Retention Rules', () => {
    it('should return default retention days for standard notification types', () => {
      expect(getRetentionDays('APPLICATION')).toBe(NOTIFICATION_RETENTION.DEFAULT_RETENTION_DAYS);
      expect(getRetentionDays('SCREENING')).toBe(NOTIFICATION_RETENTION.DEFAULT_RETENTION_DAYS);
      expect(getRetentionDays('DOCUMENT')).toBe(NOTIFICATION_RETENTION.DEFAULT_RETENTION_DAYS);
      expect(getRetentionDays('MESSAGE')).toBe(NOTIFICATION_RETENTION.DEFAULT_RETENTION_DAYS);
      expect(getRetentionDays('REMINDER')).toBe(NOTIFICATION_RETENTION.DEFAULT_RETENTION_DAYS);
    });

    it('should return longer retention for security notifications', () => {
      expect(getRetentionDays('SECURITY')).toBe(NOTIFICATION_RETENTION.SECURITY_RETENTION_DAYS);
    });

    it('should return shorter retention for system announcements', () => {
      expect(getRetentionDays('SYSTEM')).toBe(NOTIFICATION_RETENTION.SYSTEM_RETENTION_DAYS);
    });

    it('should calculate expiration date based on type', () => {
      const now = Date.now();
      const securityExpiration = calculateExpirationDate('SECURITY');
      const systemExpiration = calculateExpirationDate('SYSTEM');
      const defaultExpiration = calculateExpirationDate('APPLICATION');

      // Security should expire later than default
      expect(securityExpiration.getTime()).toBeGreaterThan(defaultExpiration.getTime());
      // System should expire sooner than default
      expect(systemExpiration.getTime()).toBeLessThan(defaultExpiration.getTime());
    });

    it('should clamp TTL to min and max boundaries', () => {
      const now = Date.now();
      
      // Too short - should clamp to min
      const tooShort = calculateExpirationDate('APPLICATION', 1);
      const minDays = NOTIFICATION_RETENTION.MIN_RETENTION_DAYS;
      expect(tooShort.getTime()).toBeGreaterThanOrEqual(now + minDays * 24 * 60 * 60 * 1000 - 1000);

      // Too long - should clamp to max
      const tooLong = calculateExpirationDate('APPLICATION', 1000);
      const maxDays = NOTIFICATION_RETENTION.MAX_RETENTION_DAYS;
      expect(tooLong.getTime()).toBeLessThanOrEqual(now + maxDays * 24 * 60 * 60 * 1000 + 1000);
    });
  });
});

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the mock notification store
    (notificationRepository as unknown as { _clear: () => void })._clear();
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      const input: CreateNotificationInput = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      const result = await notificationService.create(input, requestContext);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'APPLICATION',
        status: 'unread',
      });
    });

    it('should set priority when provided', async () => {
      const input: CreateNotificationInput = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'SECURITY',
        priority: 'urgent',
        title: 'Security Alert',
        body: 'Login from new device',
      };

      const result = await notificationService.create(input, requestContext);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        priority: 'urgent',
        type: 'SECURITY',
      });
    });
  });

  describe('list', () => {
    it('should return notifications in reverse chronological order', async () => {
      // Create multiple notifications
      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'First',
        body: 'First notification',
      }, requestContext);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Second',
        body: 'Second notification',
      }, requestContext);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Third',
        body: 'Third notification',
      }, requestContext);

      const result = await notificationService.list(
        'tenant-1',
        'user-1',
        'user',
        {},
        {},
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { notifications: Array<{ title: string }> };
      expect(data.notifications).toHaveLength(3);
      // Most recent first
      expect(data.notifications[0].title).toBe('Third');
      expect(data.notifications[1].title).toBe('Second');
      expect(data.notifications[2].title).toBe('First');
    });

    it('should filter notifications by status', async () => {
      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Unread 1',
        body: 'Unread notification',
      }, requestContext);

      const createResult = await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'To be read',
        body: 'Will be marked as read',
      }, requestContext);

      // Mark one as read
      const notifId = (createResult.data as { id: string }).id;
      await notificationService.markAsRead(
        notifId,
        'tenant-1',
        'user-1',
        'user',
        requestContext
      );

      // List only unread
      const unreadResult = await notificationService.list(
        'tenant-1',
        'user-1',
        'user',
        { status: 'unread' },
        {},
        requestContext
      );

      expect(unreadResult.success).toBe(true);
      const data = unreadResult.data as { notifications: Array<{ title: string }> };
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0].title).toBe('Unread 1');
    });

    it('should filter notifications by type', async () => {
      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'App Notification',
        body: 'Application notification',
      }, requestContext);

      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'SECURITY',
        title: 'Security Alert',
        body: 'Security notification',
      }, requestContext);

      const result = await notificationService.list(
        'tenant-1',
        'user-1',
        'user',
        { type: 'SECURITY' },
        {},
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { notifications: Array<{ type: string }> };
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0].type).toBe('SECURITY');
    });
  });

  describe('tenant isolation', () => {
    it('should not allow access to another tenant notifications', async () => {
      // Create notification for tenant-1
      const createResult = await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Tenant 1 Notification',
        body: 'Private to tenant 1',
      }, requestContext);

      const notifId = (createResult.data as { id: string }).id;

      // Try to access from different tenant
      const result = await notificationService.getById(
        notifId,
        'tenant-2', // Different tenant
        'user-1',
        'user',
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOTIFICATION_NOT_FOUND');
    });

    it('should not allow one user to read another users notifications', async () => {
      // Create notification for user-1
      const createResult = await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'User 1 Notification',
        body: 'Private to user 1',
      }, requestContext);

      const notifId = (createResult.data as { id: string }).id;

      // Try to access as user-2
      const result = await notificationService.getById(
        notifId,
        'tenant-1',
        'user-2', // Different user
        'user',
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOTIFICATION_NOT_FOUND');
    });

    it('should not allow marking another users notification as read', async () => {
      // Create notification for user-1
      const createResult = await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'User 1 Notification',
        body: 'Private to user 1',
      }, requestContext);

      const notifId = (createResult.data as { id: string }).id;

      // Try to mark as read as user-2
      const result = await notificationService.markAsRead(
        notifId,
        'tenant-1',
        'user-2', // Different user
        'user',
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOTIFICATION_NOT_FOUND');
    });
  });

  describe('read/unread status', () => {
    it('should mark notification as read', async () => {
      const createResult = await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Test',
        body: 'Test notification',
      }, requestContext);

      const notifId = (createResult.data as { id: string }).id;

      const result = await notificationService.markAsRead(
        notifId,
        'tenant-1',
        'user-1',
        'user',
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { status: string; readAt: Date };
      expect(data.status).toBe('read');
      expect(data.readAt).toBeDefined();
    });

    it('should mark notification as unread', async () => {
      const createResult = await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Test',
        body: 'Test notification',
      }, requestContext);

      const notifId = (createResult.data as { id: string }).id;

      // Mark as read first
      await notificationService.markAsRead(
        notifId,
        'tenant-1',
        'user-1',
        'user',
        requestContext
      );

      // Then mark as unread
      const result = await notificationService.markAsUnread(
        notifId,
        'tenant-1',
        'user-1',
        'user',
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { status: string; readAt?: Date };
      expect(data.status).toBe('unread');
      expect(data.readAt).toBeUndefined();
    });

    it('should mark multiple notifications as read', async () => {
      // Create multiple notifications
      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Notification 1',
        body: 'Body 1',
      }, requestContext);

      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Notification 2',
        body: 'Body 2',
      }, requestContext);

      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Notification 3',
        body: 'Body 3',
      }, requestContext);

      // Check unread count before
      const countBefore = await notificationService.getUnreadCount(
        'tenant-1',
        'user-1',
        'user'
      );
      expect((countBefore.data as { count: number }).count).toBe(3);

      // Mark all as read
      const result = await notificationService.markManyAsRead(
        'tenant-1',
        'user-1',
        'user',
        undefined, // All
        requestContext
      );

      expect(result.success).toBe(true);
      expect((result.data as { count: number }).count).toBe(3);

      // Check unread count after
      const countAfter = await notificationService.getUnreadCount(
        'tenant-1',
        'user-1',
        'user'
      );
      expect((countAfter.data as { count: number }).count).toBe(0);
    });
  });

  describe('unread count', () => {
    it('should return correct unread count', async () => {
      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Unread 1',
        body: 'Body',
      }, requestContext);

      const createResult = await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Will be read',
        body: 'Body',
      }, requestContext);

      await notificationService.create({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        title: 'Unread 2',
        body: 'Body',
      }, requestContext);

      // Mark one as read
      const notifId = (createResult.data as { id: string }).id;
      await notificationService.markAsRead(
        notifId,
        'tenant-1',
        'user-1',
        'user',
        requestContext
      );

      const result = await notificationService.getUnreadCount(
        'tenant-1',
        'user-1',
        'user'
      );

      expect(result.success).toBe(true);
      expect((result.data as { count: number }).count).toBe(2);
    });
  });
});

describe('Notification Metrics', () => {
  it('should check SLOs correctly', () => {
    const result = notificationMetricsService.checkSLOs();
    
    // With no data, SLOs should be met
    expect(result.met).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should have defined SLO targets', () => {
    expect(NOTIFICATION_SLOS.LIST_LATENCY_P99_MS).toBeDefined();
    expect(NOTIFICATION_SLOS.LIST_LATENCY_P95_MS).toBeDefined();
    expect(NOTIFICATION_SLOS.READ_LATENCY_P99_MS).toBeDefined();
    expect(NOTIFICATION_SLOS.LIST_SUCCESS_RATE).toBeDefined();
    expect(NOTIFICATION_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE).toBeDefined();
  });
});
