/**
 * Notification Contracts
 * Shared notification types and payload schemas.
 */

/**
 * Notification types supported by the system.
 */
export type NotificationType =
  | 'SYSTEM'
  | 'APPLICATION'
  | 'SCREENING'
  | 'DOCUMENT'
  | 'MESSAGE'
  | 'SECURITY'
  | 'REMINDER';

/**
 * Notification priority levels.
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification read status.
 */
export type NotificationStatus = 'unread' | 'read';

/**
 * User type for notifications.
 */
export type NotificationUserType = 'user' | 'candidate';

/**
 * Notification entity returned from API.
 */
export interface Notification {
  /** Unique notification identifier */
  id: string;
  /** Tenant this notification belongs to */
  tenantId: string;
  /** User who receives this notification */
  userId: string;
  /** Type of user (user or candidate) */
  userType: NotificationUserType;
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
  createdAt: string;
  /** When the notification was read (if applicable) */
  readAt?: string;
  /** When the notification expires (for auto-cleanup) */
  expiresAt?: string;
}

/**
 * Socket notification payload (subset of full notification).
 */
export interface NotificationSocketPayload {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Filters for listing notifications.
 */
export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  since?: string;
}

/**
 * Notification list request parameters.
 */
export interface NotificationListRequest {
  limit?: number;
  cursor?: string;
  status?: NotificationStatus;
  type?: NotificationType;
}

/**
 * Notification list response.
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Unread count response.
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Mark notification(s) as read request.
 */
export interface MarkAsReadRequest {
  ids?: string[];
}

/**
 * Mark as read response.
 */
export interface MarkAsReadResponse {
  success: boolean;
  markedCount: number;
}
