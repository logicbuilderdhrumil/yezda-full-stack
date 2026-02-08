import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './NotificationsService';
import { ApiService } from '@/services/ApiService';
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/@types';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

vi.mock('@/services/ApiService');

const mockApiService = vi.mocked(ApiService, true);

/** Helper to create a mock AxiosResponse */
function mockAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

describe('NotificationsService', () => {
  const mockNotification: Notification = {
    id: 'notif-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    userType: 'user',
    type: 'SYSTEM',
    priority: 'normal',
    title: 'Test Notification',
    body: 'This is a test notification body',
    status: 'unread',
    createdAt: '2026-01-15T10:00:00Z',
  };

  const mockListResponse: NotificationListResponse = {
    notifications: [mockNotification],
    total: 1,
    hasMore: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('fetches notifications without filters', async () => {
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockListResponse));

      const result = await NotificationsService.list();

      expect(mockApiService.get).toHaveBeenCalledWith('notifications.list', { params: {} });
      expect(result).toEqual(mockListResponse);
    });

    it('fetches notifications with status filter', async () => {
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockListResponse));

      await NotificationsService.list({ status: 'unread' });

      expect(mockApiService.get).toHaveBeenCalledWith('notifications.list', {
        params: { status: 'unread' },
      });
    });

    it('fetches notifications with pagination', async () => {
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockListResponse));

      await NotificationsService.list({}, { limit: 10, cursor: 'cursor-abc' });

      expect(mockApiService.get).toHaveBeenCalledWith('notifications.list', {
        params: { limit: '10', cursor: 'cursor-abc' },
      });
    });

    it('fetches notifications with all filters and pagination', async () => {
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockListResponse));

      await NotificationsService.list(
        { status: 'read', type: 'APPLICATION', priority: 'high' },
        { limit: 5 }
      );

      expect(mockApiService.get).toHaveBeenCalledWith('notifications.list', {
        params: {
          status: 'read',
          type: 'APPLICATION',
          priority: 'high',
          limit: '5',
        },
      });
    });
  });

  describe('getById', () => {
    it('fetches a notification by ID', async () => {
      mockApiService.get.mockResolvedValue(mockAxiosResponse(mockNotification));

      const result = await NotificationsService.getById('notif-1');

      expect(mockApiService.get).toHaveBeenCalledWith('notifications.get', {
        pathParams: { id: 'notif-1' },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getUnreadCount', () => {
    it('fetches unread count', async () => {
      const countResponse: UnreadCountResponse = { count: 5 };
      mockApiService.get.mockResolvedValue(mockAxiosResponse(countResponse));

      const result = await NotificationsService.getUnreadCount();

      expect(mockApiService.get).toHaveBeenCalledWith('notifications.unreadCount');
      expect(result).toEqual(countResponse);
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      const readNotification: Notification = { ...mockNotification, status: 'read', readAt: '2026-01-15T11:00:00Z' };
      mockApiService.patch.mockResolvedValue(mockAxiosResponse(readNotification));

      const result = await NotificationsService.markAsRead('notif-1');

      expect(mockApiService.patch).toHaveBeenCalledWith('notifications.markAsRead', undefined, {
        pathParams: { id: 'notif-1' },
      });
      expect(result.status).toBe('read');
    });
  });

  describe('markAsUnread', () => {
    it('marks a notification as unread', async () => {
      const unreadNotification: Notification = { ...mockNotification, status: 'unread' };
      delete (unreadNotification as { readAt?: string }).readAt;
      mockApiService.patch.mockResolvedValue(mockAxiosResponse(unreadNotification));

      const result = await NotificationsService.markAsUnread('notif-1');

      expect(mockApiService.patch).toHaveBeenCalledWith('notifications.markAsUnread', undefined, {
        pathParams: { id: 'notif-1' },
      });
      expect(result.status).toBe('unread');
    });
  });

  describe('markManyAsRead', () => {
    it('marks specific notifications as read', async () => {
      mockApiService.post.mockResolvedValue(mockAxiosResponse({ count: 2 }));

      const result = await NotificationsService.markManyAsRead(['notif-1', 'notif-2']);

      expect(mockApiService.post).toHaveBeenCalledWith('notifications.markManyAsRead', {
        ids: ['notif-1', 'notif-2'],
      });
      expect(result.count).toBe(2);
    });

    it('marks all notifications as read when no IDs provided', async () => {
      mockApiService.post.mockResolvedValue(mockAxiosResponse({ count: 10 }));

      const result = await NotificationsService.markManyAsRead();

      expect(mockApiService.post).toHaveBeenCalledWith('notifications.markManyAsRead', {});
      expect(result.count).toBe(10);
    });
  });

  describe('markAllAsRead', () => {
    it('is a convenience method that calls markManyAsRead', async () => {
      mockApiService.post.mockResolvedValue(mockAxiosResponse({ count: 5 }));

      const result = await NotificationsService.markAllAsRead();

      expect(mockApiService.post).toHaveBeenCalledWith('notifications.markManyAsRead', {});
      expect(result.count).toBe(5);
    });
  });
});
