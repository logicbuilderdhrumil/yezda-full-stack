/**
 * Notification Repository Port
 */
import type {
  Notification,
  CreateNotificationDto,
  NotificationFilters,
  NotificationPaginationOptions,
  NotificationStatus,
} from '../entities/notification.entity.js';

export interface INotificationRepository {
  create(input: CreateNotificationDto, expiresAt: Date): Promise<Notification>;
  findById(id: string): Promise<Notification | undefined>;
  findByIdForUser(id: string, tenantId: string, userId: string, userType: 'user' | 'candidate'): Promise<Notification | undefined>;
  list(tenantId: string, userId: string, userType: 'user' | 'candidate', filters: NotificationFilters, pagination: NotificationPaginationOptions): Promise<{ notifications: Notification[]; total: number }>;
  updateStatus(id: string, status: NotificationStatus, readAt?: Date): Promise<Notification | undefined>;
  markManyAsRead(tenantId: string, userId: string, userType: 'user' | 'candidate', ids?: string[]): Promise<number>;
  getUnreadCount(tenantId: string, userId: string, userType: 'user' | 'candidate'): Promise<number>;
  cleanupExpired(): Promise<number>;
}
