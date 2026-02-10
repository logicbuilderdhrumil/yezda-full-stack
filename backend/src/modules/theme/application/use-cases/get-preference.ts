import type { ThemePreference, RequestContext, OperationResult } from '../../domain/index.js';
import type { IThemeRepository } from '../../domain/ports/IThemeRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class GetPreferenceUseCase {
  constructor(private readonly repo: IThemeRepository, private readonly audit: IAuditService) {}
  async execute(ctx: RequestContext): Promise<OperationResult<ThemePreference | null>> {
    try {
      const data = await this.repo.getPreference(ctx.tenantId, ctx.userId);
      this.audit.log('THEME_PREFERENCE_READ', ctx);
      return { success: true, data };
    } catch (err) { return { success: false, error: 'Failed to get preference', code: 'PREFERENCE_ERROR' }; }
  }
}
