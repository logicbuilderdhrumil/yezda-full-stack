/**
 * Notification Domain — barrel export
 */
export type {
  NotificationType, NotificationPriority, NotificationStatus,
  Notification, CreateNotificationDto, NotificationFilters,
  NotificationPaginationOptions, NotificationListResult,
  NotificationOperationResult, NotificationContext, NotificationAuditEventType,
} from './entities/notification.entity.js';
export { NOTIFICATION_RETENTION, getRetentionDays, calculateExpirationDate } from './entities/notification.entity.js';
export type { INotificationRepository } from './ports/notification-repository.port.js';
export type { IAuditService } from './ports/audit-service.port.js';
export type { IMetricsService } from './ports/metrics-service.port.js';
