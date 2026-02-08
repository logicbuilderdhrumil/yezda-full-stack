import type { SupportedLocale, RequestContext, OperationResult } from '../../domain/index.js';
import type { ILocalizationRepository } from '../../domain/ports/ILocalizationRepository.js';

export class GetSupportedLocalesUseCase {
  constructor(private readonly repo: ILocalizationRepository) {}
  async execute(_ctx: RequestContext): Promise<OperationResult<SupportedLocale[]>> {
    try { const data = await this.repo.getSupportedLocales(); return { success: true, data }; }
    catch (err) { return { success: false, error: 'Failed to get supported locales', code: 'LOCALES_ERROR' }; }
  }
}
