/**
 * Notifications View
 * Task 1.2: Build notifications list view
 * Task 1.3: Add read/unread state indicators
 * Task 1.4: Add mark-as-read and mark-all-as-read actions
 * Task 1.7: Add loading, empty, and error states
 */

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageContainer } from '@/components/layouts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@/components/ui';
import { NotificationsService } from '@/services';
import { formatRelativeTime, cn } from '@/utils';
import type {
  Notification,
  NotificationFilters,
  NotificationType,
  NotificationPriority,
} from '@/@types';
import { NOTIFICATION_TYPE_CONFIG, NOTIFICATION_PRIORITY_CONFIG } from '@/@types';

/** State for the notifications view */
interface NotificationsState {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
  nextCursor: string | undefined;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

/** Initial state */
const initialState: NotificationsState = {
  notifications: [],
  total: 0,
  hasMore: false,
  nextCursor: undefined,
  isLoading: true,
  isLoadingMore: false,
  error: null,
};

/**
 * Get badge variant for notification priority
 */
function getPriorityVariant(priority: NotificationPriority): 'default' | 'secondary' | 'destructive' | 'outline' {
  return NOTIFICATION_PRIORITY_CONFIG[priority]?.variant ?? 'default';
}

/**
 * Get display label for notification type
 */
function getTypeLabel(type: NotificationType): string {
  return NOTIFICATION_TYPE_CONFIG[type]?.label ?? type;
}

/**
 * Get icon for notification type
 */
function getTypeIcon(type: NotificationType): ReactNode {
  const iconName = NOTIFICATION_TYPE_CONFIG[type]?.icon ?? 'bell';
  
  // Simple icon mapping using SVG
  const icons: Record<string, ReactNode> = {
    info: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'file-text': (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    search: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    file: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    'message-circle': (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    shield: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bell: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  };

  return icons[iconName] ?? icons.bell;
}

/**
 * Notification item component
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onClick,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onClick: (notification: Notification) => void;
}): ReactNode {
  const isUnread = notification.status === 'unread';

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        isUnread && 'bg-blue-50/50 dark:bg-blue-900/10'
      )}
      onClick={() => onClick(notification)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(notification);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 pt-1">
        <div
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            isUnread ? 'bg-blue-500' : 'bg-transparent'
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{isUnread ? 'Unread notification' : 'Read notification'}</span>
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5 text-gray-500 dark:text-gray-400">
        {getTypeIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={cn(
              'text-sm truncate',
              isUnread
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'font-medium text-gray-700 dark:text-gray-300'
            )}
          >
            {notification.title}
          </h3>
          <Badge variant={getPriorityVariant(notification.priority)} className="text-xs">
            {NOTIFICATION_PRIORITY_CONFIG[notification.priority]?.label}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {notification.body}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
          <span>{getTypeLabel(notification.type)}</span>
          <span>·</span>
          <span>{formatRelativeTime(notification.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isUnread ? (
              <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                Mark as read
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onMarkAsUnread(notification.id)}>
                Mark as unread
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for notification items
 */
function NotificationSkeleton(): ReactNode {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton className="h-2.5 w-2.5 rounded-full" />
      <Skeleton className="h-4 w-4" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ filter }: { filter?: NotificationFilters }): ReactNode {
  const hasFilters = filter?.status || filter?.type || filter?.priority;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        {hasFilters ? 'No matching notifications' : 'All caught up!'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {hasFilters
          ? 'Try adjusting your filters to see more notifications.'
          : "You don't have any notifications at the moment."}
      </p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4 mb-4">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        Failed to load notifications
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline">
        Try again
      </Button>
    </div>
  );
}

/**
 * NotificationsView displays a list of user notifications with read/unread handling.
 */
export function NotificationsView(): ReactNode {
  const navigate = useNavigate();
  const [state, setState] = useState<NotificationsState>(initialState);
  const [filter, setFilter] = useState<NotificationFilters>({});
  const nextCursorRef = useRef<string | undefined>(undefined);

  // Keep ref in sync with state to avoid stale closures
  useEffect(() => {
    nextCursorRef.current = state.nextCursor;
  }, [state.nextCursor]);

  /**
   * Load notifications
   */
  const loadNotifications = useCallback(async (isLoadMore = false) => {
    setState((prev) => ({
      ...prev,
      isLoading: !isLoadMore,
      isLoadingMore: isLoadMore,
      error: null,
    }));

    try {
      // Use ref to get current cursor value, avoiding stale closures
      const currentCursor = nextCursorRef.current;
      const pagination = isLoadMore && currentCursor
        ? { limit: 20, cursor: currentCursor }
        : { limit: 20 };

      const result = await NotificationsService.list(filter, pagination);

      setState((prev) => ({
        ...prev,
        notifications: isLoadMore
          ? [...prev.notifications, ...result.notifications]
          : result.notifications,
        total: result.total,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: message,
      }));
    }
  }, [filter]);

  /**
   * Handle mark as read
   */
  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      const updated = await NotificationsService.markAsRead(id);
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? updated : n
        ),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      toast.error('Failed to update notification');
    }
  }, []);

  /**
   * Handle mark as unread
   */
  const handleMarkAsUnread = useCallback(async (id: string) => {
    try {
      const updated = await NotificationsService.markAsUnread(id);
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? updated : n
        ),
      }));
    } catch (err) {
      console.error('Failed to mark notification as unread:', err);
      toast.error('Failed to update notification');
    }
  }, []);

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await NotificationsService.markAllAsRead();
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({
          ...n,
          status: 'read' as const,
          readAt: new Date().toISOString(),
        })),
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to mark all as read');
    }
  }, []);

  /**
   * Handle notification click
   */
  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // Mark as read if unread
      if (notification.status === 'unread') {
        await handleMarkAsRead(notification.id);
      }

      // Navigate to action URL if present
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    },
    [handleMarkAsRead, navigate]
  );

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((newFilter: NotificationFilters) => {
    setFilter(newFilter);
  }, []);

  // Load notifications on mount and filter change
  useEffect(() => {
    loadNotifications();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = state.notifications.filter((n) => n.status === 'unread').length;

  return (
    <PageContainer
      title="Notifications"
      description="Stay updated with your latest alerts and messages"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <CardTitle>All Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} unread</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleFilterChange({})}>
                  All notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange({ status: 'unread' })}>
                  Unread only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange({ status: 'read' })}>
                  Read only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Loading state */}
          {state.isLoading && (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {state.error && !state.isLoading && (
            <ErrorState message={state.error} onRetry={() => loadNotifications()} />
          )}

          {/* Empty state */}
          {!state.isLoading &&
            !state.error &&
            state.notifications.length === 0 && <EmptyState filter={filter} />}

          {/* Notification list */}
          {!state.isLoading && !state.error && state.notifications.length > 0 && (
            <>
              {state.notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onClick={handleNotificationClick}
                />
              ))}

              {/* Load more */}
              {state.hasMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => loadNotifications(true)}
                    disabled={state.isLoadingMore}
                  >
                    {state.isLoadingMore ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
