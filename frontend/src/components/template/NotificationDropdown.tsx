/**
 * Notification dropdown for header.
 * Shows recent notifications with badge for unread count.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ExternalLink } from 'lucide-react';
import { useUnreadNotificationCount, useNotifications } from '@/views/notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';
import type { Notification } from '@/@types';

export interface NotificationDropdownProps {
  /** Additional CSS classes. */
  className?: string;
  /** Maximum notifications to display in dropdown. */
  maxVisible?: number;
}

/**
 * NotificationDropdown displays a bell icon with unread count badge
 * and a dropdown showing recent notifications.
 */
export function NotificationDropdown({
  className,
  maxVisible = 5,
}: NotificationDropdownProps): ReactNode {
  const { t } = useTranslation();
  const { count: unreadCount } = useUnreadNotificationCount();
  const { notifications, markAsRead, markAllAsRead, isLoading } = useNotifications({
    pageSize: maxVisible,
    enablePolling: true,
    pollingInterval: 60000,
  });

  const visibleNotifications = notifications.slice(0, maxVisible);
  const hasNotifications = visibleNotifications.length > 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    return t('time.daysAgo', { count: diffDays });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'relative p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            className
          )}
          aria-label={t('notifications.title')}
          data-testid="notification-dropdown-trigger"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
              data-testid="notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('notifications.title')}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              {t('notifications.markAllRead')}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">
            {t('common.loading')}
          </div>
        ) : hasNotifications ? (
          <>
            {visibleNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex flex-col items-start gap-1 py-3 cursor-pointer',
                  notification.status === 'unread' && 'bg-blue-50/50 dark:bg-blue-900/10'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="font-medium text-sm line-clamp-1">
                    {notification.title}
                  </span>
                  {notification.status === 'unread' && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {notification.body}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatTimeAgo(notification.createdAt)}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/notifications"
                className="flex items-center justify-center gap-2 py-2 text-primary cursor-pointer"
              >
                <span>{t('notifications.viewAll')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <div className="py-6 text-center text-sm text-gray-500">
            {t('notifications.empty')}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
