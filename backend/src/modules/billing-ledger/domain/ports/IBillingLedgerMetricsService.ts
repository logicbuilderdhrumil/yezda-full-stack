/**
 * Billing Ledger Metrics Service Port
 */
export interface IBillingLedgerMetricsService {
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
