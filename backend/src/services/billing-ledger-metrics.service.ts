/**
 * Billing Ledger Metrics Service
 * Task 1.8: Define ledger endpoint SLOs and add metrics/alerts
 */

import { BILLING_LEDGER_SLOS, BILLING_LEDGER_METRICS } from '../models/billing-ledger.model.js';

interface LatencyBucket {
  operationLatencies: number[];
  successCount: number;
  errorCount: number;
}

interface MetricsWindow {
  billed: LatencyBucket;
  unbilled: LatencyBucket;
  accessDenied: number;
  immutabilityViolations: number;
  rateLimitHits: number;
  cacheHits: number;
  cacheMisses: number;
  windowStart: number;
}

const WINDOW_DURATION_MS = 60000; // 1 minute window

export class BillingLedgerMetricsService {
  private currentWindow: MetricsWindow = this.createNewWindow();
  private previousWindow: MetricsWindow | null = null;

  private createNewWindow(): MetricsWindow {
    return {
      billed: { operationLatencies: [], successCount: 0, errorCount: 0 },
      unbilled: { operationLatencies: [], successCount: 0, errorCount: 0 },
      accessDenied: 0,
      immutabilityViolations: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0,
      windowStart: Date.now(),
    };
  }

  private rotateWindowIfNeeded(): void {
    const now = Date.now();
    if (now - this.currentWindow.windowStart >= WINDOW_DURATION_MS) {
      this.previousWindow = this.currentWindow;
      this.currentWindow = this.createNewWindow();
    }
  }

  /**
   * Record a ledger list operation
   */
  recordLedgerOperation(
    type: 'billed' | 'unbilled',
    success: boolean,
    latencyMs: number
  ): void {
    this.rotateWindowIfNeeded();
    const bucket = this.currentWindow[type];
    bucket.operationLatencies.push(latencyMs);
    if (success) {
      bucket.successCount++;
    } else {
      bucket.errorCount++;
    }
  }

  /**
   * Record an access denied event
   */
  recordAccessDenied(tenantId: string, userId: string): void {
    this.rotateWindowIfNeeded();
    this.currentWindow.accessDenied++;
    console.warn(
      `[BillingLedgerMetrics] Access denied: tenant=${tenantId}, user=${userId}`
    );
  }

  /**
   * Record an immutability violation attempt
   */
  recordImmutabilityViolation(tenantId: string, entryId: string): void {
    this.rotateWindowIfNeeded();
    this.currentWindow.immutabilityViolations++;
    console.warn(
      `[BillingLedgerMetrics] Immutability violation attempt: tenant=${tenantId}, entry=${entryId}`
    );
  }

