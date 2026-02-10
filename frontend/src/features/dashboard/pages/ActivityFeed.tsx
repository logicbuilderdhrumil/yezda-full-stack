/**
 * Activity Feed component for displaying recent activity items.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  CheckCircle2,
  UserPlus,
  Sparkles,
  Building2,
  BarChart3,
  Settings,
} from 'lucide-react';
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
 * Returns a Lucide icon for activity type.
 */
function getActivityIcon(type: ActivityType): ReactNode {
  const iconClass = 'h-5 w-5 text-[var(--color-cta)]';
  switch (type) {
    case 'screening_started':
      return <Search className={iconClass} />;
    case 'screening_completed':
      return <CheckCircle2 className={iconClass} />;
    case 'candidate_added':
      return <UserPlus className={iconClass} />;
    case 'user_created':
      return <Sparkles className={iconClass} />;
    case 'org_updated':
      return <Building2 className={iconClass} />;
    case 'report_generated':
      return <BarChart3 className={iconClass} />;
    case 'system':
    default:
      return <Settings className={iconClass} />;
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
        'hover:bg-[var(--color-muted)] transition-colors',
        activity.href && 'cursor-pointer'
      )}
    >
      <span className="text-lg flex items-center" aria-label={activity.type}>
        {getActivityIcon(activity.type)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-foreground)] truncate">
          {activity.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {activity.actor && (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {activity.actor}
            </span>
          )}
          <span className="text-xs text-[var(--color-muted-foreground)]">
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
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            {t('pages.home.noActivity')}
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {displayedActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
