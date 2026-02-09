import type { ChartMetric, ChartQueryResult, AggregateResult, ChartingHealth, MetricName, AggregationType, TimePreset } from '../entities/charting.entity.js';

export interface ChartQuery {
  metrics: MetricName[];
  timeRange?: { preset?: TimePreset; start?: string; end?: string };
  granularity?: string;
}

export interface AggregateQuery {
  metric: MetricName;
  aggregation: AggregationType;
  timeRange?: { preset?: TimePreset; start?: string; end?: string };
}

export interface IChartingRepository {
  getAvailableMetrics(tenantId: string): Promise<ChartMetric[]>;
  queryChartData(tenantId: string, query: ChartQuery): Promise<ChartQueryResult[]>;
  aggregateMetric(tenantId: string, query: AggregateQuery): Promise<AggregateResult>;
  getHealth(): Promise<ChartingHealth>;
}
