import type { GlobalControlSummary, RequestContext, OperationResult, LayoutAccessContext } from '../domain/index.js';
import type { ITemplateLayoutRepository } from '../domain/ports/ITemplateLayoutRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';

export class GetGlobalControlsUseCase {
  constructor(private readonly repo: ITemplateLayoutRepository, private readonly audit: IAuditService) {}
  async execute(ctx: RequestContext, accessContext: LayoutAccessContext): Promise<OperationResult<GlobalControlSummary>> {
    try {
      const data = await this.repo.getGlobalControls(accessContext);
      this.audit.log('LAYOUT_PROFILE_SUMMARY_ACCESSED', ctx);
      return { success: true, data };
    } catch { return { success: false, error: 'Failed to get global controls', code: 'GLOBAL_CONTROLS_ERROR' }; }
  }
}
