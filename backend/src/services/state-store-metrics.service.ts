/**
 * State Store Metrics Service
 * Task 1.7: Define state store SLOs and add metrics/alerts
 */

import { STATE_STORE_SLOS } from '../models/state-store.model.js';

export interface StateStoreMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

// Metric names for state store SLOs
export const STATE_STORE_METRICS = {
  READ_LATENCY: 'state_store_read_latency_ms',
  READ_SUCCESS: 'state_store_read_success_total',
  READ_FAILURE: 'state_store_read_failure_total',
  WRITE_LATENCY: 'state_store_write_latency_ms',
  WRITE_SUCCESS: 'state_store_write_success_total',
  WRITE_FAILURE: 'state_store_write_failure_total',
  ACCESS_DENIED: 'state_store_access_denied_total',
  RATE_LIMIT_HIT: 'state_store_rate_limit_hit_total',
} as const;

// In-memory metrics store
const metrics: StateStoreMetric[] = [];

export class StateStoreMetricsService {
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
  recordRead(success: boolean, durationMs: number): void {
    this.recordLatency(STATE_STORE_METRICS.READ_LATENCY, durationMs);
    this.incrementCounter(
      success ? STATE_STORE_METRICS.READ_SUCCESS : STATE_STORE_METRICS.READ_FAILURE
    );
  }

  /**
   * Record a write operation
   */
  recordWrite(success: boolean, durationMs: number): void {
    this.recordLatency(STATE_STORE_METRICS.WRITE_LATENCY, durationMs);
    this.incrementCounter(
      success ? STATE_STORE_METRICS.WRITE_SUCCESS : STATE_STORE_METRICS.WRITE_FAILURE
    );
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(): void {
    this.incrementCounter(STATE_STORE_METRICS.ACCESS_DENIED);
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string): void {
    this.incrementCounter(STATE_STORE_METRICS.RATE_LIMIT_HIT, { endpoint });
  }

  /**
   * Get metrics for a time window
   */
  getMetrics(windowMs = 60000): StateStoreMetric[] {
    const cutoff = new Date(Date.now() - windowMs);
    return metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Calculate read operation success rate
   */
  getReadSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === STATE_STORE_METRICS.READ_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === STATE_STORE_METRICS.READ_FAILURE
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
      (m) => m.name === STATE_STORE_METRICS.WRITE_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === STATE_STORE_METRICS.WRITE_FAILURE
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
      .filter((m) => m.name === STATE_STORE_METRICS.READ_LATENCY)
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
      .filter((m) => m.name === STATE_STORE_METRICS.WRITE_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Check if SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check read success rate
    const readSuccessRate = this.getReadSuccessRate();
    if (readSuccessRate < STATE_STORE_SLOS.READ_SUCCESS_RATE) {
      violations.push(
        `State read success rate ${readSuccessRate.toFixed(2)}% below SLO ${STATE_STORE_SLOS.READ_SUCCESS_RATE}%`
      );
    }

    // Check write success rate
    const writeSuccessRate = this.getWriteSuccessRate();
    if (writeSuccessRate < STATE_STORE_SLOS.WRITE_SUCCESS_RATE) {
      violations.push(
        `State write success rate ${writeSuccessRate.toFixed(2)}% below SLO ${STATE_STORE_SLOS.WRITE_SUCCESS_RATE}%`
      );
    }

    // Check read P99 latency
    const readP99Latency = this.getReadP99Latency();
    if (readP99Latency > STATE_STORE_SLOS.READ_LATENCY_P99_MS) {
      violations.push(
        `State read P99 latency ${readP99Latency}ms exceeds SLO ${STATE_STORE_SLOS.READ_LATENCY_P99_MS}ms`
      );
    }

    // Check write P99 latency
    const writeP99Latency = this.getWriteP99Latency();
    if (writeP99Latency > STATE_STORE_SLOS.WRITE_LATENCY_P99_MS) {
      violations.push(
        `State write P99 latency ${writeP99Latency}ms exceeds SLO ${STATE_STORE_SLOS.WRITE_LATENCY_P99_MS}ms`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get summary of state store health
   */
  getHealthSummary(): {
    readSuccessRate: number;
    writeSuccessRate: number;
    readP99Latency: number;
    writeP99Latency: number;
    sloStatus: { met: boolean; violations: string[] };
  } {
    return {
      readSuccessRate: this.getReadSuccessRate(),
      writeSuccessRate: this.getWriteSuccessRate(),
      readP99Latency: this.getReadP99Latency(),
      writeP99Latency: this.getWriteP99Latency(),
      sloStatus: this.checkSLOs(),
    };
  }

  /**
   * Clear old metrics
   */
  cleanup(retentionMs = 3600000): void {
    const count = metrics.length;
    if (retentionMs === 0) {
      // Clear all metrics
      metrics.length = 0;
    } else {
      const cutoff = new Date(Date.now() - retentionMs);
      const indexToCut = metrics.findIndex((m) => m.timestamp > cutoff);
      if (indexToCut > 0) {
        metrics.splice(0, indexToCut);
      } else if (indexToCut === -1 && metrics.length > 0) {
        // All metrics are older than cutoff
        metrics.length = 0;
      }
    }
    console.log(`[StateStoreMetrics] Cleaned up ${count - metrics.length} old metrics`);
  }
}

export const stateStoreMetricsService = new StateStoreMetricsService();
