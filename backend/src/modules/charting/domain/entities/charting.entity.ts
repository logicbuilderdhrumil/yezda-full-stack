/**
 * Charting domain entity.
 */
export type MetricName =
  | 'screenings_completed' | 'screenings_pending'
  | 'candidates_active' | 'candidates_onboarded'
  | 'applications_received' | 'turnaround_time'
  | 'completion_rate' | 'user_activity'
  | 'api_latency' | 'error_rate';

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'percentile';
export type TimePreset = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface ChartMetric {
  name: MetricName;
  displayName: string;
  description: string;
  unit: string;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ChartQueryResult {
  metric: string;
  dataPoints: ChartDataPoint[];
  aggregation?: string;
  timeRange?: { start: Date; end: Date };
}

export interface AggregateResult {
  metric: string;
  aggregation: string;
  value: number;
  timeRange?: { start: Date; end: Date };
}

export interface ChartingHealth {
  status: string;
  metricsAvailable: number;
  sloCompliance: Record<string, boolean>;
}
