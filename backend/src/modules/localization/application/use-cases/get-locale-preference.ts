import type { LocalePreference, RequestContext, OperationResult } from '../domain/index.js';
import type { ILocalizationRepository } from '../domain/ports/ILocalizationRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';

export class GetLocalePreferenceUseCase {
  constructor(private readonly repo: ILocalizationRepository, private readonly audit: IAuditService) {}
  async execute(ctx: RequestContext): Promise<OperationResult<LocalePreference | null>> {
    try { const data = await this.repo.getPreference(ctx.tenantId, ctx.userId); this.audit.log('LOCALE_PREFERENCE_READ', ctx); return { success: true, data }; }
    catch { return { success: false, error: 'Failed to get locale preference', code: 'PREFERENCE_ERROR' }; }
  }
}
