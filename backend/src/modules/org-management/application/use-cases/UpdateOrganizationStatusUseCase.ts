/**
 * Update Organization Status Use Case
 */
import type {
  IOrgManagementRepository,
  IAuditService,
  IMetricsService,
  Organization,
  OrganizationStatus,
  OrgOperationResult,
  OrgContext,
} from '../../domain/index.js';

export class UpdateOrganizationStatusUseCase {
  constructor(
    private readonly repo: IOrgManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: OrgContext, orgId: string, status: OrganizationStatus): Promise<OrgOperationResult<Organization>> {
    const startTime = Date.now();
    try {
      const existing = await this.repo.findById(orgId);
      if (!existing) {
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'status_update', success: 'false' });
        return { success: false, error: 'Organization not found', errorCode: 'ORG_NOT_FOUND' };
      }

      const updated = await this.repo.updateStatus(orgId, status, ctx.actorId);
      if (!updated) {
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'status_update', success: 'false' });
        return { success: false, error: 'Failed to update status', errorCode: 'ORG_UPDATE_ERROR' };
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
        metadata: { previousStatus: existing.status, newStatus: status, organizationName: updated.name },
      });

      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'status_update', success: 'true' });
      return { success: true, data: updated };
    } catch {
      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'status_update', success: 'false' });
      return { success: false, error: 'Failed to update organization status', errorCode: 'ORG_UPDATE_ERROR' };
    }
  }
}
