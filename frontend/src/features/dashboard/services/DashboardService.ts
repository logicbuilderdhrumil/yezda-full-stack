/**
 * Dashboard Service
 * Integration layer for home dashboard operations.
 */

import { ApiService } from '@/services/ApiService';
import type {
  DashboardSummaryDTO,
  ActivityItemDTO,
  WidgetDTO,
  ResponseMeta,
} from '@/@types/contracts';
import type {
  DashboardMetricsResponse,
  DashboardRefreshOptions,
  KPIMetric,
  ActivityItem,
  ActivityType,
  ChartWidget,
} from '@/@types';

// -----------------------------------------------------------------------------
// Backend type interfaces (mirrors backend response shapes)
// -----------------------------------------------------------------------------

/** Backend KPI metric shape from /dashboard/summary */
interface BackendKpiMetric {
  type: string;
  label: string;
  value: number;
  unit?: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    comparisonPeriod: string;
  };
}

/** Backend activity item shape from /dashboard/summary */
interface BackendActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  actorId?: string;
  actorName?: string;
  timestamp: string | Date;
}

/** Backend dashboard summary response */
interface BackendDashboardSummary {
  tenantId: string;
  timestamp: string | Date;
  timeRange: string;
  kpis: BackendKpiMetric[];
  recentActivity: BackendActivityItem[];
  activityTotal: number;
}

/** Backend trend data point */
interface BackendTrendDataPoint {
  timestamp: string | Date;
  value: number;
}

/** Backend trend series */
interface BackendTrendSeries {
  metric: string;
  label: string;
  data: BackendTrendDataPoint[];
  aggregation: string;
}

/** Backend trend data response */
interface BackendTrendData {
  tenantId: string;
  timeRange: string;
  series: BackendTrendSeries[];
}

// -----------------------------------------------------------------------------
// Transform functions
// -----------------------------------------------------------------------------

/** Map backend KPI trend direction to frontend delta direction */
type DeltaDirection = 'up' | 'down' | 'neutral';

function transformKpiMetric(backendKpi: BackendKpiMetric): KPIMetric {
  const deltaDir: DeltaDirection =
    backendKpi.trend.direction === 'stable' ? 'neutral' : backendKpi.trend.direction;
  const sign = backendKpi.trend.direction === 'down' ? '-' : '+';
  return {
    id: backendKpi.type,
    title: backendKpi.label,
    value: backendKpi.value,
    formattedValue: backendKpi.unit ? `${backendKpi.value} ${backendKpi.unit}` : undefined,
    delta: backendKpi.trend.percentage,
    deltaDirection: deltaDir,
    deltaText: `${sign}${backendKpi.trend.percentage}%`,
  };
}

/** Map backend activity types to frontend activity types */
const activityTypeMap: Record<string, ActivityType> = {
  user_signup: 'user_created',
  task_completed: 'screening_completed',
  task_created: 'screening_started',
  ticket_opened: 'system',
  ticket_resolved: 'system',
  user_login: 'system',
  payment_received: 'system',
  report_generated: 'report_generated',
};

function transformActivityItem(backendActivity: BackendActivityItem): ActivityItem {
  return {
    id: backendActivity.id,
    type: activityTypeMap[backendActivity.type] || 'system',
    message: backendActivity.title,
    timestamp:
      typeof backendActivity.timestamp === 'string'
        ? backendActivity.timestamp
        : new Date(backendActivity.timestamp).toISOString(),
    actor: backendActivity.actorName,
  };
}

function transformTrendSeries(series: BackendTrendSeries, index: number): ChartWidget {
  return {
    id: series.metric,
    title: series.label,
    type: index % 2 === 0 ? 'line' : 'bar',
    data: series.data.map((point) => ({
      label: new Date(point.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: point.value,
    })),
  };
}

// -----------------------------------------------------------------------------
// Cache management
// -----------------------------------------------------------------------------

/** Cache storage for dashboard metrics. */
let cachedMetrics: DashboardMetricsResponse | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute cache

/**
 * Checks if the cached data is still valid.
 */
function isCacheValid(): boolean {
  if (!cachedMetrics || !cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/**
 * DashboardService provides methods for dashboard data.
 */
export const DashboardService = {
  /**
   * Gets dashboard summary with metrics and recent activity.
   */
  async getSummary(): Promise<DashboardSummaryDTO> {
    const response = await ApiService.get<DashboardSummaryDTO>('dashboard.summary');
    return response.data;
  },

  /**
   * Gets dashboard widgets.
   */
  async getWidgets(): Promise<{ widgets: WidgetDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{ widgets: WidgetDTO[]; meta: ResponseMeta }>(
      'dashboard.widgets'
    );
    return response.data;
  },

  /**
   * Gets activity feed.
   */
  async getActivity(options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<{ activity: ActivityItemDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{
      activity: ActivityItemDTO[];
      meta: ResponseMeta;
    }>('dashboard.activity', { params: options });
    return response.data;
  },

  /**
   * Fetches dashboard metrics including KPIs, activities, and charts.
   * Results are cached for 1 minute unless force refresh is requested.
   */
  async getMetrics(options?: DashboardRefreshOptions): Promise<DashboardMetricsResponse> {
    if (!options?.force && isCacheValid() && cachedMetrics) {
      return cachedMetrics;
    }

    // Fetch summary (KPIs + activities) and trends (charts) in parallel
    const [summaryResponse, trendsResponse] = await Promise.all([
      ApiService.get<BackendDashboardSummary>('dashboard.metrics'),
      ApiService.get<BackendTrendData>('dashboard.trends').catch(() => null),
    ]);

    const summary = summaryResponse.data;
    const trends = trendsResponse?.data;

    // Transform backend types to frontend types
    const metrics: DashboardMetricsResponse = {
      kpis: (summary.kpis || []).map(transformKpiMetric),
      activities: (summary.recentActivity || []).map(transformActivityItem),
      charts: trends?.series ? trends.series.map(transformTrendSeries) : [],
      lastUpdated:
        typeof summary.timestamp === 'string'
          ? summary.timestamp
          : new Date(summary.timestamp).toISOString(),
    };

    cachedMetrics = metrics;
    cacheTimestamp = Date.now();
    return metrics;
  },

  /**
   * Clears the dashboard metrics cache.
   */
  clearCache(): void {
    cachedMetrics = null;
    cacheTimestamp = null;
  },

  /**
   * Forces a refresh of dashboard metrics.
   */
  async refresh(): Promise<DashboardMetricsResponse> {
    return this.getMetrics({ force: true });
  },
};
