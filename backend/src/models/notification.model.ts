/**
 * Notification Models
 * Task 1.1: Define notification model and retention rules
 */

/** Notification types supported by the system */
export type NotificationType =
  | 'SYSTEM'           // Platform announcements
  | 'APPLICATION'      // Application status updates
  | 'SCREENING'        // Screening-related notifications
  | 'DOCUMENT'         // Document upload/verification
  | 'MESSAGE'          // Chat/messaging notifications
  | 'SECURITY'         // Security alerts (login, password change)
  | 'REMINDER';        // Reminder/deadline notifications

/** Notification priority levels */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Notification read status */
export type NotificationStatus = 'unread' | 'read';

/**
 * Main notification entity stored in the database
 */
export interface Notification {
  /** Unique notification identifier */
  id: string;
  /** Tenant this notification belongs to */
  tenantId: string;
  /** User who receives this notification */
  userId: string;
  /** Type of user (user or candidate) */
  userType: 'user' | 'candidate';
  /** Type of notification */
  type: NotificationType;
  /** Priority level */
  priority: NotificationPriority;
  /** Short title for the notification */
  title: string;
  /** Detailed message body */
  body: string;
  /** Current read status */
  status: NotificationStatus;
  /** Optional link to navigate to */
  actionUrl?: string;
  /** Optional metadata for the notification */
  metadata?: Record<string, unknown>;
  /** When the notification was created */
  createdAt: Date;
  /** When the notification was read (if applicable) */
  readAt?: Date;
  /** When the notification expires (for auto-cleanup) */
  expiresAt?: Date;
}

/**
 * Input for creating a new notification
 */
export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  ttlDays?: number; // Custom TTL in days (default: retention policy)
}

/**
 * Filters for listing notifications
 */
export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  since?: Date;
}

/**
 * Pagination options
 */
export interface NotificationPaginationOptions {
  limit?: number;
  cursor?: string; // ISO timestamp of last notification
}

/**
 * Paginated notification list result
 */
export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Result for notification operations
 */
export interface NotificationOperationResult {
  success: boolean;
  data?: Notification | NotificationListResult | { count: number };
  error?: string;
  errorCode?: string;
}

/**
 * Notification audit event types
 */
export type NotificationAuditEventType =
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_UNREAD'
  | 'NOTIFICATION_LIST_ACCESSED'
  | 'NOTIFICATION_DETAIL_ACCESSED'
  | 'NOTIFICATION_ACCESS_DENIED'
  | 'NOTIFICATION_BATCH_MARKED_READ';

/**
 * Retention policy configuration
 * Defines how long notifications are kept before auto-cleanup
 */
export const NOTIFICATION_RETENTION = {
  /** Default retention period in days */
  DEFAULT_RETENTION_DAYS: 90,
  /** Retention period for security notifications (longer for audit purposes) */
  SECURITY_RETENTION_DAYS: 365,
  /** Retention period for system announcements */
  SYSTEM_RETENTION_DAYS: 30,
  /** Maximum retention period allowed */
  MAX_RETENTION_DAYS: 730, // 2 years
  /** Minimum retention period allowed */
  MIN_RETENTION_DAYS: 7,
} as const;

/**
 * Get retention days based on notification type
 */
export function getRetentionDays(type: NotificationType): number {
  switch (type) {
    case 'SECURITY':
      return NOTIFICATION_RETENTION.SECURITY_RETENTION_DAYS;
    case 'SYSTEM':
      return NOTIFICATION_RETENTION.SYSTEM_RETENTION_DAYS;
    default:
      return NOTIFICATION_RETENTION.DEFAULT_RETENTION_DAYS;
  }
}

/**
 * Calculate expiration date based on notification type
 */
export function calculateExpirationDate(type: NotificationType, ttlDays?: number): Date {
  const retentionDays = ttlDays ?? getRetentionDays(type);
  const clampedDays = Math.min(
    Math.max(retentionDays, NOTIFICATION_RETENTION.MIN_RETENTION_DAYS),
    NOTIFICATION_RETENTION.MAX_RETENTION_DAYS
  );
  return new Date(Date.now() + clampedDays * 24 * 60 * 60 * 1000);
}
