import type { DashboardSummary, RequestContext, OperationResult, DashboardTimeRange, KpiMetricType } from '../../domain/index.js';
import type { IDashboardRepository } from '../../domain/ports/IDashboardRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class GetDashboardSummaryUseCase {
  constructor(private readonly repo: IDashboardRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(ctx: RequestContext, timeRange: DashboardTimeRange, requestedMetrics: KpiMetricType[] | undefined, activityLimit: number): Promise<OperationResult<DashboardSummary>> {
    const start = Date.now();
    try {
      const data = await this.repo.getSummary(ctx.tenantId, timeRange, requestedMetrics, activityLimit);
      this.audit.log('DASHBOARD_SUMMARY_ACCESSED', ctx, { timeRange });
      this.metrics.recordLatency('dashboard.summary', Date.now() - start);
      return { success: true, data };
    } catch (err) { return { success: false, error: 'Failed to get dashboard summary', code: 'DASHBOARD_SUMMARY_ERROR' }; }
  }
}
