/**
 * Home dashboard view with KPIs, activity feed, and chart widgets.
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Button,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  toastError,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks';
import { formatRelativeTime } from '@/utils';
import { KPICard, ActivityFeed, ChartWidget } from './home';

/**
 * Loading skeleton for KPI cards.
 */
function KPICardSkeleton(): ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for activity feed.
 */
function ActivityFeedSkeleton(): ReactNode {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for chart widget.
 */
function ChartWidgetSkeleton(): ReactNode {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Error state display for dashboard.
 */
function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): ReactNode {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
        <Button onClick={onRetry} variant="outline">
          {t('pages.home.retry')}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state display when no dashboard data.
 */
function DashboardEmpty(): ReactNode {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {t('pages.home.noData')}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * HomeView renders the main dashboard for authenticated users.
 * Displays KPI cards, activity feed, and trend charts.
 */
export function HomeView(): ReactNode {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading, error, lastUpdated, refresh } = useDashboard();

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch {
      toastError(t('pages.home.refreshError'));
    }
  };

  // Error state
  if (error && !data) {
    return (
      <PageContainer
        title={t('pages.home.title')}
        description={t('pages.home.description')}
      >
        <DashboardError message={error} onRetry={handleRefresh} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t('pages.home.title')}
      description={t('pages.home.description')}
    >
      {/* Header with welcome and refresh */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('pages.home.welcomeBack', { name: user?.firstName })}
          </h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('pages.home.lastUpdated', {
                time: formatRelativeTime(lastUpdated),
              })}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : t('pages.home.refresh')}
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <section className="mb-8">
        <h3 className="sr-only">{t('pages.home.kpiSection')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading && !data ? (
            Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
          ) : (data?.kpis?.length ?? 0) === 0 ? (
            <div className="col-span-full">
              <DashboardEmpty />
            </div>
          ) : (
            data?.kpis?.map((metric) => (
              <KPICard key={metric.id} metric={metric} />
            ))
          )}
        </div>
      </section>

      {/* Charts and Activity Grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charts - takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="sr-only">{t('pages.home.chartsSection')}</h3>
          {isLoading && !data ? (
            Array.from({ length: 2 }).map((_, i) => (
              <ChartWidgetSkeleton key={i} />
            ))
          ) : (data?.charts?.length ?? 0) === 0 ? null : (
            data?.charts?.map((chart) => (
              <ChartWidget key={chart.id} chart={chart} />
            ))
          )}
        </div>

        {/* Activity Feed - takes 1 column */}
        <div className="lg:col-span-1">
          <h3 className="sr-only">{t('pages.home.activitySection')}</h3>
          {isLoading && !data ? (
            <ActivityFeedSkeleton />
          ) : (
            <ActivityFeed activities={data?.activities ?? []} />
          )}
        </div>
      </section>
    </PageContainer>
  );
}
