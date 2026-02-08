import type { TranslationsResponse, SupportedLocale, TranslationNamespace, RequestContext, OperationResult } from '../../domain/index.js';
import { getFallbackLocale } from '../../domain/index.js';
import type { ILocalizationRepository } from '../../domain/ports/ILocalizationRepository.js';

export class GetTranslationsUseCase {
  constructor(private readonly repo: ILocalizationRepository) {}
  async execute(_ctx: RequestContext, locale: SupportedLocale, namespaces?: TranslationNamespace[]): Promise<OperationResult<TranslationsResponse>> {
    try {
      const bundles = await this.repo.getTranslations(locale, namespaces);
      const fallbackLocale = getFallbackLocale(locale);
      return { success: true, data: { locale, fallbackLocale: fallbackLocale !== locale ? fallbackLocale : undefined, bundles } };
    } catch (err) { return { success: false, error: 'Failed to get translations', code: 'TRANSLATIONS_ERROR' }; }
  }
}
