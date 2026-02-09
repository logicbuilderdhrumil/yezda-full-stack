import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications, useUnreadNotificationCount } from './useNotifications';
import { NotificationsService } from '@/services';
import type { Notification, NotificationListResponse } from '@/@types';

vi.mock('@/services', () => ({
  NotificationsService: {
    list: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    markAllAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
  },
}));

const mockNotificationsService = vi.mocked(NotificationsService, true);

describe('useNotifications', () => {
  const mockNotification: Notification = {
    id: 'notif-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    userType: 'user',
    type: 'SYSTEM',
    priority: 'normal',
    title: 'Test Notification',
    body: 'This is a test notification',
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
    mockNotificationsService.list.mockResolvedValue(mockListResponse);
  });

  describe('initial state and fetch', () => {
    it('starts with loading state and fetches notifications on mount', async () => {
      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.notifications).toEqual([]);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockNotificationsService.list).toHaveBeenCalledTimes(1);
      expect(result.current.notifications).toEqual([mockNotification]);
      expect(result.current.total).toBe(1);
    });

    it('sets error state on fetch failure', async () => {
      mockNotificationsService.list.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.notifications).toEqual([]);
    });
  });

  describe('notification actions', () => {
    it('markAsRead updates notification status', async () => {
      const readNotification = { ...mockNotification, status: 'read' as const };
      mockNotificationsService.markAsRead.mockResolvedValue(readNotification);

      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(result.current.notifications[0]?.status).toBe('read');
    });

    it('markAsUnread updates notification status', async () => {
      const readNotification = { ...mockNotification, status: 'read' as const };
      mockNotificationsService.list.mockResolvedValueOnce({
        ...mockListResponse,
        notifications: [readNotification],
      });
      mockNotificationsService.markAsUnread.mockResolvedValue(mockNotification);

      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsUnread('notif-1');
      });

      expect(mockNotificationsService.markAsUnread).toHaveBeenCalledWith('notif-1');
      expect(result.current.notifications[0]?.status).toBe('unread');
    });

    it('markAllAsRead marks all notifications as read', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue({ count: 1 });

      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalled();
      expect(result.current.notifications[0]?.status).toBe('read');
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('handleRealtimeNotification', () => {
    it('adds new notification to the list', async () => {
      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newNotification: Notification = {
        id: 'notif-2',
        tenantId: 'tenant-1',
        userId: 'user-1',
        userType: 'user',
        type: 'APPLICATION',
        priority: 'high',
        title: 'New Notification',
        body: 'Real-time notification',
        status: 'unread',
        createdAt: '2026-01-15T11:00:00Z',
      };

      act(() => {
        result.current.handleRealtimeNotification(newNotification);
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.notifications[0]).toEqual(newNotification);
    });

    it('updates existing notification in the list', async () => {
      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedNotification = { ...mockNotification, title: 'Updated Title' };

      act(() => {
        result.current.handleRealtimeNotification(updatedNotification);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]?.title).toBe('Updated Title');
    });
  });

  describe('pagination', () => {
    it('refresh resets cursor and refetches', async () => {
      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockNotificationsService.list).toHaveBeenCalledTimes(2);
    });

    it('loadMore fetches more notifications when hasMore is true', async () => {
      mockNotificationsService.list.mockResolvedValueOnce({
        notifications: [mockNotification],
        total: 2,
        hasMore: true,
        nextCursor: 'cursor-1',
      });

      const secondNotification = { ...mockNotification, id: 'notif-2' };
      mockNotificationsService.list.mockResolvedValueOnce({
        notifications: [secondNotification],
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => useNotifications({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.notifications).toHaveLength(2);
    });
  });
});

describe('useUnreadNotificationCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches unread count on mount', async () => {
    mockNotificationsService.getUnreadCount.mockResolvedValue({ count: 5 });

    const { result } = renderHook(() => useUnreadNotificationCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(5);
  });

  it('provides refresh function', async () => {
    mockNotificationsService.getUnreadCount.mockResolvedValue({ count: 3 });

    const { result } = renderHook(() => useUnreadNotificationCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockNotificationsService.getUnreadCount.mockResolvedValue({ count: 7 });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.count).toBe(7);
  });
});
