/**
 * Charting Metrics Service
 * Task 1.7: Define chart endpoint SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';

/** Metric names for charting operations */
export const CHART_METRICS = {
  QUERY_SUCCESS: 'chart_query_success_total',
  QUERY_FAILURE: 'chart_query_failure_total',
  QUERY_LATENCY: 'chart_query_latency_ms',
  AGGREGATE_SUCCESS: 'chart_aggregate_success_total',
  AGGREGATE_FAILURE: 'chart_aggregate_failure_total',
  AGGREGATE_LATENCY: 'chart_aggregate_latency_ms',
  METRICS_LIST_SUCCESS: 'chart_metrics_list_success_total',
  METRICS_LIST_FAILURE: 'chart_metrics_list_failure_total',
  METRICS_LIST_LATENCY: 'chart_metrics_list_latency_ms',
  ACCESS_DENIED: 'chart_access_denied_total',
  RATE_LIMITED: 'chart_rate_limited_total',
  CACHE_HIT: 'chart_cache_hit_total',
  CACHE_MISS: 'chart_cache_miss_total',
} as const;

/** SLO targets for charting endpoints */
export const CHART_SLOS = {
  // Latency SLOs
  QUERY_LATENCY_P99_MS: 500,
  QUERY_LATENCY_P95_MS: 200,
  AGGREGATE_LATENCY_P99_MS: 300,
  AGGREGATE_LATENCY_P95_MS: 150,
  METRICS_LIST_LATENCY_P99_MS: 100,
  METRICS_LIST_LATENCY_P95_MS: 50,

  // Availability SLOs
  QUERY_SUCCESS_RATE: 99.5,
  AGGREGATE_SUCCESS_RATE: 99.5,
  METRICS_LIST_SUCCESS_RATE: 99.9,

  // Security SLOs
  MAX_ACCESS_DENIED_RATE_PER_MINUTE: 50,
  MAX_RATE_LIMITED_RATE_PER_MINUTE: 100,

  // Cache SLOs
  CACHE_HIT_RATE: 70, // Lower than org because chart data is more dynamic
} as const;

class ChartingMetricsService {
  /**
   * Record chart query operation
   */
  recordQuery(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? CHART_METRICS.QUERY_SUCCESS : CHART_METRICS.QUERY_FAILURE
    );
    metricsService.recordLatency(CHART_METRICS.QUERY_LATENCY, durationMs);
  }

  /**
   * Record chart aggregation operation
   */
  recordAggregate(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? CHART_METRICS.AGGREGATE_SUCCESS : CHART_METRICS.AGGREGATE_FAILURE
    );
    metricsService.recordLatency(CHART_METRICS.AGGREGATE_LATENCY, durationMs);
  }

  /**
   * Record metrics list operation
   */
  recordMetricsList(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? CHART_METRICS.METRICS_LIST_SUCCESS : CHART_METRICS.METRICS_LIST_FAILURE
    );
    metricsService.recordLatency(CHART_METRICS.METRICS_LIST_LATENCY, durationMs);
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(): void {
    metricsService.incrementCounter(CHART_METRICS.ACCESS_DENIED);
  }

  /**
   * Record rate limit hit
   */
  recordRateLimited(): void {
    metricsService.incrementCounter(CHART_METRICS.RATE_LIMITED);
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(hit: boolean): void {
    metricsService.incrementCounter(hit ? CHART_METRICS.CACHE_HIT : CHART_METRICS.CACHE_MISS);
  }

  /**
   * Get query operation P99 latency
   */
  getQueryP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === CHART_METRICS.QUERY_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get query operation success rate
   */
  getQuerySuccessRate(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === CHART_METRICS.QUERY_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === CHART_METRICS.QUERY_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get aggregate operation P99 latency
   */
  getAggregateP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === CHART_METRICS.AGGREGATE_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const hits = recentMetrics.filter(
      (m) => m.name === CHART_METRICS.CACHE_HIT
    ).length;
    const misses = recentMetrics.filter(
      (m) => m.name === CHART_METRICS.CACHE_MISS
    ).length;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 100;
  }

  /**
   * Get access denied count
   */
  getAccessDeniedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === CHART_METRICS.ACCESS_DENIED
    ).length;
  }

  /**
   * Get rate limited count
   */
  getRateLimitedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === CHART_METRICS.RATE_LIMITED
    ).length;
  }

  /**
   * Check if charting SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Query latency SLO
    const queryP99Latency = this.getQueryP99Latency();
    if (queryP99Latency > CHART_SLOS.QUERY_LATENCY_P99_MS) {
      violations.push(
        `Chart query P99 latency ${queryP99Latency}ms exceeds SLO ${CHART_SLOS.QUERY_LATENCY_P99_MS}ms`
      );
    }

    // Query success rate SLO
    const querySuccessRate = this.getQuerySuccessRate();
    if (querySuccessRate < CHART_SLOS.QUERY_SUCCESS_RATE) {
      violations.push(
        `Chart query success rate ${querySuccessRate.toFixed(2)}% below SLO ${CHART_SLOS.QUERY_SUCCESS_RATE}%`
      );
    }

    // Aggregate latency SLO
    const aggregateP99Latency = this.getAggregateP99Latency();
    if (aggregateP99Latency > CHART_SLOS.AGGREGATE_LATENCY_P99_MS) {
      violations.push(
        `Chart aggregate P99 latency ${aggregateP99Latency}ms exceeds SLO ${CHART_SLOS.AGGREGATE_LATENCY_P99_MS}ms`
      );
    }

    // Cache hit rate SLO
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < CHART_SLOS.CACHE_HIT_RATE) {
      violations.push(
        `Chart cache hit rate ${cacheHitRate.toFixed(2)}% below SLO ${CHART_SLOS.CACHE_HIT_RATE}%`
      );
    }

    // Access denied rate
    const accessDeniedCount = this.getAccessDeniedCount();
    if (accessDeniedCount > CHART_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Chart access denied rate ${accessDeniedCount}/min exceeds SLO ${CHART_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    // Rate limited rate
    const rateLimitedCount = this.getRateLimitedCount();
    if (rateLimitedCount > CHART_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE) {
      violations.push(
        `Chart rate limited rate ${rateLimitedCount}/min exceeds SLO ${CHART_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }
}

export const chartingMetricsService = new ChartingMetricsService();
