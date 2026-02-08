/**
 * Update Organization Use Case
 */
import type {
  IOrgManagementRepository,
  IAuditService,
  IMetricsService,
  Organization,
  OrgOperationResult,
  OrgContext,
  UpdateOrgDto,
} from '../../domain/index.js';

export class UpdateOrganizationUseCase {
  constructor(
    private readonly repo: IOrgManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: OrgContext, orgId: string, dto: UpdateOrgDto): Promise<OrgOperationResult<Organization>> {
    const startTime = Date.now();
    try {
      const existing = await this.repo.findById(orgId);
      if (!existing) {
        this.audit.log({
          eventType: 'ORG_ACCESS_DENIED',
          actorId: ctx.actorId,
          actorType: ctx.actorType,
          targetId: orgId,
          targetType: 'organization',
          channel: ctx.channel,
          ipAddress: ctx.ipAddress,
          success: false,
          errorMessage: 'Organization not found',
        });
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'update', success: 'false' });
        return { success: false, error: 'Organization not found', errorCode: 'ORG_NOT_FOUND' };
      }

      const now = new Date();
      const updated = await this.repo.update(orgId, {
        ...dto as Partial<Organization>,
        updatedAt: now,
        updatedBy: ctx.actorId,
      });

      if (!updated) {
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'update', success: 'false' });
        return { success: false, error: 'Failed to update organization', errorCode: 'ORG_UPDATE_ERROR' };
      }

      // Log status change separately if status changed
      if (dto.status && dto.status !== existing.status) {
        this.audit.log({
          eventType: 'ORG_STATUS_CHANGED',
          actorId: ctx.actorId,
          actorType: ctx.actorType,
          targetId: orgId,
          targetType: 'organization',
          channel: ctx.channel,
          ipAddress: ctx.ipAddress,
          success: true,
          metadata: { previousStatus: existing.status, newStatus: dto.status },
        });
      }

      this.audit.log({
        eventType: 'ORG_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: orgId,
        targetType: 'organization',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
        metadata: {
          organizationName: updated.name,
          updatedFields: Object.keys(dto),
        },
      });

      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'update', success: 'true' });
      return { success: true, data: updated };
    } catch (err) {
      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'update', success: 'false' });
      return { success: false, error: 'Failed to update organization', errorCode: 'ORG_UPDATE_ERROR' };
    }
  }
}
