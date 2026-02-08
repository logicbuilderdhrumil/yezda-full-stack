import type { TemplateLayoutNavigation, RequestContext, OperationResult, LayoutAccessContext } from '../domain/index.js';
import type { ITemplateLayoutRepository } from '../domain/ports/ITemplateLayoutRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';

export class GetNavigationUseCase {
  constructor(private readonly repo: ITemplateLayoutRepository, private readonly audit: IAuditService) {}
  async execute(ctx: RequestContext, accessContext: LayoutAccessContext): Promise<OperationResult<TemplateLayoutNavigation>> {
    try {
      const data = await this.repo.getNavigation(accessContext);
      this.audit.log('LAYOUT_NAVIGATION_ACCESSED', ctx);
      return { success: true, data };
    } catch { return { success: false, error: 'Failed to get navigation', code: 'NAVIGATION_ERROR' }; }
  }
}
