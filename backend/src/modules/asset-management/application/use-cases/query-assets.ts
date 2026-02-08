/**
 * Use Case: Query Assets
 * Queries assets with filters, returns catalog entries.
 */
import type {
  AssetQueryFilters,
  AssetCatalogEntry,
  RequestContext,
  OperationResult,
} from '../../domain/index.js';
import type { IAssetRepository } from '../../domain/ports/IAssetRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IMetricsService } from '../../domain/ports/IMetricsService.js';

export class QueryAssetsUseCase {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    filters: AssetQueryFilters,
  ): Promise<OperationResult<AssetCatalogEntry[]>> {
    const start = Date.now();
    try {
      const entries = await this.assetRepo.findByFilters(ctx.tenantId, filters);
      this.audit.log('ASSET_CATALOG_ACCESSED', ctx, { filters, count: entries.length });
      this.metrics.recordLatency('asset.query', Date.now() - start);
      this.metrics.incrementCounter('asset.query.success');
      return { success: true, data: entries };
    } catch (err) {
      this.metrics.incrementCounter('asset.query.error');
      return { success: false, error: 'Failed to query assets', code: 'QUERY_FAILED' };
    }
  }
}
