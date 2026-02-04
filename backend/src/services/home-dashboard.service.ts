/**
 * Home Dashboard Service
 * Task 1.2: Implement dashboard summary and activity endpoints
 * Task 1.4: Enforce tenant scoping for dashboard endpoints
 * Task 1.5: Add audit logging for dashboard data access
 * Task 1.6: Add caching for dashboard endpoints
 */

import { auditService } from './audit.service.js';
import { dashboardMetricsService } from './home-dashboard-metrics.service.js';
import { cacheGet, cacheSet } from '../db/redis.js';
import type {
  KpiSummary,
  KpiMetric,
  KpiMetricType,
  ActivityFeed,
  ActivityItem,
  ActivityType,
  TrendData,
  TrendSeries,
  DashboardSummary,
  DashboardOperationResult,
  DashboardTimeRange,
  DashboardAuditEventType,
} from '../models/home-dashboard.model.js';
import type { AuditEventType } from '../models/audit.model.js';

/** Cache TTL in seconds */
const CACHE_TTL_SECONDS = 60; // 1 minute for dashboard data (real-time-ish)
const ACTIVITY_CACHE_TTL_SECONDS = 30; // 30 seconds for activity feed

/** Request context for audit logging */
interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

/** Actor context for audit logging */
interface ActorContext {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
}

/**
 * Generate mock KPI metrics for demonstration
 * In production, this would aggregate real data from various sources
 */
function generateMockKpis(timeRange: DashboardTimeRange): KpiMetric[] {
  const baseMultiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  return [
    {
      type: 'active_users',
      label: 'Active Users',
      value: Math.floor(150 * baseMultiplier * (0.8 + Math.random() * 0.4)),
      trend: {
        direction: 'up',
        percentage: 12.5,
        comparisonPeriod: `previous ${timeRange}`,
      },
    },
    {
      type: 'new_signups',
      label: 'New Signups',
      value: Math.floor(25 * baseMultiplier * (0.8 + Math.random() * 0.4)),
      trend: {
        direction: 'up',
        percentage: 8.3,
        comparisonPeriod: `previous ${timeRange}`,
      },
    },
    {
      type: 'pending_tasks',
      label: 'Pending Tasks',
      value: Math.floor(45 * (0.8 + Math.random() * 0.4)),
      trend: {
        direction: 'down',
        percentage: 5.2,
        comparisonPeriod: `previous ${timeRange}`,
      },
    },
    {
      type: 'completed_tasks',
      label: 'Completed Tasks',
      value: Math.floor(120 * baseMultiplier * (0.8 + Math.random() * 0.4)),
      trend: {
        direction: 'up',
        percentage: 15.8,
        comparisonPeriod: `previous ${timeRange}`,
      },
    },
    {
      type: 'open_tickets',
      label: 'Open Tickets',
      value: Math.floor(18 * (0.8 + Math.random() * 0.4)),
      trend: {
        direction: 'stable',
        percentage: 0.5,
        comparisonPeriod: `previous ${timeRange}`,
      },
    },
    {
      type: 'avg_response_time',
      label: 'Avg Response Time',
      value: Math.floor(2.5 * 60 * (0.9 + Math.random() * 0.2)), // in seconds
      unit: 'seconds',
      trend: {
        direction: 'down',
        percentage: 10.2,
        comparisonPeriod: `previous ${timeRange}`,
      },
    },
  ];
}

/**
 * Generate mock activity items for demonstration
 * In production, this would fetch real activity from various sources
 */
function generateMockActivityItems(limit: number): ActivityItem[] {
  const activityTypes: ActivityType[] = [
    'user_signup',
    'task_completed',
    'task_created',
    'ticket_opened',
    'ticket_resolved',
    'user_login',
  ];

  const items: ActivityItem[] = [];
  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const timestamp = new Date(now - i * 300000 - Math.random() * 60000); // 5 min intervals with jitter

    items.push({
      id: `activity-${i + 1}`,
      type,
      title: getActivityTitle(type),
      description: getActivityDescription(type),
      actorId: `user-${Math.floor(Math.random() * 100)}`,
      actorName: `User ${Math.floor(Math.random() * 100)}`,
      timestamp,
    });
  }

  return items;
}

function getActivityTitle(type: ActivityType): string {
  switch (type) {
    case 'user_signup':
      return 'New user registered';
    case 'task_completed':
      return 'Task completed';
    case 'task_created':
      return 'New task created';
    case 'ticket_opened':
      return 'Support ticket opened';
    case 'ticket_resolved':
      return 'Ticket resolved';
    case 'user_login':
      return 'User logged in';
    default:
      return 'Activity recorded';
  }
}

function getActivityDescription(type: ActivityType): string {
  switch (type) {
    case 'user_signup':
      return 'A new user has completed registration';
    case 'task_completed':
      return 'A task has been marked as complete';
    case 'task_created':
      return 'A new task has been added to the queue';
    case 'ticket_opened':
      return 'A user has submitted a support request';
    case 'ticket_resolved':
      return 'A support ticket has been resolved';
    case 'user_login':
      return 'User authenticated successfully';
    default:
      return 'An activity has been recorded';
  }
}

