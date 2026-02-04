/**
 * Home Dashboard Metrics Service
 * Task 1.7: Define dashboard endpoint SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';

/** Metric names for dashboard operations */
export const DASHBOARD_METRICS = {
  SUMMARY_SUCCESS: 'dashboard_summary_success_total',
  SUMMARY_FAILURE: 'dashboard_summary_failure_total',
  SUMMARY_LATENCY: 'dashboard_summary_latency_ms',
  ACTIVITY_SUCCESS: 'dashboard_activity_success_total',
  ACTIVITY_FAILURE: 'dashboard_activity_failure_total',
  ACTIVITY_LATENCY: 'dashboard_activity_latency_ms',
  TRENDS_SUCCESS: 'dashboard_trends_success_total',
  TRENDS_FAILURE: 'dashboard_trends_failure_total',
  TRENDS_LATENCY: 'dashboard_trends_latency_ms',
  ACCESS_DENIED: 'dashboard_access_denied_total',
  RATE_LIMITED: 'dashboard_rate_limited_total',
  CACHE_HIT: 'dashboard_cache_hit_total',
  CACHE_MISS: 'dashboard_cache_miss_total',
} as const;

/** SLO targets for dashboard endpoints */
export const DASHBOARD_SLOS = {
  // Latency SLOs
  SUMMARY_LATENCY_P99_MS: 300,
  SUMMARY_LATENCY_P95_MS: 150,
  ACTIVITY_LATENCY_P99_MS: 200,
  ACTIVITY_LATENCY_P95_MS: 100,
  TRENDS_LATENCY_P99_MS: 500,
  TRENDS_LATENCY_P95_MS: 250,

  // Availability SLOs
  SUMMARY_SUCCESS_RATE: 99.9,
  ACTIVITY_SUCCESS_RATE: 99.9,
  TRENDS_SUCCESS_RATE: 99.5,

  // Security SLOs
  MAX_ACCESS_DENIED_RATE_PER_MINUTE: 50,
  MAX_RATE_LIMITED_RATE_PER_MINUTE: 100,

  // Cache SLOs
  CACHE_HIT_RATE: 85,
} as const;

class DashboardMetricsService {
  /**
   * Record dashboard summary operation
   */
  recordSummary(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? DASHBOARD_METRICS.SUMMARY_SUCCESS : DASHBOARD_METRICS.SUMMARY_FAILURE
    );
    metricsService.recordLatency(DASHBOARD_METRICS.SUMMARY_LATENCY, durationMs);
  }

  /**
   * Record dashboard activity feed operation
   */
  recordActivity(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? DASHBOARD_METRICS.ACTIVITY_SUCCESS : DASHBOARD_METRICS.ACTIVITY_FAILURE
    );
    metricsService.recordLatency(DASHBOARD_METRICS.ACTIVITY_LATENCY, durationMs);
  }

  /**
   * Record dashboard trends operation
   */
  recordTrends(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? DASHBOARD_METRICS.TRENDS_SUCCESS : DASHBOARD_METRICS.TRENDS_FAILURE
    );
    metricsService.recordLatency(DASHBOARD_METRICS.TRENDS_LATENCY, durationMs);
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(): void {
    metricsService.incrementCounter(DASHBOARD_METRICS.ACCESS_DENIED);
  }

  /**
   * Record rate limit hit
   */
  recordRateLimited(): void {
    metricsService.incrementCounter(DASHBOARD_METRICS.RATE_LIMITED);
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(hit: boolean): void {
    metricsService.incrementCounter(hit ? DASHBOARD_METRICS.CACHE_HIT : DASHBOARD_METRICS.CACHE_MISS);
  }

  /**
   * Get summary operation P99 latency
   */
  getSummaryP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === DASHBOARD_METRICS.SUMMARY_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get summary operation success rate
   */
  getSummarySuccessRate(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === DASHBOARD_METRICS.SUMMARY_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === DASHBOARD_METRICS.SUMMARY_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get activity operation P99 latency
   */
  getActivityP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === DASHBOARD_METRICS.ACTIVITY_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get trends operation P99 latency
   */
  getTrendsP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === DASHBOARD_METRICS.TRENDS_LATENCY)
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
      (m) => m.name === DASHBOARD_METRICS.CACHE_HIT
    ).length;
    const misses = recentMetrics.filter(
      (m) => m.name === DASHBOARD_METRICS.CACHE_MISS
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
      (m) => m.name === DASHBOARD_METRICS.ACCESS_DENIED
    ).length;
  }

  /**
   * Get rate limited count
   */
  getRateLimitedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === DASHBOARD_METRICS.RATE_LIMITED
    ).length;
  }

  /**
   * Check if dashboard SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Summary latency SLO
    const summaryP99Latency = this.getSummaryP99Latency();
    if (summaryP99Latency > DASHBOARD_SLOS.SUMMARY_LATENCY_P99_MS) {
      violations.push(
        `Dashboard summary P99 latency ${summaryP99Latency}ms exceeds SLO ${DASHBOARD_SLOS.SUMMARY_LATENCY_P99_MS}ms`
      );
    }

    // Summary success rate SLO
    const summarySuccessRate = this.getSummarySuccessRate();
    if (summarySuccessRate < DASHBOARD_SLOS.SUMMARY_SUCCESS_RATE) {
      violations.push(
        `Dashboard summary success rate ${summarySuccessRate.toFixed(2)}% below SLO ${DASHBOARD_SLOS.SUMMARY_SUCCESS_RATE}%`
      );
    }

    // Activity latency SLO
    const activityP99Latency = this.getActivityP99Latency();
    if (activityP99Latency > DASHBOARD_SLOS.ACTIVITY_LATENCY_P99_MS) {
      violations.push(
        `Dashboard activity P99 latency ${activityP99Latency}ms exceeds SLO ${DASHBOARD_SLOS.ACTIVITY_LATENCY_P99_MS}ms`
      );
    }

    // Trends latency SLO
    const trendsP99Latency = this.getTrendsP99Latency();
    if (trendsP99Latency > DASHBOARD_SLOS.TRENDS_LATENCY_P99_MS) {
      violations.push(
        `Dashboard trends P99 latency ${trendsP99Latency}ms exceeds SLO ${DASHBOARD_SLOS.TRENDS_LATENCY_P99_MS}ms`
      );
    }

    // Cache hit rate SLO
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < DASHBOARD_SLOS.CACHE_HIT_RATE) {
      violations.push(
        `Dashboard cache hit rate ${cacheHitRate.toFixed(2)}% below SLO ${DASHBOARD_SLOS.CACHE_HIT_RATE}%`
      );
    }

    // Access denied rate
    const accessDeniedCount = this.getAccessDeniedCount();
    if (accessDeniedCount > DASHBOARD_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Dashboard access denied rate ${accessDeniedCount}/min exceeds SLO ${DASHBOARD_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    // Rate limited rate
    const rateLimitedCount = this.getRateLimitedCount();
    if (rateLimitedCount > DASHBOARD_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE) {
      violations.push(
        `Dashboard rate limited rate ${rateLimitedCount}/min exceeds SLO ${DASHBOARD_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }
}

export const dashboardMetricsService = new DashboardMetricsService();
