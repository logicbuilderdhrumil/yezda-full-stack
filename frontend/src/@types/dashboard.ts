/**
 * Dashboard types for home dashboard metrics and activity.
 */

/** Delta direction for KPI changes. */
export type DeltaDirection = 'up' | 'down' | 'neutral';

/** KPI metric data for dashboard summary cards. */
export interface KPIMetric {
  /** Unique identifier for the metric. */
  id: string;
  /** Display title of the metric. */
  title: string;
  /** Current value of the metric. */
  value: number | string;
  /** Optional formatted value for display. */
  formattedValue?: string | undefined;
  /** Change from previous period. */
  delta?: number | undefined;
  /** Direction of change. */
  deltaDirection?: DeltaDirection | undefined;
  /** Delta percentage text (e.g., "+12%"). */
  deltaText?: string | undefined;
  /** Optional icon name or component key. */
  icon?: string | undefined;
  /** Optional link to detailed view. */
  href?: string | undefined;
}

/** Activity types for the activity feed. */
export type ActivityType =
  | 'screening_started'
  | 'screening_completed'
  | 'candidate_added'
  | 'user_created'
  | 'org_updated'
  | 'report_generated'
  | 'system';

/** Activity item for the recent activity feed. */
export interface ActivityItem {
  /** Unique identifier. */
  id: string;
  /** Type of activity. */
  type: ActivityType;
  /** Display message. */
  message: string;
  /** Timestamp of the activity. */
  timestamp: string;
  /** Optional actor name or user who performed the action. */
  actor?: string | undefined;
  /** Optional link to related resource. */
  href?: string | undefined;
}

/** Chart data point for trend visualization. */
export interface ChartDataPoint {
  /** X-axis label (e.g., date string). */
  label: string;
  /** Y-axis value. */
  value: number;
}

/** Chart widget configuration. */
export interface ChartWidget {
  /** Unique identifier. */
  id: string;
  /** Chart title. */
  title: string;
  /** Chart type. */
  type: 'line' | 'bar';
  /** Data points. */
  data: ChartDataPoint[];
}

/** Dashboard metrics response from the API. */
export interface DashboardMetricsResponse {
  /** KPI metrics for summary cards. */
  kpis: KPIMetric[];
  /** Recent activity items. */
  activities: ActivityItem[];
  /** Chart widgets for trends. */
  charts: ChartWidget[];
  /** Last updated timestamp. */
  lastUpdated: string;
}

/** Dashboard refresh options. */
export interface DashboardRefreshOptions {
  /** Force refresh, bypassing cache. */
  force?: boolean | undefined;
}