/**
 * Generate mock trend data for charting
 */
function generateMockTrendData(
  timeRange: DashboardTimeRange,
  metrics: KpiMetricType[],
  aggregation: 'hourly' | 'daily' | 'weekly'
): TrendSeries[] {
  const now = Date.now();
  const msPerPoint =
    aggregation === 'hourly' ? 3600000 : aggregation === 'daily' ? 86400000 : 604800000;

  const rangeMs =
    timeRange === '24h'
      ? 86400000
      : timeRange === '7d'
        ? 604800000
        : timeRange === '30d'
          ? 2592000000
          : 7776000000;

  const points = Math.ceil(rangeMs / msPerPoint);

  return metrics.map((metric) => {
    const baseValue = metric === 'active_users' ? 100 : metric === 'new_signups' ? 20 : 50;

    return {
      metric,
      label: metric.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      aggregation,
      data: Array.from({ length: Math.min(points, 100) }, (_, i) => ({
        timestamp: new Date(now - (points - i - 1) * msPerPoint),
        value: Math.floor(baseValue * (0.8 + Math.random() * 0.4)),
      })),
    };
  });
}

export class DashboardService {
  /**
   * Get KPI summary metrics
   */
  async getSummary(
    timeRange: DashboardTimeRange,
    requestedMetrics: KpiMetricType[] | undefined,
    activityLimit: number,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<DashboardOperationResult<DashboardSummary>> {
    const start = Date.now();

    try {
      // Try cache first
      const cacheKey = `dashboard:summary:${actor.tenantId}:${timeRange}:${activityLimit}`;
      const cached = await cacheGet<DashboardSummary>(cacheKey);

      if (cached) {
        dashboardMetricsService.recordCacheHit(true);
        dashboardMetricsService.recordSummary(true, Date.now() - start);

        this.logDashboardEvent('DASHBOARD_SUMMARY_ACCESSED', {
          actor,
          success: true,
          metadata: { cached: true, timeRange },
          ...requestContext,
        });

        return { success: true, data: cached };
      }

      dashboardMetricsService.recordCacheHit(false);

      // Generate/fetch KPI metrics
      let kpis = generateMockKpis(timeRange);

      // Filter by requested metrics if specified
      if (requestedMetrics && requestedMetrics.length > 0) {
        kpis = kpis.filter((kpi) => requestedMetrics.includes(kpi.type));
      }

      // Get recent activity
      const recentActivity = generateMockActivityItems(activityLimit);

      const summary: DashboardSummary = {
        tenantId: actor.tenantId,
        timestamp: new Date(),
        timeRange,
        kpis,
        recentActivity,
        activityTotal: 100, // Mock total
      };

      // Cache the result
      await cacheSet(cacheKey, summary, CACHE_TTL_SECONDS * 1000);

      this.logDashboardEvent('DASHBOARD_SUMMARY_ACCESSED', {
        actor,
        success: true,
        metadata: { timeRange, metricsCount: kpis.length, activityCount: recentActivity.length },
        ...requestContext,
      });

      dashboardMetricsService.recordSummary(true, Date.now() - start);

      return { success: true, data: summary };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logDashboardEvent('DASHBOARD_SUMMARY_ACCESSED', {
        actor,
        success: false,
        errorMessage,
        ...requestContext,
      });

      dashboardMetricsService.recordSummary(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve dashboard summary',
        errorCode: 'DASHBOARD_SUMMARY_ERROR',
      };
    }
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(
    limit: number,
    cursor: string | undefined,
    types: ActivityType[] | undefined,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<DashboardOperationResult<ActivityFeed>> {
    const start = Date.now();

    try {
      // Try cache first (without cursor for consistency)
      const cacheKey = `dashboard:activity:${actor.tenantId}:${limit}:${types?.join(',') || 'all'}`;
      const useCache = !cursor; // Only cache first page

      if (useCache) {
        const cached = await cacheGet<ActivityFeed>(cacheKey);

        if (cached) {
          dashboardMetricsService.recordCacheHit(true);
          dashboardMetricsService.recordActivity(true, Date.now() - start);

          this.logDashboardEvent('DASHBOARD_ACTIVITY_ACCESSED', {
            actor,
            success: true,
            metadata: { cached: true, limit },
            ...requestContext,
          });

          return { success: true, data: cached };
        }
      }

      dashboardMetricsService.recordCacheHit(false);

      // Generate activity items
      let items = generateMockActivityItems(limit + 1);

      // Filter by types if specified
      if (types && types.length > 0) {
        items = items.filter((item) => types.includes(item.type));
      }

      const hasMore = items.length > limit;
      const resultItems = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].timestamp.toISOString()
        : undefined;

      const feed: ActivityFeed = {
        tenantId: actor.tenantId,
        items: resultItems,
        total: 100, // Mock total
        hasMore,
        nextCursor,
      };

      // Cache first page
      if (useCache) {
        await cacheSet(cacheKey, feed, ACTIVITY_CACHE_TTL_SECONDS * 1000);
      }

      this.logDashboardEvent('DASHBOARD_ACTIVITY_ACCESSED', {
        actor,
        success: true,
        metadata: { limit, itemCount: resultItems.length },
        ...requestContext,
      });

      dashboardMetricsService.recordActivity(true, Date.now() - start);

      return { success: true, data: feed };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logDashboardEvent('DASHBOARD_ACTIVITY_ACCESSED', {
        actor,
        success: false,
        errorMessage,
        ...requestContext,
      });

      dashboardMetricsService.recordActivity(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve activity feed',
        errorCode: 'DASHBOARD_ACTIVITY_ERROR',
      };
    }
  }

  /**
   * Get trend data for charts
   */
  async getTrends(
    timeRange: DashboardTimeRange,
    metrics: KpiMetricType[],
    aggregation: 'hourly' | 'daily' | 'weekly',
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<DashboardOperationResult<TrendData>> {
    const start = Date.now();

    try {
      // Try cache first
      const cacheKey = `dashboard:trends:${actor.tenantId}:${timeRange}:${metrics.join(',')}:${aggregation}`;
      const cached = await cacheGet<TrendData>(cacheKey);

      if (cached) {
        dashboardMetricsService.recordCacheHit(true);
        dashboardMetricsService.recordTrends(true, Date.now() - start);

        this.logDashboardEvent('DASHBOARD_TRENDS_ACCESSED', {
          actor,
          success: true,
          metadata: { cached: true, timeRange, aggregation },
          ...requestContext,
        });

        return { success: true, data: cached };
      }

      dashboardMetricsService.recordCacheHit(false);

      // Generate trend data
      const series = generateMockTrendData(timeRange, metrics, aggregation);

      const trendData: TrendData = {
        tenantId: actor.tenantId,
        timeRange,
        series,
      };

      // Cache the result (longer TTL for trend data)
      await cacheSet(cacheKey, trendData, CACHE_TTL_SECONDS * 2 * 1000);

      this.logDashboardEvent('DASHBOARD_TRENDS_ACCESSED', {
        actor,
        success: true,
        metadata: { timeRange, aggregation, seriesCount: series.length },
        ...requestContext,
      });

      dashboardMetricsService.recordTrends(true, Date.now() - start);

      return { success: true, data: trendData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logDashboardEvent('DASHBOARD_TRENDS_ACCESSED', {
        actor,
        success: false,
        errorMessage,
        ...requestContext,
      });

      dashboardMetricsService.recordTrends(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve trend data',
        errorCode: 'DASHBOARD_TRENDS_ERROR',
      };
    }
  }

  /**
   * Get KPI summary only (without activity)
   */
  async getKpiSummary(
    timeRange: DashboardTimeRange,
    requestedMetrics: KpiMetricType[] | undefined,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<DashboardOperationResult<KpiSummary>> {
    const start = Date.now();

    try {
      // Try cache first
      const cacheKey = `dashboard:kpis:${actor.tenantId}:${timeRange}:${requestedMetrics?.join(',') || 'all'}`;
      const cached = await cacheGet<KpiSummary>(cacheKey);

      if (cached) {
        dashboardMetricsService.recordCacheHit(true);
        dashboardMetricsService.recordSummary(true, Date.now() - start);

        this.logDashboardEvent('DASHBOARD_SUMMARY_ACCESSED', {
          actor,
          success: true,
          metadata: { cached: true, timeRange, type: 'kpi-only' },
          ...requestContext,
        });

        return { success: true, data: cached };
      }

      dashboardMetricsService.recordCacheHit(false);

      // Generate KPI metrics
      let metrics = generateMockKpis(timeRange);

      // Filter by requested metrics if specified
      if (requestedMetrics && requestedMetrics.length > 0) {
        metrics = metrics.filter((kpi) => requestedMetrics.includes(kpi.type));
      }

      const kpiSummary: KpiSummary = {
        tenantId: actor.tenantId,
        timestamp: new Date(),
        timeRange,
        metrics,
      };

      // Cache the result
      await cacheSet(cacheKey, kpiSummary, CACHE_TTL_SECONDS * 1000);

      this.logDashboardEvent('DASHBOARD_SUMMARY_ACCESSED', {
        actor,
        success: true,
        metadata: { timeRange, metricsCount: metrics.length, type: 'kpi-only' },
        ...requestContext,
      });

      dashboardMetricsService.recordSummary(true, Date.now() - start);

      return { success: true, data: kpiSummary };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logDashboardEvent('DASHBOARD_SUMMARY_ACCESSED', {
        actor,
        success: false,
        errorMessage,
        ...requestContext,
      });

      dashboardMetricsService.recordSummary(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve KPI summary',
        errorCode: 'DASHBOARD_KPI_ERROR',
      };
    }
  }

  /**
   * Log dashboard audit event
   */
  private logDashboardEvent(
    eventType: DashboardAuditEventType,
    params: {
      actor?: ActorContext;
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      channel: 'web' | 'mobile' | 'api';
    }
  ): void {
    auditService.log({
      eventType: eventType as AuditEventType,
      actorId: params.actor?.userId,
      actorType: params.actor?.userType,
      targetType: 'dashboard',
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        tenantId: params.actor?.tenantId,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

export const dashboardService = new DashboardService();
