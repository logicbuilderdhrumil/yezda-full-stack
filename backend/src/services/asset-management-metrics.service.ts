/**
 * Asset Management Metrics Service
 * Task 1.7: Define asset endpoint SLOs and add metrics/alerts
 */

import { ASSET_SLOS } from '../models/asset-management.model.js';

export interface AssetMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

// Metric names for asset SLOs
export const ASSET_METRICS = {
  READ_LATENCY: 'asset_read_latency_ms',
  READ_SUCCESS: 'asset_read_success_total',
  READ_FAILURE: 'asset_read_failure_total',
  CATALOG_LATENCY: 'asset_catalog_latency_ms',
  CATALOG_SUCCESS: 'asset_catalog_success_total',
  CATALOG_FAILURE: 'asset_catalog_failure_total',
  TEMPLATE_LATENCY: 'asset_template_latency_ms',
  TEMPLATE_SUCCESS: 'asset_template_success_total',
  TEMPLATE_FAILURE: 'asset_template_failure_total',
  ACCESS_DENIED: 'asset_access_denied_total',
  RATE_LIMIT_HIT: 'asset_rate_limit_hit_total',
  CACHE_HIT: 'asset_cache_hit_total',
  CACHE_MISS: 'asset_cache_miss_total',
} as const;

// In-memory metrics store
const metrics: AssetMetric[] = [];

