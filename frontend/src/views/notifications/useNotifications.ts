/**
 * Notifications Hook
 * Task 1.6: Connect realtime notifications channel (Firebase or socket)
 * 
 * This hook provides a realtime integration point for notifications.
 * It currently uses polling as a fallback and can be extended with
 * Socket.IO or Firebase listeners when those infrastructures are ready.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationsService } from '@/services';
import type {
  Notification,
  NotificationFilters,
  NotificationListResponse,
} from '@/@types';

/** Configuration for the notifications hook */
export interface UseNotificationsConfig {
  /** Enable automatic polling for updates (default: true) */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 30000) */
  pollingInterval?: number;
  /** Filters to apply when fetching notifications */
  filters?: NotificationFilters;
  /** Number of notifications to fetch per page */
  pageSize?: number;
}

/** State returned by the useNotifications hook */
export interface UseNotificationsState {
  /** List of notifications */
  notifications: Notification[];
  /** Total count of notifications */
  total: number;
  /** Unread notification count */
  unreadCount: number;
  /** Whether there are more notifications to load */
  hasMore: boolean;
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Loading state for load more action */
  isLoadingMore: boolean;
  /** Error message if any */
  error: string | null;
}

/** Actions returned by the useNotifications hook */
export interface UseNotificationsActions {
  /** Refresh the notifications list */
  refresh: () => Promise<void>;
  /** Load more notifications */
  loadMore: () => Promise<void>;
  /** Mark a notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark a notification as unread */
  markAsUnread: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
}

/** Return type for useNotifications hook */
export type UseNotificationsReturn = UseNotificationsState & UseNotificationsActions;

/** Default configuration */
const DEFAULT_CONFIG: Required<UseNotificationsConfig> = {
  enablePolling: true,
  pollingInterval: 30000,
  filters: {},
  pageSize: 20,
};

/**
 * Hook for managing notifications with realtime updates support.
 * 
 * @example
 * ```tsx
 * function NotificationsList() {
 *   const {
 *     notifications,
 *     unreadCount,
 *     isLoading,
 *     markAsRead,
 *     refresh,
 *   } = useNotifications();
 * 
 *   if (isLoading) return <Spinner />;
 * 
 *   return (
 *     <ul>
 *       {notifications.map(n => (
 *         <li key={n.id} onClick={() => markAsRead(n.id)}>
 *           {n.title}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useNotifications(config: UseNotificationsConfig = {}): UseNotificationsReturn {
  const {
    enablePolling,
    pollingInterval,
    filters,
    pageSize,
  } = { ...DEFAULT_CONFIG, ...config };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch notifications from the API
   */
  const fetchNotifications = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const pagination = isLoadMore && nextCursor
        ? { limit: pageSize, cursor: nextCursor }
        : { limit: pageSize };

      const result: NotificationListResponse = await NotificationsService.list(filters, pagination);

      setNotifications((prev) =>
        isLoadMore ? [...prev, ...result.notifications] : result.notifications
      );
      setTotal(result.total);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);

      // Calculate unread count from fetched notifications
      const unread = isLoadMore
        ? [...notifications, ...result.notifications].filter((n) => n.status === 'unread').length
        : result.notifications.filter((n) => n.status === 'unread').length;
      setUnreadCount(unread);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, pageSize, nextCursor, notifications]);

  /**
   * Refresh notifications (reset and fetch fresh)
   */
  const refresh = useCallback(async () => {
    setNextCursor(undefined);
    await fetchNotifications(false);
  }, [fetchNotifications]);

  /**
   * Load more notifications
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchNotifications(true);
  }, [hasMore, isLoadingMore, fetchNotifications]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      const updated = await NotificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  /**
   * Mark a notification as unread
   */
  const markAsUnread = useCallback(async (id: string) => {
    try {
      const updated = await NotificationsService.markAsUnread(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to mark notification as unread:', err);
      throw err;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationsService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: 'read' as const,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, []);

  /**
   * Handle incoming realtime notification
   * This can be called from Socket.IO or Firebase listeners
   */
  const handleRealtimeNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      // Check if notification already exists
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) {
        // Update existing notification
        return prev.map((n) => (n.id === notification.id ? notification : n));
      }
      // Add new notification at the beginning
      return [notification, ...prev];
    });

    if (notification.status === 'unread') {
      setUnreadCount((prev) => prev + 1);
    }
    setTotal((prev) => prev + 1);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(false);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling for updates
  useEffect(() => {
    if (!enablePolling) return;

    pollingRef.current = setInterval(() => {
      fetchNotifications(false);
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enablePolling, pollingInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  // TODO: Add Socket.IO/Firebase listener integration
  // When socket-infra or firebase-integration is implemented, add:
  //
  // useEffect(() => {
  //   const socket = useSocket(); // from socket-infra
  //   socket.on('notification:new', handleRealtimeNotification);
  //   socket.on('notification:updated', handleRealtimeNotification);
  //   return () => {
  //     socket.off('notification:new');
  //     socket.off('notification:updated');
  //   };
  // }, [handleRealtimeNotification]);
  //
  // Or for Firebase:
  //
  // useEffect(() => {
  //   const unsubscribe = onMessage(messaging, (payload) => {
  //     if (payload.data?.type === 'notification') {
  //       handleRealtimeNotification(payload.data.notification);
  //     }
  //   });
  //   return () => unsubscribe();
  // }, [handleRealtimeNotification]);

  // Export handleRealtimeNotification for external callers
  // This allows integration with socket/firebase when ready
  (useNotifications as unknown as { handleRealtimeNotification: typeof handleRealtimeNotification }).handleRealtimeNotification = handleRealtimeNotification;

  return {
    notifications,
    total,
    unreadCount,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    refresh,
    loadMore,
    markAsRead,
    markAsUnread,
    markAllAsRead,
  };
}

/**
 * Hook for getting just the unread notification count.
 * Useful for notification badges in headers/nav.
 */
export function useUnreadNotificationCount(): {
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await NotificationsService.getUnreadCount();
      setCount(result.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { count, isLoading, refresh: fetchCount };
}
