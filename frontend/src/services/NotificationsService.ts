/**
 * Notifications Service
 * Task 1.5: Implement NotificationsService list/update methods
 */

import { ApiService } from '@/services/ApiService';
import type {
  Notification,
  NotificationFilters,
  NotificationPaginationOptions,
  NotificationListResponse,
  UnreadCountResponse,
  MarkManyAsReadRequest,
} from '@/@types';

/**
 * Build query string from filters and pagination options
 */
function buildQueryParams(
  filters?: NotificationFilters,
  pagination?: NotificationPaginationOptions
): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.type) {
    params.type = filters.type;
  }
  if (filters?.priority) {
    params.priority = filters.priority;
  }
  if (filters?.since) {
    params.since = filters.since;
  }
  if (pagination?.limit) {
    params.limit = String(pagination.limit);
  }
  if (pagination?.cursor) {
    params.cursor = pagination.cursor;
  }

  return params;
}

/**
 * NotificationsService handles all notification-related API operations.
 */
export const NotificationsService = {
  /**
   * List notifications for the authenticated user.
   * @param filters - Optional filters for status, type, priority, since
   * @param pagination - Optional pagination with limit and cursor
   * @returns Paginated list of notifications
   */
  async list(
    filters?: NotificationFilters,
    pagination?: NotificationPaginationOptions
  ): Promise<NotificationListResponse> {
    const params = buildQueryParams(filters, pagination);
    const response = await ApiService.get<NotificationListResponse>(
      'notifications.list',
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific notification by ID.
   * @param id - Notification ID
   * @returns The notification
   */
  async getById(id: string): Promise<Notification> {
    const response = await ApiService.get<Notification>(
      'notifications.get',
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Get unread notification count.
   * @returns Object containing the unread count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await ApiService.get<UnreadCountResponse>(
      'notifications.unreadCount'
    );
    return response.data;
  },

  /**
   * Mark a notification as read.
   * @param id - Notification ID
   * @returns The updated notification
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await ApiService.patch<Notification>(
      'notifications.markAsRead',
      undefined,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Mark a notification as unread.
   * @param id - Notification ID
   * @returns The updated notification
   */
  async markAsUnread(id: string): Promise<Notification> {
    const response = await ApiService.patch<Notification>(
      'notifications.markAsUnread',
      undefined,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Mark multiple notifications as read.
   * If no IDs provided, marks all unread notifications as read.
   * @param ids - Optional array of notification IDs
   * @returns Count of marked notifications
   */
  async markManyAsRead(ids?: string[]): Promise<{ count: number }> {
    const body: MarkManyAsReadRequest = ids ? { ids } : {};
    const response = await ApiService.post<{ count: number }>(
      'notifications.markManyAsRead',
      body
    );
    return response.data;
  },

  /**
   * Mark all unread notifications as read.
   * Convenience method that calls markManyAsRead without IDs.
   * @returns Count of marked notifications
   */
  async markAllAsRead(): Promise<{ count: number }> {
    return this.markManyAsRead();
  },
};
