/**
 * Theme Metrics Service
 * Task 1.7: Define theme endpoint SLOs and add metrics/alerts
 */

import { THEME_SLOS } from '../models/theme.model.js';

export interface ThemeMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

// Metric names for theme SLOs
export const THEME_METRICS = {
  READ_LATENCY: 'theme_read_latency_ms',
  READ_SUCCESS: 'theme_read_success_total',
  READ_FAILURE: 'theme_read_failure_total',
  WRITE_LATENCY: 'theme_write_latency_ms',
  WRITE_SUCCESS: 'theme_write_success_total',
  WRITE_FAILURE: 'theme_write_failure_total',
  ACCESS_DENIED: 'theme_access_denied_total',
  RATE_LIMIT_HIT: 'theme_rate_limit_hit_total',
  CACHE_HIT: 'theme_cache_hit_total',
  CACHE_MISS: 'theme_cache_miss_total',
} as const;

// In-memory metrics store
const metrics: ThemeMetric[] = [];

export class ThemeMetricsService {
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
    this.recordLatency(THEME_METRICS.READ_LATENCY, durationMs, labels);
    this.incrementCounter(
      success ? THEME_METRICS.READ_SUCCESS : THEME_METRICS.READ_FAILURE,
      labels
    );
  }

  /**
   * Record a write operation
   */
  recordWrite(success: boolean, durationMs: number, labels: Record<string, string> = {}): void {
    this.recordLatency(THEME_METRICS.WRITE_LATENCY, durationMs, labels);
    this.incrementCounter(
      success ? THEME_METRICS.WRITE_SUCCESS : THEME_METRICS.WRITE_FAILURE,
      labels
    );
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(reason: string = 'unknown'): void {
    this.incrementCounter(THEME_METRICS.ACCESS_DENIED, { reason });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string): void {
    this.incrementCounter(THEME_METRICS.RATE_LIMIT_HIT, { endpoint });
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: 'preset' | 'preference'): void {
    this.incrementCounter(THEME_METRICS.CACHE_HIT, { cacheType });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: 'preset' | 'preference'): void {
    this.incrementCounter(THEME_METRICS.CACHE_MISS, { cacheType });
  }

  /**
   * Get metrics for a time window
   */
  getMetrics(windowMs = 60000): ThemeMetric[] {
    const cutoff = new Date(Date.now() - windowMs);
    return metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Calculate read operation success rate
   */
  getReadSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === THEME_METRICS.READ_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === THEME_METRICS.READ_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Calculate write operation success rate
   */
  getWriteSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === THEME_METRICS.WRITE_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === THEME_METRICS.WRITE_FAILURE
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
      .filter((m) => m.name === THEME_METRICS.READ_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Calculate P99 latency for write operations
   */
  getWriteP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === THEME_METRICS.WRITE_LATENCY)
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
    const hits = recentMetrics.filter((m) => m.name === THEME_METRICS.CACHE_HIT).length;
    const misses = recentMetrics.filter((m) => m.name === THEME_METRICS.CACHE_MISS).length;
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
    if (readSuccessRate < THEME_SLOS.READ_SUCCESS_RATE) {
      violations.push(
        `Theme read success rate ${readSuccessRate.toFixed(2)}% below SLO ${THEME_SLOS.READ_SUCCESS_RATE}%`
      );
    }

    // Check write success rate
    const writeSuccessRate = this.getWriteSuccessRate();
    if (writeSuccessRate < THEME_SLOS.WRITE_SUCCESS_RATE) {
      violations.push(
        `Theme write success rate ${writeSuccessRate.toFixed(2)}% below SLO ${THEME_SLOS.WRITE_SUCCESS_RATE}%`
      );
    }

    // Check read P99 latency
    const readP99Latency = this.getReadP99Latency();
    if (readP99Latency > THEME_SLOS.READ_LATENCY_P99_MS) {
      violations.push(
        `Theme read P99 latency ${readP99Latency}ms exceeds SLO ${THEME_SLOS.READ_LATENCY_P99_MS}ms`
      );
    }

    // Check write P99 latency
    const writeP99Latency = this.getWriteP99Latency();
    if (writeP99Latency > THEME_SLOS.WRITE_LATENCY_P99_MS) {
      violations.push(
        `Theme write P99 latency ${writeP99Latency}ms exceeds SLO ${THEME_SLOS.WRITE_LATENCY_P99_MS}ms`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get summary of theme system health
   */
  getHealthSummary(): {
    readSuccessRate: number;
    writeSuccessRate: number;
    readP99Latency: number;
    writeP99Latency: number;
    cacheHitRate: number;
    sloStatus: { met: boolean; violations: string[] };
  } {
    return {
      readSuccessRate: this.getReadSuccessRate(),
      writeSuccessRate: this.getWriteSuccessRate(),
      readP99Latency: this.getReadP99Latency(),
      writeP99Latency: this.getWriteP99Latency(),
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
    console.log(`[ThemeMetrics] Cleaned up ${count - metrics.length} old metrics`);
  }
}

export const themeMetricsService = new ThemeMetricsService();
