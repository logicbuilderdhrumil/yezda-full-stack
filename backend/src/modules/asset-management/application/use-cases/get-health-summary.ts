/**
 * Use Case: Get Health Summary
 * Returns asset health metrics for monitoring dashboards.
 */
import type {
  RequestContext,
  OperationResult,
} from '../domain/index.js';
import type { IAssetRepository } from '../domain/ports/IAssetRepository.js';
import type { IMetricsService } from '../domain/ports/IMetricsService.js';

export interface AssetHealthSummary {
  totalAssets: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheckedAt: Date;
}

export class GetHealthSummaryUseCase {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: RequestContext): Promise<OperationResult<AssetHealthSummary>> {
    const start = Date.now();
    try {
      const totalAssets = await this.assetRepo.countByTenant(ctx.tenantId);
      const summary: AssetHealthSummary = {
        totalAssets,
        status: 'healthy',
        lastCheckedAt: new Date(),
      };
      this.metrics.recordLatency('asset.healthSummary', Date.now() - start);
      this.metrics.incrementCounter('asset.healthSummary.success');
      return { success: true, data: summary };
    } catch (err) {
      this.metrics.incrementCounter('asset.healthSummary.error');
      return { success: false, error: 'Failed to get health summary', code: 'HEALTH_CHECK_FAILED' };
    }
  }
}
