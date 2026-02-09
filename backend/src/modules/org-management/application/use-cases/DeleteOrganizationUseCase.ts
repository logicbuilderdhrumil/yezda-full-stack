/**
 * Delete Organization Use Case (soft-delete → archived)
 */
import type {
  IOrgManagementRepository,
  IAuditService,
  IMetricsService,
  OrgOperationResult,
  OrgContext,
} from '../../domain/index.js';

export class DeleteOrganizationUseCase {
  constructor(
    private readonly repo: IOrgManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: OrgContext, orgId: string): Promise<OrgOperationResult<void>> {
    const startTime = Date.now();
    try {
      const existing = await this.repo.findById(orgId);
      if (!existing) {
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'delete', success: 'false' });
        return { success: false, error: 'Organization not found', errorCode: 'ORG_NOT_FOUND' };
      }

      const deleted = await this.repo.softDelete(orgId, ctx.actorId);
      if (!deleted) {
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'delete', success: 'false' });
        return { success: false, error: 'Failed to archive organization', errorCode: 'ORG_DELETE_ERROR' };
      }

      this.audit.log({
        eventType: 'ORG_STATUS_CHANGED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: orgId,
        targetType: 'organization',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
        metadata: { previousStatus: existing.status, newStatus: 'archived', organizationName: existing.name },
      });

      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'delete', success: 'true' });
      return { success: true };
    } catch (err) {
      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'delete', success: 'false' });
      return { success: false, error: 'Failed to delete organization', errorCode: 'ORG_DELETE_ERROR' };
    }
  }
}
