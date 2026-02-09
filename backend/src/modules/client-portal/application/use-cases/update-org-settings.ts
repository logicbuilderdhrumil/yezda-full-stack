/**
 * Use Case: Update Org Settings
 */
import type { OrgSettings, UpdateOrgSettingsDto, RequestContext, OperationResult } from '../../domain/index.js';
import type { IClientPortalRepository } from '../../domain/ports/IClientPortalRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class UpdateOrgSettingsUseCase {
  constructor(
    private readonly repo: IClientPortalRepository,
    private readonly audit: IAuditService,
  ) {}

  execute(ctx: RequestContext, dto: UpdateOrgSettingsDto): OperationResult<OrgSettings> {
    try {
      const data = this.repo.updateOrgSettings(ctx.tenantId, dto);
      this.audit.log('CLIENT_PORTAL_ORG_SETTINGS_UPDATED', ctx, { dto });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Failed to update org settings', code: 'UPDATE_SETTINGS_FAILED' };
    }
  }
}
