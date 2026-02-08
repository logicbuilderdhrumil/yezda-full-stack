/**
 * Use Case: Get Asset By ID
 * Retrieves a single asset by ID with tenant access verification.
 */
import type {
  AssetMetadata,
  RequestContext,
  OperationResult,
} from '../domain/index.js';
import type { IAssetRepository } from '../domain/ports/IAssetRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';
import type { IMetricsService } from '../domain/ports/IMetricsService.js';

export class GetAssetByIdUseCase {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    assetId: string,
  ): Promise<OperationResult<AssetMetadata>> {
    const start = Date.now();
    try {
      const asset = await this.assetRepo.findById(ctx.tenantId, assetId);
      if (!asset) {
        this.audit.log('ASSET_ACCESS_DENIED', ctx, { assetId, reason: 'not_found' });
        this.metrics.incrementCounter('asset.getById.notFound');
        return { success: false, error: 'Asset not found', code: 'ASSET_NOT_FOUND' };
      }
      this.audit.log('ASSET_ACCESSED', ctx, { assetId, type: asset.type });
      this.metrics.recordLatency('asset.getById', Date.now() - start);
      this.metrics.incrementCounter('asset.getById.success');
      return { success: true, data: asset };
    } catch (err) {
      this.metrics.incrementCounter('asset.getById.error');
      return { success: false, error: 'Failed to get asset', code: 'GET_ASSET_FAILED' };
    }
  }
}
