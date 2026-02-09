import type { IChartingRepository, ChartQuery, AggregateQuery } from '../../domain/ports/IChartingRepository.js';
import type { ChartMetric, ChartQueryResult, AggregateResult, ChartingHealth } from '../../domain/entities/charting.entity.js';

const DEFAULT_METRICS: ChartMetric[] = [
  { name: 'screenings_completed', displayName: 'Screenings Completed', description: 'Total completed screenings', unit: 'count' },
  { name: 'candidates_active', displayName: 'Active Candidates', description: 'Currently active candidates', unit: 'count' },
  { name: 'applications_received', displayName: 'Applications Received', description: 'Total applications received', unit: 'count' },
  { name: 'turnaround_time', displayName: 'Turnaround Time', description: 'Average screening turnaround', unit: 'hours' },
  { name: 'completion_rate', displayName: 'Completion Rate', description: 'Screening completion rate', unit: 'percent' },
];

export class InMemoryChartingRepository implements IChartingRepository {
  async getAvailableMetrics(_tenantId: string): Promise<ChartMetric[]> { return DEFAULT_METRICS; }

  async queryChartData(_tenantId: string, query: ChartQuery): Promise<ChartQueryResult[]> {
    return query.metrics.map((m) => ({ metric: m, dataPoints: [] }));
  }

  async aggregateMetric(_tenantId: string, query: AggregateQuery): Promise<AggregateResult> {
    return { metric: query.metric, aggregation: query.aggregation, value: 0 };
  }

  async getHealth(): Promise<ChartingHealth> {
    return { status: 'healthy', metricsAvailable: DEFAULT_METRICS.length, sloCompliance: { latency: true, accuracy: true } };
  }
}
