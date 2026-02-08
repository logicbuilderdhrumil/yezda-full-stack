/**
 * Use Case: Get Templates By Type
 * Retrieves template assets of a given template type.
 */
import type {
  TemplateType,
  TemplateAsset,
  RequestContext,
  OperationResult,
} from '../domain/index.js';
import type { IAssetRepository } from '../domain/ports/IAssetRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';
import type { IMetricsService } from '../domain/ports/IMetricsService.js';

export class GetTemplatesByTypeUseCase {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    templateType: TemplateType,
  ): Promise<OperationResult<TemplateAsset[]>> {
    const start = Date.now();
    try {
      const templates = await this.assetRepo.findTemplatesByType(ctx.tenantId, templateType);
      this.audit.log('ASSET_TEMPLATE_ACCESSED', ctx, { templateType, count: templates.length });
      this.metrics.recordLatency('asset.getTemplatesByType', Date.now() - start);
      this.metrics.incrementCounter('asset.getTemplatesByType.success');
      return { success: true, data: templates };
    } catch (err) {
      this.metrics.incrementCounter('asset.getTemplatesByType.error');
      return { success: false, error: 'Failed to get templates', code: 'GET_TEMPLATES_FAILED' };
    }
  }
}