export class AssetMetricsService {
  /**
   * Record a counter metric
   */
  private incrementCounter(name: string, labels: Record<string, string> = {}): void {
    metrics.push({
      name,
      type: 'counter',
      value: 1,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Record a histogram/latency metric
   */
  private recordLatency(name: string, durationMs: number, labels: Record<string, string> = {}): void {
    metrics.push({
      name,
      type: 'histogram',
      value: durationMs,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Record a read operation
   */
  recordRead(success: boolean, durationMs: number, labels: Record<string, string> = {}): void {
    this.recordLatency(ASSET_METRICS.READ_LATENCY, durationMs, labels);
    this.incrementCounter(
      success ? ASSET_METRICS.READ_SUCCESS : ASSET_METRICS.READ_FAILURE,
      labels
    );
  }

  /**
   * Record a catalog operation
   */
  recordCatalog(success: boolean, durationMs: number, labels: Record<string, string> = {}): void {
    this.recordLatency(ASSET_METRICS.CATALOG_LATENCY, durationMs, labels);
    this.incrementCounter(
      success ? ASSET_METRICS.CATALOG_SUCCESS : ASSET_METRICS.CATALOG_FAILURE,
      labels
    );
  }

  /**
   * Record a template retrieval operation
   */
  recordTemplate(success: boolean, durationMs: number, labels: Record<string, string> = {}): void {
    this.recordLatency(ASSET_METRICS.TEMPLATE_LATENCY, durationMs, labels);
    this.incrementCounter(
      success ? ASSET_METRICS.TEMPLATE_SUCCESS : ASSET_METRICS.TEMPLATE_FAILURE,
      labels
    );
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(reason: string = 'unknown'): void {
    this.incrementCounter(ASSET_METRICS.ACCESS_DENIED, { reason });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string): void {
    this.incrementCounter(ASSET_METRICS.RATE_LIMIT_HIT, { endpoint });
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: 'asset' | 'catalog' | 'template'): void {
    this.incrementCounter(ASSET_METRICS.CACHE_HIT, { cacheType });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: 'asset' | 'catalog' | 'template'): void {
    this.incrementCounter(ASSET_METRICS.CACHE_MISS, { cacheType });
  }

  /**
   * Get metrics for a time window
   */
  getMetrics(windowMs = 60000): AssetMetric[] {
    const cutoff = new Date(Date.now() - windowMs);
    return metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Calculate read operation success rate
   */
  getReadSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === ASSET_METRICS.READ_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === ASSET_METRICS.READ_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Calculate catalog operation success rate
   */
  getCatalogSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === ASSET_METRICS.CATALOG_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === ASSET_METRICS.CATALOG_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Calculate P99 latency for read operations
   */
  getReadP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === ASSET_METRICS.READ_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Calculate P99 latency for catalog operations
   */
  getCatalogP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === ASSET_METRICS.CATALOG_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Calculate P99 latency for template operations
   */
  getTemplateP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === ASSET_METRICS.TEMPLATE_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Calculate cache hit rate
   */
  getCacheHitRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const hits = recentMetrics.filter((m) => m.name === ASSET_METRICS.CACHE_HIT).length;
    const misses = recentMetrics.filter((m) => m.name === ASSET_METRICS.CACHE_MISS).length;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 100;
  }

  /**
   * Check if SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check read success rate
    const readSuccessRate = this.getReadSuccessRate();
    if (readSuccessRate < ASSET_SLOS.READ_SUCCESS_RATE) {
      violations.push(
        `Asset read success rate ${readSuccessRate.toFixed(2)}% below SLO ${ASSET_SLOS.READ_SUCCESS_RATE}%`
      );
    }

    // Check catalog success rate
    const catalogSuccessRate = this.getCatalogSuccessRate();
    if (catalogSuccessRate < ASSET_SLOS.CATALOG_SUCCESS_RATE) {
      violations.push(
        `Asset catalog success rate ${catalogSuccessRate.toFixed(2)}% below SLO ${ASSET_SLOS.CATALOG_SUCCESS_RATE}%`
      );
    }

    // Check read P99 latency
    const readP99Latency = this.getReadP99Latency();
    if (readP99Latency > ASSET_SLOS.READ_LATENCY_P99_MS) {
      violations.push(
        `Asset read P99 latency ${readP99Latency}ms exceeds SLO ${ASSET_SLOS.READ_LATENCY_P99_MS}ms`
      );
    }

    // Check catalog P99 latency
    const catalogP99Latency = this.getCatalogP99Latency();
    if (catalogP99Latency > ASSET_SLOS.CATALOG_LATENCY_P99_MS) {
      violations.push(
        `Asset catalog P99 latency ${catalogP99Latency}ms exceeds SLO ${ASSET_SLOS.CATALOG_LATENCY_P99_MS}ms`
      );
    }

    // Check template P99 latency
    const templateP99Latency = this.getTemplateP99Latency();
    if (templateP99Latency > ASSET_SLOS.TEMPLATE_LATENCY_P99_MS) {
      violations.push(
        `Asset template P99 latency ${templateP99Latency}ms exceeds SLO ${ASSET_SLOS.TEMPLATE_LATENCY_P99_MS}ms`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get summary of asset system health
   */
  getHealthSummary(): {
    readSuccessRate: number;
    catalogSuccessRate: number;
    readP99Latency: number;
    catalogP99Latency: number;
    templateP99Latency: number;
    cacheHitRate: number;
    sloStatus: { met: boolean; violations: string[] };
  } {
    return {
      readSuccessRate: this.getReadSuccessRate(),
      catalogSuccessRate: this.getCatalogSuccessRate(),
      readP99Latency: this.getReadP99Latency(),
      catalogP99Latency: this.getCatalogP99Latency(),
      templateP99Latency: this.getTemplateP99Latency(),
      cacheHitRate: this.getCacheHitRate(),
      sloStatus: this.checkSLOs(),
    };
  }

  /**
   * Clear old metrics
   */
  cleanup(retentionMs = 3600000): void {
    const cutoff = new Date(Date.now() - retentionMs);
    const count = metrics.length;
    const indexToCut = metrics.findIndex((m) => m.timestamp > cutoff);
    if (indexToCut > 0) {
      metrics.splice(0, indexToCut);
    }
    console.log(`[AssetMetrics] Cleaned up ${count - metrics.length} old metrics`);
  }
}

export const assetMetricsService = new AssetMetricsService();
