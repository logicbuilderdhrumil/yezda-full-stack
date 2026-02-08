/**
 * List Organizations Use Case
 */
import type {
  IOrgManagementRepository,
  IAuditService,
  IMetricsService,
  OrgOperationResult,
  OrgContext,
  OrgFilters,
  OrgPaginationOptions,
  OrgListResult,
} from '../../domain/index.js';

export class ListOrganizationsUseCase {
  constructor(
    private readonly repo: IOrgManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: OrgContext, filters: OrgFilters, pagination: OrgPaginationOptions): Promise<OrgOperationResult<OrgListResult>> {
    const startTime = Date.now();
    try {
      const result = await this.repo.findAll(filters, pagination);

      this.audit.log({
        eventType: 'ORG_LIST_ACCESSED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        success: true,
        metadata: { count: result.organizations.length, total: result.total },
      });

      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'list', success: 'true' });
      return { success: true, data: result };
    } catch {
      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'list', success: 'false' });
      return { success: false, error: 'Failed to list organizations', errorCode: 'ORG_LIST_ERROR' };
    }
  }
}
