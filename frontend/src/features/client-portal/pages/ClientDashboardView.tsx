/**
 * ClientDashboardView displays org-scoped screening summary metrics
 * with KPI cards and a recent activity feed.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, CheckCircle, Clock } from 'lucide-react';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Button,
  Badge,
} from '@/components/ui';
import { ClientPortalService } from '@/services/ClientPortalService';
import type { ClientDashboardData, ClientActivityItem } from '@/services/ClientPortalService';
import { formatRelativeTime } from '@/utils';

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  description?: string;
}

/** A single KPI metric card. */
function MetricCard({ title, value, icon, description }: MetricCardProps): ReactNode {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Loading skeleton for metric cards. */
function MetricCardSkeleton(): ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32 mt-1" />
      </CardContent>
    </Card>
  );
}

/** Activity type to badge variant mapping. */
function getActivityBadge(type: string): { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' } {
  switch (type) {
    case 'screening_completed':
      return { label: 'Completed', variant: 'success' };
    case 'screening_started':
      return { label: 'Started', variant: 'default' };
    case 'candidate_submitted':
      return { label: 'Submitted', variant: 'secondary' };
    case 'action_required':
      return { label: 'Action Required', variant: 'warning' };
    default:
      return { label: type, variant: 'secondary' };
  }
}

interface ActivityItemRowProps {
  activity: ClientActivityItem;
  onCandidateClick?: (id: string) => void;
}

/** A single activity row. */
function ActivityItemRow({ activity, onCandidateClick }: ActivityItemRowProps): ReactNode {
  const badge = getActivityBadge(activity.type);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={badge.variant} className="text-[10px]">
            {badge.label}
          </Badge>
          {activity.candidateName && activity.candidateId && (
            <button
              type="button"
              className="text-xs text-primary hover:underline truncate"
              onClick={() => onCandidateClick?.(activity.candidateId!)}
            >
              {activity.candidateName}
            </button>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

/**
 * ClientDashboardView is the landing page for the client portal.
 * Shows org-scoped screening metrics and recent activity.
 */
export function ClientDashboardView(): ReactNode {
  const navigate = useNavigate();
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ClientPortalService.getDashboard();
      setData(result);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const handleCandidateClick = (id: string) => {
    navigate(`/candidates/${id}`);
  };

  if (error && !data) {
    return (
      <PageContainer title="Dashboard" description="Overview of your screening activity">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => void fetchDashboard()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard" description="Overview of your screening activity">
      {/* KPI Metric Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                title="Total Candidates"
                value={data?.totalCandidates ?? 0}
                icon={<Users className="h-5 w-5" />}
                description="All submitted candidates"
              />
              <MetricCard
                title="Active Screenings"
                value={data?.activeScreenings ?? 0}
                icon={<Shield className="h-5 w-5" />}
                description="Currently in progress"
              />
              <MetricCard
                title="Completed"
                value={data?.completedScreenings ?? 0}
                icon={<CheckCircle className="h-5 w-5" />}
                description="Successfully screened"
              />
              <MetricCard
                title="Pending Actions"
                value={data?.pendingActions ?? 0}
                icon={<Clock className="h-5 w-5" />}
                description="Awaiting your response"
              />
            </>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (data?.recentActivity?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No recent activity
              </p>
            ) : (
              <div>
                {data?.recentActivity.map((activity) => (
                  <ActivityItemRow
                    key={activity.id}
                    activity={activity}
                    onCandidateClick={handleCandidateClick}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </PageContainer>
  );
}
