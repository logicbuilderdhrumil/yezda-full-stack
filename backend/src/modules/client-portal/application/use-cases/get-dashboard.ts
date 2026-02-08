/**
 * Use Case: Get Dashboard Summary
 */
import type { DashboardSummary, RequestContext, OperationResult } from '../domain/index.js';
import type { IClientPortalRepository } from '../domain/ports/IClientPortalRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';

export class GetDashboardUseCase {
  constructor(
    private readonly repo: IClientPortalRepository,
    private readonly audit: IAuditService,
  ) {}

  execute(ctx: RequestContext): OperationResult<DashboardSummary> {
    try {
      const data = this.repo.getDashboardSummary(ctx.tenantId);
      this.audit.log('CLIENT_PORTAL_DASHBOARD_ACCESSED', ctx);
      return { success: true, data };
    } catch {
      return { success: false, error: 'Failed to get dashboard', code: 'DASHBOARD_FAILED' };
    }
  }
}
