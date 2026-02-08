import type { ThemePreset, RequestContext, OperationResult } from '../../domain/index.js';
import type { IThemeRepository } from '../../domain/ports/IThemeRepository.js';

export class GetPresetsUseCase {
  constructor(private readonly repo: IThemeRepository) {}
  async execute(_ctx: RequestContext): Promise<OperationResult<ThemePreset[]>> {
    try { const data = await this.repo.getPresets(); return { success: true, data }; }
    catch { return { success: false, error: 'Failed to get presets', code: 'PRESETS_ERROR' }; }
  }
}
