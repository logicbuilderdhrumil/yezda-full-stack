/**
 * Get Organization By ID Use Case
 */
import type {
  IOrgManagementRepository,
  IAuditService,
  IMetricsService,
  Organization,
  OrgOperationResult,
  OrgContext,
} from '../../domain/index.js';

export class GetOrganizationByIdUseCase {
  constructor(
    private readonly repo: IOrgManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: OrgContext, orgId: string): Promise<OrgOperationResult<Organization>> {
    const startTime = Date.now();
    try {
      const org = await this.repo.findById(orgId);
      if (!org) {
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
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'get', success: 'false' });
        return { success: false, error: 'Organization not found', errorCode: 'ORG_NOT_FOUND' };
      }

      this.audit.log({
        eventType: 'ORG_ACCESSED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: orgId,
        targetType: 'organization',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
        metadata: { organizationName: org.name },
      });

      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'get', success: 'true' });
      return { success: true, data: org };
    } catch (err) {
      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'get', success: 'false' });
      return { success: false, error: 'Failed to retrieve organization', errorCode: 'ORG_READ_ERROR' };
    }
  }
}
