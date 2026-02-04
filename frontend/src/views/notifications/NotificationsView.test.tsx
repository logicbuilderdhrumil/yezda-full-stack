import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationsView } from './NotificationsView';
import { NotificationsService } from '@/services';
import type { Notification, NotificationListResponse } from '@/@types';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/services', () => ({
  NotificationsService: {
    list: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

const mockNotificationsService = vi.mocked(NotificationsService, true);

function renderWithRouter(children: React.ReactNode) {
  return render(<BrowserRouter>{children}</BrowserRouter>);
}

describe('NotificationsView', () => {
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
    mockNotificationsService.list.mockResolvedValue(mockListResponse);
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      // Delay the promise resolution to keep loading state visible
      mockNotificationsService.list.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithRouter(<NotificationsView />);

      // Check for skeleton elements (multiple loading placeholders)
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no notifications', async () => {
      mockNotificationsService.list.mockResolvedValue({
        notifications: [],
        total: 0,
        hasMore: false,
      });

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('All caught up!')).toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('shows error state on fetch failure', async () => {
      mockNotificationsService.list.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockNotificationsService.list.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Mock success on retry
      mockNotificationsService.list.mockResolvedValueOnce(mockListResponse);
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
      });
    });
  });

  describe('notifications list', () => {
    it('renders notification items', async () => {
      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
        expect(screen.getByText('This is a test notification body')).toBeInTheDocument();
      });
    });

    it('shows unread badge count', async () => {
      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('1 unread')).toBeInTheDocument();
      });
    });

    it('renders notification priority badge', async () => {
      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Normal')).toBeInTheDocument();
      });
    });
  });

  describe('mark as read functionality', () => {
    it('calls markAsRead when clicking notification', async () => {
      const readNotification = { ...mockNotification, status: 'read' as const };
      mockNotificationsService.markAsRead.mockResolvedValue(readNotification);

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
      });

      // Click the notification
      fireEvent.click(screen.getByText('Test Notification'));

      await waitFor(() => {
        expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith('notif-1');
      });
    });

    it('shows toast on mark as read failure', async () => {
      const toast = await import('react-hot-toast');
      mockNotificationsService.markAsRead.mockRejectedValue(new Error('Failed'));

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test Notification'));

      await waitFor(() => {
        expect(toast.default.error).toHaveBeenCalledWith('Failed to update notification');
      });
    });
  });

  describe('mark all as read', () => {
    it('calls markAllAsRead when clicking the button', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue({ count: 1 });

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));

      await waitFor(() => {
        expect(mockNotificationsService.markAllAsRead).toHaveBeenCalled();
      });
    });

    it('hides mark all button when no unread notifications', async () => {
      mockNotificationsService.list.mockResolvedValue({
        notifications: [{ ...mockNotification, status: 'read' as const }],
        total: 1,
        hasMore: false,
      });

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has screen reader text for unread status', async () => {
      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Unread notification')).toBeInTheDocument();
      });
    });

    it('notification items are keyboard accessible', async () => {
      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
      });

      const notificationItem = screen.getByRole('button', { name: /test notification/i });
      expect(notificationItem).toHaveAttribute('tabindex', '0');
    });
  });

  describe('load more', () => {
    it('shows load more button when hasMore is true', async () => {
      mockNotificationsService.list.mockResolvedValue({
        ...mockListResponse,
        hasMore: true,
        nextCursor: 'cursor-1',
      });

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
      });
    });

    it('fetches more notifications when clicking load more', async () => {
      mockNotificationsService.list
        .mockResolvedValueOnce({
          notifications: [mockNotification],
          total: 2,
          hasMore: true,
          nextCursor: 'cursor-1',
        })
        .mockResolvedValueOnce({
          notifications: [{ ...mockNotification, id: 'notif-2', title: 'Second Notification' }],
          total: 2,
          hasMore: false,
        });

      renderWithRouter(<NotificationsView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /load more/i }));

      await waitFor(() => {
        expect(screen.getByText('Second Notification')).toBeInTheDocument();
      });
    });
  });
});
