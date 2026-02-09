/**
 * Metrics Service Adapter
 *
 * Adapts the shared billing-ledger metrics service to the domain port.
 */
import type { IBillingLedgerMetricsService } from '../../domain/ports/IBillingLedgerMetricsService.js';

interface SharedMetricsService {
  recordLedgerOperation(type: 'billed' | 'unbilled', success: boolean, latencyMs: number): void;
  recordAccessDenied(tenantId: string, userId: string): void;
  recordImmutabilityViolation(tenantId: string, entryId: string): void;
  recordRateLimitHit(endpoint: string): void;
  recordCacheHit(key: string): void;
  recordCacheMiss(key: string): void;
  getHealthSummary(): Record<string, unknown>;
  checkSLOs(): { met: boolean; violations: string[] };
  exportMetrics(): string;
}

export class MetricsServiceAdapter implements IBillingLedgerMetricsService {
  constructor(private readonly shared: SharedMetricsService) {}

  recordLedgerOperation(type: 'billed' | 'unbilled', success: boolean, latencyMs: number): void {
    this.shared.recordLedgerOperation(type, success, latencyMs);
  }

  recordAccessDenied(tenantId: string, userId: string): void {
    this.shared.recordAccessDenied(tenantId, userId);
  }

  recordImmutabilityViolation(tenantId: string, entryId: string): void {
    this.shared.recordImmutabilityViolation(tenantId, entryId);
  }

  recordRateLimitHit(endpoint: string): void {
    this.shared.recordRateLimitHit(endpoint);
  }

  recordCacheHit(key: string): void {
    this.shared.recordCacheHit(key);
  }

  recordCacheMiss(key: string): void {
    this.shared.recordCacheMiss(key);
  }

  getHealthSummary(): Record<string, unknown> {
    return this.shared.getHealthSummary();
  }

  checkSLOs(): { met: boolean; violations: string[] } {
    return this.shared.checkSLOs();
  }

  exportMetrics(): string {
    return this.shared.exportMetrics();
  }
}
