import type { DashboardSummary, KpiSummary, ActivityFeed, TrendData, DashboardTimeRange, KpiMetricType, ActivityType } from '../entities/dashboard.entity.js';

export interface IDashboardRepository {
  getSummary(tenantId: string, timeRange: DashboardTimeRange, requestedMetrics: KpiMetricType[] | undefined, activityLimit: number): Promise<DashboardSummary>;
  getKpiSummary(tenantId: string, timeRange: DashboardTimeRange, requestedMetrics: KpiMetricType[] | undefined): Promise<KpiSummary>;
  getActivityFeed(tenantId: string, limit: number, cursor: string | undefined, types: ActivityType[] | undefined): Promise<ActivityFeed>;
  getTrends(tenantId: string, timeRange: DashboardTimeRange, metrics: KpiMetricType[], aggregation: 'hourly' | 'daily' | 'weekly'): Promise<TrendData>;
}
