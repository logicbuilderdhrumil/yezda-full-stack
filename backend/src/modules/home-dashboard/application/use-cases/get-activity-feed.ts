import type { ActivityFeed, RequestContext, OperationResult, ActivityType } from '../../domain/index.js';
import type { IDashboardRepository } from '../../domain/ports/IDashboardRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class GetActivityFeedUseCase {
  constructor(private readonly repo: IDashboardRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(ctx: RequestContext, limit: number, cursor: string | undefined, types: ActivityType[] | undefined): Promise<OperationResult<ActivityFeed>> {
    const start = Date.now();
    try {
      const data = await this.repo.getActivityFeed(ctx.tenantId, limit, cursor, types);
      this.audit.log('DASHBOARD_ACTIVITY_ACCESSED', ctx, { limit });
      this.metrics.recordLatency('dashboard.activity', Date.now() - start);
      return { success: true, data };
    } catch (err) { return { success: false, error: 'Failed to get activity feed', code: 'DASHBOARD_ACTIVITY_ERROR' }; }
  }
}
