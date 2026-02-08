import type { KpiSummary, RequestContext, OperationResult, DashboardTimeRange, KpiMetricType } from '../domain/index.js';
import type { IDashboardRepository } from '../domain/ports/IDashboardRepository.js';
import type { IMetricsService } from '../domain/ports/IMetricsService.js';

export class GetKpiSummaryUseCase {
  constructor(private readonly repo: IDashboardRepository, private readonly metrics: IMetricsService) {}

  async execute(ctx: RequestContext, timeRange: DashboardTimeRange, requestedMetrics: KpiMetricType[] | undefined): Promise<OperationResult<KpiSummary>> {
    const start = Date.now();
    try {
      const data = await this.repo.getKpiSummary(ctx.tenantId, timeRange, requestedMetrics);
      this.metrics.recordLatency('dashboard.kpi', Date.now() - start);
      return { success: true, data };
    } catch { return { success: false, error: 'Failed to get KPI summary', code: 'DASHBOARD_KPI_ERROR' }; }
  }
}
