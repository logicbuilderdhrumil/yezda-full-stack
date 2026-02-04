/**
 * Charting Models
 * Task 1.1: Define chart data schemas and aggregation rules.
 */

import { z } from 'zod';

/** Time range presets for aggregation */
export type TimeRangePreset = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/** Aggregation type for metrics */
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'percentile';

/** Granularity for time-series data */
export type Granularity = 'minute' | 'hour' | 'day' | 'week' | 'month';

/** Metric types available for charting */
export type MetricType =
  | 'screenings_completed'
  | 'screenings_pending'
  | 'candidates_active'
  | 'candidates_onboarded'
  | 'applications_received'
  | 'turnaround_time'
  | 'completion_rate'
  | 'user_activity'
  | 'api_latency'
  | 'error_rate';

/** Single data point in a chart series */
export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

/** Chart series with metadata */
export interface ChartSeries {
  id: string;
  name: string;
  metric: MetricType;
  dataPoints: ChartDataPoint[];
  aggregation: AggregationType;
  granularity: Granularity;
  unit?: string;
  color?: string;
}

/** Chart data response */
export interface ChartData {
  series: ChartSeries[];
  timeRange: {
    start: Date;
    end: Date;
  };
  metadata: {
    tenantId: string;
    generatedAt: Date;
    cached: boolean;
  };
}

/** Time range for chart queries */
export interface TimeRange {
  preset?: TimeRangePreset;
  start?: Date;
  end?: Date;
}

/** Filters for chart data */
export interface ChartFilters {
  metrics: MetricType[];
  timeRange: TimeRange;
  granularity?: Granularity;
  aggregation?: AggregationType;
  groupBy?: string[];
}

/** Chart query request */
export interface ChartQueryRequest {
  tenantId: string;
  filters: ChartFilters;
}

/** Chart operation result */
export type ChartOperationResult<T = ChartData> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode: string };

/** Available metrics with descriptions */
export const AVAILABLE_METRICS: Record<MetricType, { name: string; description: string; unit: string }> = {
  screenings_completed: {
    name: 'Screenings Completed',
    description: 'Number of background screenings completed',
    unit: 'count',
  },
  screenings_pending: {
    name: 'Screenings Pending',
    description: 'Number of background screenings in progress',
    unit: 'count',
  },
  candidates_active: {
    name: 'Active Candidates',
    description: 'Number of candidates currently active in the pipeline',
    unit: 'count',
  },
  candidates_onboarded: {
    name: 'Candidates Onboarded',
    description: 'Number of candidates successfully onboarded',
    unit: 'count',
  },
  applications_received: {
    name: 'Applications Received',
    description: 'Number of applications submitted',
    unit: 'count',
  },
  turnaround_time: {
    name: 'Turnaround Time',
    description: 'Average time to complete screenings',
    unit: 'hours',
  },
  completion_rate: {
    name: 'Completion Rate',
    description: 'Percentage of screenings completed successfully',
    unit: 'percent',
  },
  user_activity: {
    name: 'User Activity',
    description: 'Number of active user sessions',
    unit: 'count',
  },
  api_latency: {
    name: 'API Latency',
    description: 'Average API response time',
    unit: 'ms',
  },
  error_rate: {
    name: 'Error Rate',
    description: 'Percentage of failed requests',
    unit: 'percent',
  },
};

/** Default aggregation rules per metric */
export const DEFAULT_AGGREGATIONS: Record<MetricType, AggregationType> = {
  screenings_completed: 'sum',
  screenings_pending: 'avg',
  candidates_active: 'avg',
  candidates_onboarded: 'sum',
  applications_received: 'sum',
  turnaround_time: 'avg',
  completion_rate: 'avg',
  user_activity: 'avg',
  api_latency: 'avg',
  error_rate: 'avg',
};

/** Zod schema for time range */
export const timeRangeSchema = z.object({
  preset: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year', 'custom']).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
}).refine(
  (data) => {
    // Either preset or both start and end must be provided
    if (data.preset === 'custom') {
      return data.start !== undefined && data.end !== undefined;
    }
    return data.preset !== undefined || (data.start !== undefined && data.end !== undefined);
  },
  { message: 'Either preset or both start and end dates are required' }
);

/** Zod schema for chart query */
export const chartQuerySchema = z.object({
  metrics: z.array(
    z.enum([
      'screenings_completed',
      'screenings_pending',
      'candidates_active',
      'candidates_onboarded',
      'applications_received',
      'turnaround_time',
      'completion_rate',
      'user_activity',
      'api_latency',
      'error_rate',
    ])
  ).min(1).max(10),
  timeRange: timeRangeSchema,
  granularity: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional(),
  aggregation: z.enum(['sum', 'avg', 'min', 'max', 'count', 'median', 'percentile']).optional(),
  groupBy: z.array(z.string()).max(5).optional(),
});

/** Zod schema for time range query params */
export const timeRangeQuerySchema = z.object({
  preset: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

/** Charting-specific audit event types */
export type ChartAuditEventType =
  | 'CHART_DATA_ACCESSED'
  | 'CHART_ACCESS_DENIED'
  | 'CHART_RATE_LIMITED'
  | 'CHART_METRICS_LISTED'
  | 'CHART_AGGREGATION_APPLIED';

/** Calculate time range from preset */
export function calculateTimeRange(preset: TimeRangePreset): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case 'hour':
      start.setHours(start.getHours() - 1);
      break;
    case 'day':
      start.setDate(start.getDate() - 1);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      // Default to 1 day
      start.setDate(start.getDate() - 1);
  }

  return { start, end };
}

/** Determine optimal granularity based on time range */
export function determineGranularity(start: Date, end: Date): Granularity {
  const durationMs = end.getTime() - start.getTime();
  const hours = durationMs / (1000 * 60 * 60);

  if (hours <= 2) return 'minute';
  if (hours <= 48) return 'hour';
  if (hours <= 336) return 'day'; // 2 weeks
  if (hours <= 2160) return 'week'; // 3 months
  return 'month';
}
