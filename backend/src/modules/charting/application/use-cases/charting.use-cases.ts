import type { IChartingRepository, ChartQuery, AggregateQuery, ChartMetric, ChartQueryResult, AggregateResult, ChartingHealth } from '../../domain/index.js';

export class GetAvailableMetrics {
  constructor(private repo: IChartingRepository) {}
  async execute(tenantId: string): Promise<ChartMetric[]> { return this.repo.getAvailableMetrics(tenantId); }
}

export class QueryChartData {
  constructor(private repo: IChartingRepository) {}
  async execute(tenantId: string, query: ChartQuery): Promise<ChartQueryResult[]> { return this.repo.queryChartData(tenantId, query); }
}

export class AggregateMetric {
  constructor(private repo: IChartingRepository) {}
  async execute(tenantId: string, query: AggregateQuery): Promise<AggregateResult> { return this.repo.aggregateMetric(tenantId, query); }
}

export class GetChartingHealth {
  constructor(private repo: IChartingRepository) {}
  async execute(): Promise<ChartingHealth> { return this.repo.getHealth(); }
}