  /**
   * Record a rate limit hit
   */
  recordRateLimitHit(endpoint: string): void {
    this.rotateWindowIfNeeded();
    this.currentWindow.rateLimitHits++;
    console.warn(`[BillingLedgerMetrics] Rate limit hit: endpoint=${endpoint}`);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(_key: string): void {
    this.rotateWindowIfNeeded();
    this.currentWindow.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(_key: string): void {
    this.rotateWindowIfNeeded();
    this.currentWindow.cacheMisses++;
  }

  /**
   * Calculate percentile from sorted latencies
   */
  private calculatePercentile(latencies: number[], percentile: number): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Check SLO compliance
   * Task 1.8: SLO monitoring
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    this.rotateWindowIfNeeded();
    const violations: string[] = [];
    const window = this.previousWindow || this.currentWindow;

    // Check billed list latency
    const billedP99 = this.calculatePercentile(window.billed.operationLatencies, 99);
    const billedP95 = this.calculatePercentile(window.billed.operationLatencies, 95);

    if (billedP99 > BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P99_MS) {
      violations.push(
        `billed_list_p99_latency: ${billedP99}ms > ${BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P99_MS}ms`
      );
    }
    if (billedP95 > BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P95_MS) {
      violations.push(
        `billed_list_p95_latency: ${billedP95}ms > ${BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P95_MS}ms`
      );
    }

    // Check unbilled list latency
    const unbilledP99 = this.calculatePercentile(window.unbilled.operationLatencies, 99);
    const unbilledP95 = this.calculatePercentile(window.unbilled.operationLatencies, 95);

    if (unbilledP99 > BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P99_MS) {
      violations.push(
        `unbilled_list_p99_latency: ${unbilledP99}ms > ${BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P99_MS}ms`
      );
    }
    if (unbilledP95 > BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P95_MS) {
      violations.push(
        `unbilled_list_p95_latency: ${unbilledP95}ms > ${BILLING_LEDGER_SLOS.LEDGER_LIST_LATENCY_P95_MS}ms`
      );
    }

    // Check availability
    const totalBilled = window.billed.successCount + window.billed.errorCount;
    const totalUnbilled = window.unbilled.successCount + window.unbilled.errorCount;
    const totalSuccess = window.billed.successCount + window.unbilled.successCount;
    const totalOps = totalBilled + totalUnbilled;

    if (totalOps > 0) {
      const availabilityRate = (totalSuccess / totalOps) * 100;
      if (availabilityRate < BILLING_LEDGER_SLOS.LEDGER_AVAILABILITY_RATE) {
        violations.push(
          `availability: ${availabilityRate.toFixed(2)}% < ${BILLING_LEDGER_SLOS.LEDGER_AVAILABILITY_RATE}%`
        );
      }
    }

    // Check rate limit hits
    if (window.rateLimitHits > BILLING_LEDGER_SLOS.MAX_LEDGER_RATE_LIMIT_HITS_PER_MINUTE) {
      violations.push(
        `rate_limit_hits: ${window.rateLimitHits} > ${BILLING_LEDGER_SLOS.MAX_LEDGER_RATE_LIMIT_HITS_PER_MINUTE}`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get health summary
   * Task 1.8: Metrics/alerts
   */
  getHealthSummary(): {
    billedListP99Ms: number;
    billedListP95Ms: number;
    unbilledListP99Ms: number;
    unbilledListP95Ms: number;
    billedSuccessRate: number;
    unbilledSuccessRate: number;
    accessDeniedCount: number;
    immutabilityViolationCount: number;
    rateLimitHits: number;
    cacheHitRate: number;
    sloViolations: string[];
  } {
    this.rotateWindowIfNeeded();
    const window = this.previousWindow || this.currentWindow;

    const billedTotal = window.billed.successCount + window.billed.errorCount;
    const unbilledTotal = window.unbilled.successCount + window.unbilled.errorCount;
    const cacheTotal = window.cacheHits + window.cacheMisses;

    const sloCheck = this.checkSLOs();

    return {
      billedListP99Ms: this.calculatePercentile(window.billed.operationLatencies, 99),
      billedListP95Ms: this.calculatePercentile(window.billed.operationLatencies, 95),
      unbilledListP99Ms: this.calculatePercentile(window.unbilled.operationLatencies, 99),
      unbilledListP95Ms: this.calculatePercentile(window.unbilled.operationLatencies, 95),
      billedSuccessRate: billedTotal > 0
        ? (window.billed.successCount / billedTotal) * 100
        : 100,
      unbilledSuccessRate: unbilledTotal > 0
        ? (window.unbilled.successCount / unbilledTotal) * 100
        : 100,
      accessDeniedCount: window.accessDenied,
      immutabilityViolationCount: window.immutabilityViolations,
      rateLimitHits: window.rateLimitHits,
      cacheHitRate: cacheTotal > 0
        ? (window.cacheHits / cacheTotal) * 100
        : 0,
      sloViolations: sloCheck.violations,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportMetrics(): string {
    const summary = this.getHealthSummary();
    const lines: string[] = [];

    lines.push(`# HELP ${BILLING_LEDGER_METRICS.LEDGER_LATENCY} Ledger operation latency in milliseconds`);
    lines.push(`# TYPE ${BILLING_LEDGER_METRICS.LEDGER_LATENCY} histogram`);
    lines.push(`${BILLING_LEDGER_METRICS.LEDGER_LATENCY}{type="billed",quantile="0.95"} ${summary.billedListP95Ms}`);
    lines.push(`${BILLING_LEDGER_METRICS.LEDGER_LATENCY}{type="billed",quantile="0.99"} ${summary.billedListP99Ms}`);
    lines.push(`${BILLING_LEDGER_METRICS.LEDGER_LATENCY}{type="unbilled",quantile="0.95"} ${summary.unbilledListP95Ms}`);
    lines.push(`${BILLING_LEDGER_METRICS.LEDGER_LATENCY}{type="unbilled",quantile="0.99"} ${summary.unbilledListP99Ms}`);

    lines.push(`# HELP ${BILLING_LEDGER_METRICS.ACCESS_DENIED} Count of access denied events`);
    lines.push(`# TYPE ${BILLING_LEDGER_METRICS.ACCESS_DENIED} counter`);
    lines.push(`${BILLING_LEDGER_METRICS.ACCESS_DENIED} ${summary.accessDeniedCount}`);

    lines.push(`# HELP ${BILLING_LEDGER_METRICS.IMMUTABILITY_VIOLATION} Count of immutability violation attempts`);
    lines.push(`# TYPE ${BILLING_LEDGER_METRICS.IMMUTABILITY_VIOLATION} counter`);
    lines.push(`${BILLING_LEDGER_METRICS.IMMUTABILITY_VIOLATION} ${summary.immutabilityViolationCount}`);

    lines.push(`# HELP ${BILLING_LEDGER_METRICS.RATE_LIMIT_HIT} Count of rate limit hits`);
    lines.push(`# TYPE ${BILLING_LEDGER_METRICS.RATE_LIMIT_HIT} counter`);
    lines.push(`${BILLING_LEDGER_METRICS.RATE_LIMIT_HIT} ${summary.rateLimitHits}`);

    lines.push(`# HELP ${BILLING_LEDGER_METRICS.CACHE_HIT} Cache hit rate`);
    lines.push(`# TYPE ${BILLING_LEDGER_METRICS.CACHE_HIT} gauge`);
    lines.push(`${BILLING_LEDGER_METRICS.CACHE_HIT} ${summary.cacheHitRate}`);

    return lines.join('\n');
  }
}

export const billingLedgerMetricsService = new BillingLedgerMetricsService();
