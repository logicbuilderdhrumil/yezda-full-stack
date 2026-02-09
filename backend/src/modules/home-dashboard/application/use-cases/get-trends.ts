import type { TrendData, RequestContext, OperationResult, DashboardTimeRange, KpiMetricType } from '../../domain/index.js';
import type { IDashboardRepository } from '../../domain/ports/IDashboardRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class GetTrendsUseCase {
  constructor(private readonly repo: IDashboardRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(ctx: RequestContext, timeRange: DashboardTimeRange, metricsFilter: KpiMetricType[], aggregation: 'hourly' | 'daily' | 'weekly'): Promise<OperationResult<TrendData>> {
    const start = Date.now();
    try {
      const data = await this.repo.getTrends(ctx.tenantId, timeRange, metricsFilter, aggregation);
      this.audit.log('DASHBOARD_TRENDS_ACCESSED', ctx, { timeRange, aggregation });
      this.metrics.recordLatency('dashboard.trends', Date.now() - start);
      return { success: true, data };
    } catch (err) { return { success: false, error: 'Failed to get trends', code: 'DASHBOARD_TRENDS_ERROR' }; }
  }
}
