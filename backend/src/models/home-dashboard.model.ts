/**
 * Home Dashboard Models
 * Task 1.1: Define KPI and activity metric schemas.
 */

import { z } from 'zod';

/** Time range for dashboard queries */
export type DashboardTimeRange = '24h' | '7d' | '30d' | '90d';

/** KPI metric types */
export type KpiMetricType =
  | 'active_users'
  | 'new_signups'
  | 'pending_tasks'
  | 'completed_tasks'
  | 'open_tickets'
  | 'revenue'
  | 'conversion_rate'
  | 'avg_response_time';

/** Activity type for activity feed */
export type ActivityType =
  | 'user_signup'
  | 'task_completed'
  | 'task_created'
  | 'ticket_opened'
  | 'ticket_resolved'
  | 'payment_received'
  | 'report_generated'
  | 'user_login';

/** Single KPI metric */
export interface KpiMetric {
  type: KpiMetricType;
  label: string;
  value: number;
  unit?: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    comparisonPeriod: string;
  };
}

/** KPI summary response */
export interface KpiSummary {
  tenantId: string;
  timestamp: Date;
  timeRange: DashboardTimeRange;
  metrics: KpiMetric[];
}

/** Single activity item */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/** Activity feed response */
export interface ActivityFeed {
  tenantId: string;
  items: ActivityItem[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/** Trend data point */
export interface TrendDataPoint {
  timestamp: Date;
  value: number;
}

/** Trend series for charting */
export interface TrendSeries {
  metric: KpiMetricType;
  label: string;
  data: TrendDataPoint[];
  aggregation: 'hourly' | 'daily' | 'weekly';
}

/** Trend data response */
export interface TrendData {
  tenantId: string;
  timeRange: DashboardTimeRange;
  series: TrendSeries[];
}

/** Dashboard summary response (combined KPIs and recent activity) */
export interface DashboardSummary {
  tenantId: string;
  timestamp: Date;
  timeRange: DashboardTimeRange;
  kpis: KpiMetric[];
  recentActivity: ActivityItem[];
  activityTotal: number;
}

/** Dashboard operation result */
export type DashboardOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode: string };

/** Query options for dashboard endpoints */
export interface DashboardQueryOptions {
  timeRange?: DashboardTimeRange;
  limit?: number;
  cursor?: string;
  metrics?: KpiMetricType[];
}

/** Zod schema for time range */
export const timeRangeSchema = z.enum(['24h', '7d', '30d', '90d']);

/** Zod schema for KPI metric type */
export const kpiMetricTypeSchema = z.enum([
  'active_users',
  'new_signups',
  'pending_tasks',
  'completed_tasks',
  'open_tickets',
  'revenue',
  'conversion_rate',
  'avg_response_time',
]);

/** Zod schema for dashboard summary query */
export const dashboardSummaryQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('7d'),
  metrics: z.string().optional(), // Comma-separated list of metrics
  activityLimit: z.coerce.number().int().positive().max(50).optional().default(10),
});

/** Zod schema for activity feed query */
export const activityFeedQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  cursor: z.string().optional(),
  types: z.string().optional(), // Comma-separated list of activity types
});

/** Zod schema for trend data query */
export const trendDataQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('7d'),
  metrics: z.string().optional(), // Comma-separated metric types
  aggregation: z.enum(['hourly', 'daily', 'weekly']).optional().default('daily'),
});

/** Dashboard-specific audit event types */
export type DashboardAuditEventType =
  | 'DASHBOARD_SUMMARY_ACCESSED'
  | 'DASHBOARD_ACTIVITY_ACCESSED'
  | 'DASHBOARD_TRENDS_ACCESSED'
  | 'DASHBOARD_ACCESS_DENIED'
  | 'DASHBOARD_RATE_LIMITED';
