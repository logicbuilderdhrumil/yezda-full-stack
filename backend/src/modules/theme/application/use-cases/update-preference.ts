import type { ThemePreference, ThemePreferenceUpdate, RequestContext, OperationResult } from '../../domain/index.js';
import type { IThemeRepository } from '../../domain/ports/IThemeRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class UpdatePreferenceUseCase {
  constructor(private readonly repo: IThemeRepository, private readonly audit: IAuditService) {}
  async execute(ctx: RequestContext, update: ThemePreferenceUpdate): Promise<OperationResult<ThemePreference>> {
    try {
      const data = await this.repo.upsertPreference(ctx.tenantId, ctx.userId, ctx.userType, update);
      this.audit.log('THEME_PREFERENCE_UPDATED', ctx, { presetId: update.presetId });
      return { success: true, data };
    } catch (err) { return { success: false, error: 'Failed to update preference', code: 'UPDATE_PREFERENCE_ERROR' }; }
  }
}
