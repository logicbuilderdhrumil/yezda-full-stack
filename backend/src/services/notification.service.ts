/**
 * Notification Service
 * Task 1.2, 1.3: Notification lifecycle operations
 * Task 1.5: Tenant scoping and RBAC
 * Task 1.6: Audit logging for notification access and status changes
 * Task 1.8: SLO metrics
 */

import { notificationRepository } from '../repositories/notification.repository.js';
import { auditService } from './audit.service.js';
import { notificationMetricsService } from './notification-metrics.service.js';
import {
  calculateExpirationDate,
  type CreateNotificationInput,
  type NotificationFilters,
  type NotificationListResult,
  type NotificationOperationResult,
  type NotificationPaginationOptions,
  type NotificationStatus,
} from '../models/notification.model.js';

/**
 * Request context for audit logging
 */
interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async create(
    input: CreateNotificationInput,
    requestContext: RequestContext
  ): Promise<NotificationOperationResult> {
    const start = Date.now();

    try {
      const expiresAt = calculateExpirationDate(input.type, input.ttlDays);
      const notification = await notificationRepository.create(input, expiresAt);

      this.logNotificationEvent('NOTIFICATION_CREATED', {
        tenantId: input.tenantId,
        userId: input.userId,
        userType: input.userType,
        notificationId: notification.id,
        notificationType: input.type,
        success: true,
        ...requestContext,
      });

      notificationMetricsService.recordCreate(true, Date.now() - start);

      return { success: true, data: notification };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logNotificationEvent('NOTIFICATION_CREATED', {
        tenantId: input.tenantId,
        userId: input.userId,
        userType: input.userType,
        notificationType: input.type,
        success: false,
        errorMessage,
        ...requestContext,
      });

      notificationMetricsService.recordCreate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to create notification',
        errorCode: 'NOTIFICATION_CREATE_ERROR',
      };
    }
  }

  /**
   * Get notification by ID with ownership verification
   */
  async getById(
    id: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: RequestContext
  ): Promise<NotificationOperationResult> {
    const start = Date.now();

    try {
      const notification = await notificationRepository.findByIdForUser(
        id,
        tenantId,
        userId,
        userType
      );

      if (!notification) {
        this.logNotificationEvent('NOTIFICATION_ACCESS_DENIED', {
          tenantId,
          userId,
          userType,
          notificationId: id,
          success: false,
          errorMessage: 'Notification not found or access denied',
          ...requestContext,
        });

        notificationMetricsService.recordAccessDenied();

        return {
          success: false,
          error: 'Notification not found',
          errorCode: 'NOTIFICATION_NOT_FOUND',
        };
      }

      this.logNotificationEvent('NOTIFICATION_DETAIL_ACCESSED', {
        tenantId,
        userId,
        userType,
        notificationId: id,
        notificationType: notification.type,
        success: true,
        ...requestContext,
      });

      notificationMetricsService.recordRead(true, Date.now() - start);

      return { success: true, data: notification };
    } catch (_error) {
      notificationMetricsService.recordRead(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve notification',
        errorCode: 'NOTIFICATION_READ_ERROR',
      };
    }
  }

  /**
   * List notifications for a user
   */
  async list(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    filters: NotificationFilters = {},
    pagination: NotificationPaginationOptions = {},
    requestContext: RequestContext
  ): Promise<NotificationOperationResult> {
    const start = Date.now();

    try {
      const limit = Math.min(pagination.limit ?? 20, 100);
      const { notifications, total } = await notificationRepository.listForUser(
        tenantId,
        userId,
        userType,
        filters,
        { ...pagination, limit }
      );

      const hasMore = notifications.length > limit;
      const resultNotifications = hasMore ? notifications.slice(0, -1) : notifications;
      const nextCursor = hasMore
        ? resultNotifications[resultNotifications.length - 1]?.createdAt.toISOString()
        : undefined;

      const result: NotificationListResult = {
        notifications: resultNotifications,
        total,
        hasMore,
        nextCursor,
      };

      this.logNotificationEvent('NOTIFICATION_LIST_ACCESSED', {
        tenantId,
        userId,
        userType,
        success: true,
        metadata: {
          count: resultNotifications.length,
          total,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        },
        ...requestContext,
      });

      notificationMetricsService.recordList(true, Date.now() - start);

      return { success: true, data: result };
    } catch (_error) {
      notificationMetricsService.recordList(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to list notifications',
        errorCode: 'NOTIFICATION_LIST_ERROR',
      };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    id: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: RequestContext
  ): Promise<NotificationOperationResult> {
    return this.updateStatus(id, tenantId, userId, userType, 'read', requestContext);
  }

  /**
   * Mark a notification as unread
   */
  async markAsUnread(
    id: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: RequestContext
  ): Promise<NotificationOperationResult> {
    return this.updateStatus(id, tenantId, userId, userType, 'unread', requestContext);
  }

  /**
   * Update notification status with ownership verification
   */
  private async updateStatus(
    id: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    status: NotificationStatus,
    requestContext: RequestContext
  ): Promise<NotificationOperationResult> {
    const start = Date.now();

    try {
      // Verify ownership
      const isOwner = await notificationRepository.verifyTenantOwnership(
        id,
        tenantId,
        userId,
        userType
      );

      if (!isOwner) {
        this.logNotificationEvent('NOTIFICATION_ACCESS_DENIED', {
          tenantId,
          userId,
          userType,
          notificationId: id,
          success: false,
          errorMessage: 'Unauthorized access attempt',
          ...requestContext,
        });

        notificationMetricsService.recordAccessDenied();

        return {
          success: false,
          error: 'Notification not found',
          errorCode: 'NOTIFICATION_NOT_FOUND',
        };
      }

      const updated = await notificationRepository.updateStatus(id, status);

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update notification status',
          errorCode: 'NOTIFICATION_UPDATE_ERROR',
        };
      }

      const eventType = status === 'read' ? 'NOTIFICATION_READ' : 'NOTIFICATION_UNREAD';

      this.logNotificationEvent(eventType, {
        tenantId,
        userId,
        userType,
        notificationId: id,
        success: true,
        ...requestContext,
      });

      notificationMetricsService.recordStatusUpdate(true, Date.now() - start);

      // Fetch updated notification
      const notification = await notificationRepository.findById(id);

      return { success: true, data: notification };
    } catch (_error) {
      notificationMetricsService.recordStatusUpdate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to update notification',
        errorCode: 'NOTIFICATION_UPDATE_ERROR',
      };
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    ids?: string[],
    requestContext?: RequestContext
  ): Promise<NotificationOperationResult> {
    const start = Date.now();
    const context = requestContext ?? { channel: 'api' as const };

    try {
      const count = await notificationRepository.markManyAsRead(
        tenantId,
        userId,
        userType,
        ids
      );

      this.logNotificationEvent('NOTIFICATION_BATCH_MARKED_READ', {
        tenantId,
        userId,
        userType,
        success: true,
        metadata: {
          count,
          specificIds: ids?.length ?? 'all',
        },
        ...context,
      });

      notificationMetricsService.recordStatusUpdate(true, Date.now() - start);

      return { success: true, data: { count } };
    } catch (_error) {
      notificationMetricsService.recordStatusUpdate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to mark notifications as read',
        errorCode: 'NOTIFICATION_BATCH_UPDATE_ERROR',
      };
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<NotificationOperationResult> {
    try {
      const count = await notificationRepository.getUnreadCount(
        tenantId,
        userId,
        userType
      );

      return { success: true, data: { count } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get unread count',
        errorCode: 'NOTIFICATION_COUNT_ERROR',
      };
    }
  }

  /**
   * Cleanup expired notifications
   */
  async cleanupExpired(): Promise<number> {
    try {
      const count = await notificationRepository.cleanupExpired();
      console.log(`[Notification] Cleaned up ${count} expired notifications`);
      return count;
    } catch (error) {
      console.error('[Notification] Failed to cleanup expired notifications:', error);
      return 0;
    }
  }

  /**
   * Log notification audit event
   */
  private logNotificationEvent(
    eventType: string,
    params: {
      tenantId: string;
      userId: string;
      userType: 'user' | 'candidate';
      notificationId?: string;
      notificationType?: string;
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      channel: 'web' | 'mobile' | 'api';
    }
  ): void {
    // Map to existing audit event types for compatibility
    const mappedEventType = params.success
      ? 'SHELL_CONFIG_ACCESSED'
      : 'AUTH_ANOMALY_DETECTED';

    auditService.log({
      eventType: mappedEventType,
      actorId: params.userId,
      actorType: params.userType,
      targetId: params.notificationId,
      targetType: 'notification',
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        notificationEventType: eventType,
        tenantId: params.tenantId,
        notificationType: params.notificationType,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

export const notificationService = new NotificationService();
