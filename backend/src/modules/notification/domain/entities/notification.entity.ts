/**
 * Notification Domain Entities
 */

export type NotificationType = 'SYSTEM' | 'APPLICATION' | 'SCREENING' | 'DOCUMENT' | 'MESSAGE' | 'SECURITY' | 'REMINDER';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  status: NotificationStatus;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface CreateNotificationDto {
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  ttlDays?: number;
}

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  since?: Date;
}

export interface NotificationPaginationOptions {
  limit?: number;
  cursor?: string;
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface NotificationOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface NotificationContext {
  actorId: string;
  actorType: 'user' | 'candidate';
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

export type NotificationAuditEventType =
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_UNREAD'
  | 'NOTIFICATION_LIST_ACCESSED'
  | 'NOTIFICATION_DETAIL_ACCESSED'
  | 'NOTIFICATION_ACCESS_DENIED'
  | 'NOTIFICATION_BATCH_MARKED_READ';

export const NOTIFICATION_RETENTION = {
  DEFAULT_RETENTION_DAYS: 90,
  SECURITY_RETENTION_DAYS: 365,
  SYSTEM_RETENTION_DAYS: 30,
  MAX_RETENTION_DAYS: 730,
  MIN_RETENTION_DAYS: 7,
} as const;

export function getRetentionDays(type: NotificationType): number {
  switch (type) {
    case 'SECURITY': return NOTIFICATION_RETENTION.SECURITY_RETENTION_DAYS;
    case 'SYSTEM': return NOTIFICATION_RETENTION.SYSTEM_RETENTION_DAYS;
    default: return NOTIFICATION_RETENTION.DEFAULT_RETENTION_DAYS;
  }
}

export function calculateExpirationDate(type: NotificationType, ttlDays?: number): Date {
  const retentionDays = ttlDays ?? getRetentionDays(type);
  const clamped = Math.min(Math.max(retentionDays, NOTIFICATION_RETENTION.MIN_RETENTION_DAYS), NOTIFICATION_RETENTION.MAX_RETENTION_DAYS);
  return new Date(Date.now() + clamped * 86_400_000);
}
