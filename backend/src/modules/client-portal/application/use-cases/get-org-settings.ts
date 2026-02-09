/**
 * Use Case: Get Org Settings
 */
import type { OrgSettings, RequestContext, OperationResult } from '../../domain/index.js';
import type { IClientPortalRepository } from '../../domain/ports/IClientPortalRepository.js';

export class GetOrgSettingsUseCase {
  constructor(private readonly repo: IClientPortalRepository) {}

  execute(ctx: RequestContext): OperationResult<OrgSettings> {
    try {
      const data = this.repo.getOrgSettings(ctx.tenantId);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Failed to get org settings', code: 'SETTINGS_FAILED' };
    }
  }
}
