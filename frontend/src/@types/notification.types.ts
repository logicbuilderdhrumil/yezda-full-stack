/**
 * Notification type definitions
 * Task 1.1: Define notification data model
 */

/** Notification types supported by the system */
export type NotificationType =
  | 'SYSTEM'
  | 'APPLICATION'
  | 'SCREENING'
  | 'DOCUMENT'
  | 'MESSAGE'
  | 'SECURITY'
  | 'REMINDER';

/** Notification priority levels */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Notification read status */
export type NotificationStatus = 'unread' | 'read';

/**
 * Notification entity from the API
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
  createdAt: string;
  /** When the notification was read (if applicable) */
  readAt?: string;
  /** When the notification expires (for auto-cleanup) */
  expiresAt?: string;
}

/**
 * Filters for listing notifications
 */
export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  since?: string;
}

/**
 * Pagination options for notification list
 */
export interface NotificationPaginationOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Paginated notification list response
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Mark many as read request body
 */
export interface MarkManyAsReadRequest {
  ids?: string[];
}

/**
 * Notification list column definition
 */
export interface NotificationColumn {
  key: keyof Notification | 'actions';
  label: string;
  width?: string;
  sortable?: boolean;
}

/**
 * Default columns for notification list
 */
export const NOTIFICATION_COLUMNS: NotificationColumn[] = [
  { key: 'status', label: 'Status', width: '80px' },
  { key: 'type', label: 'Type', width: '120px' },
  { key: 'title', label: 'Title' },
  { key: 'priority', label: 'Priority', width: '100px' },
  { key: 'createdAt', label: 'Date', width: '150px' },
  { key: 'actions', label: '', width: '80px' },
];

/**
 * Notification type display configuration
 */
export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { label: string; icon: string }> = {
  SYSTEM: { label: 'System', icon: 'info' },
  APPLICATION: { label: 'Application', icon: 'file-text' },
  SCREENING: { label: 'Screening', icon: 'search' },
  DOCUMENT: { label: 'Document', icon: 'file' },
  MESSAGE: { label: 'Message', icon: 'message-circle' },
  SECURITY: { label: 'Security', icon: 'shield' },
  REMINDER: { label: 'Reminder', icon: 'bell' },
};

/**
 * Notification priority display configuration
 */
export const NOTIFICATION_PRIORITY_CONFIG: Record<NotificationPriority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Low', variant: 'secondary' },
  normal: { label: 'Normal', variant: 'default' },
  high: { label: 'High', variant: 'outline' },
  urgent: { label: 'Urgent', variant: 'destructive' },
};
