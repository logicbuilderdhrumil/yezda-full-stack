/**
 * Use Case: Get Assets By Type
 * Retrieves all assets of a given type for a tenant.
 */
import type {
  AssetType,
  AssetMetadata,
  RequestContext,
  OperationResult,
} from '../../domain/index.js';
import type { IAssetRepository } from '../../domain/ports/IAssetRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class GetAssetsByTypeUseCase {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    type: AssetType,
  ): Promise<OperationResult<AssetMetadata[]>> {
    const start = Date.now();
    try {
      const assets = await this.assetRepo.findByType(ctx.tenantId, type);
      this.audit.log('ASSET_CATALOG_ACCESSED', ctx, { type, count: assets.length });
      this.metrics.recordLatency('asset.getByType', Date.now() - start);
      this.metrics.incrementCounter('asset.getByType.success');
      return { success: true, data: assets };
    } catch (err) {
      this.metrics.incrementCounter('asset.getByType.error');
      return { success: false, error: 'Failed to get assets by type', code: 'GET_BY_TYPE_FAILED' };
    }
  }
}
