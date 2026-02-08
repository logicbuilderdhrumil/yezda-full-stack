import type { LocalePreference, UpdateLocalePreferenceInput, RequestContext, OperationResult } from '../../domain/index.js';
import type { ILocalizationRepository } from '../../domain/ports/ILocalizationRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class UpdateLocalePreferenceUseCase {
  constructor(private readonly repo: ILocalizationRepository, private readonly audit: IAuditService) {}
  async execute(ctx: RequestContext, input: UpdateLocalePreferenceInput): Promise<OperationResult<LocalePreference>> {
    try { const data = await this.repo.upsertPreference(ctx.tenantId, ctx.userId, ctx.userType, input); this.audit.log('LOCALE_PREFERENCE_UPDATED', ctx, { locale: input.locale }); return { success: true, data }; }
    catch { return { success: false, error: 'Failed to update locale preference', code: 'UPDATE_PREFERENCE_ERROR' }; }
  }
}
