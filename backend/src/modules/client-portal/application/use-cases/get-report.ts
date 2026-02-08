/**
 * Use Case: Get Report
 */
import type { ScreeningReport, RequestContext, OperationResult } from '../domain/index.js';
import type { IClientPortalRepository } from '../domain/ports/IClientPortalRepository.js';

export class GetReportUseCase {
  constructor(private readonly repo: IClientPortalRepository) {}

  execute(ctx: RequestContext): OperationResult<ScreeningReport> {
    try {
      const data = this.repo.getReport(ctx.tenantId);
      return { success: true, data };
    } catch {
      return { success: false, error: 'Failed to get report', code: 'REPORT_FAILED' };
    }
  }
}
