/**
 * GetHealthUseCase + GetMetricsUseCase
 */
import type { IBillingLedgerMetricsService } from '../../domain/ports/IBillingLedgerMetricsService.js';

export class GetHealthUseCase {
  constructor(private readonly metrics: IBillingLedgerMetricsService) {}

  execute(): { status: string; [key: string]: unknown } {
    const health = this.metrics.getHealthSummary();
    const sloCheck = this.metrics.checkSLOs();
    return { status: sloCheck.met ? 'healthy' : 'degraded', ...health };
  }
}

export class GetMetricsUseCase {
  constructor(private readonly metrics: IBillingLedgerMetricsService) {}

  execute(): string {
    return this.metrics.exportMetrics();
  }
}
