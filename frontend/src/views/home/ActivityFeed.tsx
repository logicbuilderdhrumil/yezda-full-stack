/**
 * Activity Feed component for displaying recent activity items.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/utils';
import type { ActivityItem, ActivityType } from '@/@types';

interface ActivityFeedProps {
  /** Activity items to display. */
  activities: ActivityItem[];
  /** Maximum number of items to show. */
  maxItems?: number;
  /** Optional className. */
  className?: string;
}

/**
 * Returns an emoji icon for activity type.
 */
function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case 'screening_started':
      return '🔍';
    case 'screening_completed':
      return '✅';
    case 'candidate_added':
      return '👤';
    case 'user_created':
      return '🆕';
    case 'org_updated':
      return '🏢';
    case 'report_generated':
      return '📊';
    case 'system':
    default:
      return '⚙️';
  }
}

/**
 * Single activity item row.
 */
function ActivityRow({ activity }: { activity: ActivityItem }): ReactNode {
  const content = (
    <div
      className={cn(
        'flex items-start gap-3 py-3 px-2 rounded-md',
        'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
        activity.href && 'cursor-pointer'
      )}
    >
      <span className="text-lg" role="img" aria-label={activity.type}>
        {getActivityIcon(activity.type)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {activity.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {activity.actor && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {activity.actor}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );

  if (activity.href) {
    return (
      <Link to={activity.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * ActivityFeed displays a list of recent activity items.
 */
export function ActivityFeed({
  activities,
  maxItems = 10,
  className,
}: ActivityFeedProps): ReactNode {
  const { t } = useTranslation();
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t('pages.home.recentActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {t('pages.home.noActivity')}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayedActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
