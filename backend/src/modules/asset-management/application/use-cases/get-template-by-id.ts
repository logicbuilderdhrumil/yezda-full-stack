/**
 * Use Case: Get Template By ID
 * Retrieves a single template asset by ID.
 */
import type {
  TemplateAsset,
  RequestContext,
  OperationResult,
} from '../domain/index.js';
import type { IAssetRepository } from '../domain/ports/IAssetRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';
import type { IMetricsService } from '../domain/ports/IMetricsService.js';

export class GetTemplateByIdUseCase {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    templateId: string,
  ): Promise<OperationResult<TemplateAsset>> {
    const start = Date.now();
    try {
      const template = await this.assetRepo.findTemplateById(ctx.tenantId, templateId);
      if (!template) {
        this.audit.log('ASSET_ACCESS_DENIED', ctx, { templateId, reason: 'not_found' });
        this.metrics.incrementCounter('asset.getTemplateById.notFound');
        return { success: false, error: 'Template not found', code: 'TEMPLATE_NOT_FOUND' };
      }
      this.audit.log('ASSET_TEMPLATE_ACCESSED', ctx, { templateId, templateType: template.templateType });
      this.metrics.recordLatency('asset.getTemplateById', Date.now() - start);
      this.metrics.incrementCounter('asset.getTemplateById.success');
      return { success: true, data: template };
    } catch (err) {
      this.metrics.incrementCounter('asset.getTemplateById.error');
      return { success: false, error: 'Failed to get template', code: 'GET_TEMPLATE_FAILED' };
    }
  }
}
