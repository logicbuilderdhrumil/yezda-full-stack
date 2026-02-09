/**
 * Create Organization Use Case
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  IOrgManagementRepository,
  IAuditService,
  IMetricsService,
  Organization,
  OrgOperationResult,
  OrgContext,
  CreateOrgDto,
} from '../../domain/index.js';
import { generateSlug, DEFAULT_ORG_SETTINGS } from '../../domain/index.js';

export class CreateOrganizationUseCase {
  constructor(
    private readonly repo: IOrgManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: OrgContext, dto: CreateOrgDto): Promise<OrgOperationResult<Organization>> {
    const startTime = Date.now();
    try {
      const slug = dto.slug || generateSlug(dto.name);
      const slugExists = await this.repo.slugExists(slug);
      if (slugExists) {
        this.audit.log({
          eventType: 'ORG_CREATED',
          actorId: ctx.actorId,
          actorType: ctx.actorType,
          channel: ctx.channel,
          ipAddress: ctx.ipAddress,
          success: false,
          errorMessage: 'Organization slug already exists',
        });
        this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'create', success: 'false' });
        return { success: false, error: 'An organization with this slug already exists', errorCode: 'ORG_SLUG_EXISTS' };
      }

      const now = new Date();
      const org: Organization = {
        id: uuidv4(),
        name: dto.name,
        slug,
        description: dto.description,
        status: 'active',
        plan: dto.plan ?? 'free',
        logoUrl: dto.logoUrl,
        website: dto.website,
        primaryContactEmail: dto.primaryContactEmail,
        primaryContactName: dto.primaryContactName,
        metadata: dto.metadata,
        settings: { ...DEFAULT_ORG_SETTINGS, ...dto.settings },
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.actorId,
      };

      const created = await this.repo.create(org);

      this.audit.log({
        eventType: 'ORG_CREATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: created.id,
        targetType: 'organization',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
        metadata: { organizationName: created.name, slug: created.slug },
      });

      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'create', success: 'true' });
      return { success: true, data: created };
    } catch (err) {
      this.metrics.recordLatency('org_management_request', Date.now() - startTime, { operation: 'create', success: 'false' });
      return { success: false, error: `Failed to create organization: ${err instanceof Error ? err.message : String(err)}`, errorCode: 'ORG_CREATE_ERROR' };
    }
  }
}
