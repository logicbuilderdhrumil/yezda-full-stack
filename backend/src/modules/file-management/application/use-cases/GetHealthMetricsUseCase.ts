/**
 * GetHealthMetrics Use Case
 * Returns SLO health summary for file management operations.
 */
import type { IFileMetricsService } from '../../domain/ports/IFileMetricsService.js';
import type { OperationResult } from '../../domain/entities/index.js';

type HealthSummary = ReturnType<IFileMetricsService['getHealthSummary']>;

export class GetHealthMetricsUseCase {
  constructor(private readonly metricsService: IFileMetricsService) {}

  execute(): OperationResult<HealthSummary> {
    const summary = this.metricsService.getHealthSummary();
    return { success: true, data: summary };
  }
}
