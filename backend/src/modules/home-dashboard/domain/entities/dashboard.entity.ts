/**
 * Home Dashboard Domain Entities
 * Migrated from legacy home-dashboard.model.ts
 */

export type DashboardTimeRange = '24h' | '7d' | '30d' | '90d';

export type KpiMetricType =
  | 'active_users' | 'new_signups' | 'pending_tasks' | 'completed_tasks'
  | 'open_tickets' | 'revenue' | 'conversion_rate' | 'avg_response_time';

export type ActivityType =
  | 'user_signup' | 'task_completed' | 'task_created'
  | 'ticket_opened' | 'ticket_resolved' | 'payment_received'
  | 'report_generated' | 'user_login';

export interface KpiMetric {
  type: KpiMetricType;
  label: string;
  value: number;
  unit?: string;
  trend: { direction: 'up' | 'down' | 'stable'; percentage: number; comparisonPeriod: string };
}

export interface KpiSummary {
  tenantId: string;
  timestamp: Date;
  timeRange: DashboardTimeRange;
  metrics: KpiMetric[];
}

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

export interface ActivityFeed {
  tenantId: string;
  items: ActivityItem[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface TrendDataPoint { timestamp: Date; value: number; }

export interface TrendSeries {
  metric: KpiMetricType;
  label: string;
  data: TrendDataPoint[];
  aggregation: 'hourly' | 'daily' | 'weekly';
}

export interface TrendData {
  tenantId: string;
  timeRange: DashboardTimeRange;
  series: TrendSeries[];
}

export interface DashboardSummary {
  tenantId: string;
  timestamp: Date;
  timeRange: DashboardTimeRange;
  kpis: KpiMetric[];
  recentActivity: ActivityItem[];
  activityTotal: number;
}

export interface DashboardQueryOptions {
  timeRange?: DashboardTimeRange;
  limit?: number;
  cursor?: string;
  metrics?: KpiMetricType[];
}

export type DashboardAuditEventType =
  | 'DASHBOARD_SUMMARY_ACCESSED' | 'DASHBOARD_ACTIVITY_ACCESSED'
  | 'DASHBOARD_TRENDS_ACCESSED' | 'DASHBOARD_ACCESS_DENIED' | 'DASHBOARD_RATE_LIMITED';

export interface RequestContext {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  ipAddress?: string;
  channel?: 'web' | 'mobile' | 'api';
}

export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };
