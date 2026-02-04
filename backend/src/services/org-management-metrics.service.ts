/**
 * Organization Metrics Service
 * Task 1.8: Define organization endpoint SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';

/** Metric names for organization operations */
export const ORG_METRICS = {
  CREATE_SUCCESS: 'org_create_success_total',
  CREATE_FAILURE: 'org_create_failure_total',
  CREATE_LATENCY: 'org_create_latency_ms',
  UPDATE_SUCCESS: 'org_update_success_total',
  UPDATE_FAILURE: 'org_update_failure_total',
  UPDATE_LATENCY: 'org_update_latency_ms',
  READ_SUCCESS: 'org_read_success_total',
  READ_FAILURE: 'org_read_failure_total',
  READ_LATENCY: 'org_read_latency_ms',
  LIST_SUCCESS: 'org_list_success_total',
  LIST_FAILURE: 'org_list_failure_total',
  LIST_LATENCY: 'org_list_latency_ms',
  SEARCH_SUCCESS: 'org_search_success_total',
  SEARCH_FAILURE: 'org_search_failure_total',
  SEARCH_LATENCY: 'org_search_latency_ms',
  ACCESS_DENIED: 'org_access_denied_total',
  RATE_LIMITED: 'org_rate_limited_total',
  CACHE_HIT: 'org_cache_hit_total',
  CACHE_MISS: 'org_cache_miss_total',
} as const;

/** SLO targets for organization endpoints */
export const ORG_SLOS = {
  // Latency SLOs
  LIST_LATENCY_P99_MS: 200,
  LIST_LATENCY_P95_MS: 100,
  READ_LATENCY_P99_MS: 100,
  READ_LATENCY_P95_MS: 50,
  CREATE_LATENCY_P99_MS: 300,
  CREATE_LATENCY_P95_MS: 150,
  UPDATE_LATENCY_P99_MS: 200,
  UPDATE_LATENCY_P95_MS: 100,

  // Availability SLOs
  LIST_SUCCESS_RATE: 99.9,
  READ_SUCCESS_RATE: 99.9,
  CREATE_SUCCESS_RATE: 99.5,
  UPDATE_SUCCESS_RATE: 99.5,

  // Security SLOs
  MAX_ACCESS_DENIED_RATE_PER_MINUTE: 50,
  MAX_RATE_LIMITED_RATE_PER_MINUTE: 100,

  // Cache SLOs
  CACHE_HIT_RATE: 80,
} as const;

class OrganizationMetricsService {
  /**
   * Record organization create operation
   */
  recordCreate(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? ORG_METRICS.CREATE_SUCCESS : ORG_METRICS.CREATE_FAILURE
    );
    metricsService.recordLatency(ORG_METRICS.CREATE_LATENCY, durationMs);
  }

  /**
   * Record organization update operation
   */
  recordUpdate(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? ORG_METRICS.UPDATE_SUCCESS : ORG_METRICS.UPDATE_FAILURE
    );
    metricsService.recordLatency(ORG_METRICS.UPDATE_LATENCY, durationMs);
  }

  /**
   * Record organization read operation
   */
  recordRead(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? ORG_METRICS.READ_SUCCESS : ORG_METRICS.READ_FAILURE
    );
    metricsService.recordLatency(ORG_METRICS.READ_LATENCY, durationMs);
  }

  /**
   * Record organization list operation
   */
  recordList(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? ORG_METRICS.LIST_SUCCESS : ORG_METRICS.LIST_FAILURE
    );
    metricsService.recordLatency(ORG_METRICS.LIST_LATENCY, durationMs);
  }

  /**
   * Record organization search operation
   */
  recordSearch(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? ORG_METRICS.SEARCH_SUCCESS : ORG_METRICS.SEARCH_FAILURE
    );
    metricsService.recordLatency(ORG_METRICS.SEARCH_LATENCY, durationMs);
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(): void {
    metricsService.incrementCounter(ORG_METRICS.ACCESS_DENIED);
  }

  /**
   * Record rate limit hit
   */
  recordRateLimited(): void {
    metricsService.incrementCounter(ORG_METRICS.RATE_LIMITED);
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(hit: boolean): void {
    metricsService.incrementCounter(hit ? ORG_METRICS.CACHE_HIT : ORG_METRICS.CACHE_MISS);
  }

  /**
   * Get list operation P99 latency
   */
  getListP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === ORG_METRICS.LIST_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get list operation success rate
   */
  getListSuccessRate(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === ORG_METRICS.LIST_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === ORG_METRICS.LIST_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get read operation P99 latency
   */
  getReadP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === ORG_METRICS.READ_LATENCY)
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
      (m) => m.name === ORG_METRICS.CACHE_HIT
    ).length;
    const misses = recentMetrics.filter(
      (m) => m.name === ORG_METRICS.CACHE_MISS
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
      (m) => m.name === ORG_METRICS.ACCESS_DENIED
    ).length;
  }

  /**
   * Get rate limited count
   */
  getRateLimitedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === ORG_METRICS.RATE_LIMITED
    ).length;
  }

  /**
   * Check if organization SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // List latency SLO
    const listP99Latency = this.getListP99Latency();
    if (listP99Latency > ORG_SLOS.LIST_LATENCY_P99_MS) {
      violations.push(
        `Organization list P99 latency ${listP99Latency}ms exceeds SLO ${ORG_SLOS.LIST_LATENCY_P99_MS}ms`
      );
    }

    // List success rate SLO
    const listSuccessRate = this.getListSuccessRate();
    if (listSuccessRate < ORG_SLOS.LIST_SUCCESS_RATE) {
      violations.push(
        `Organization list success rate ${listSuccessRate.toFixed(2)}% below SLO ${ORG_SLOS.LIST_SUCCESS_RATE}%`
      );
    }

    // Read latency SLO
    const readP99Latency = this.getReadP99Latency();
    if (readP99Latency > ORG_SLOS.READ_LATENCY_P99_MS) {
      violations.push(
        `Organization read P99 latency ${readP99Latency}ms exceeds SLO ${ORG_SLOS.READ_LATENCY_P99_MS}ms`
      );
    }

    // Cache hit rate SLO
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < ORG_SLOS.CACHE_HIT_RATE) {
      violations.push(
        `Organization cache hit rate ${cacheHitRate.toFixed(2)}% below SLO ${ORG_SLOS.CACHE_HIT_RATE}%`
      );
    }

    // Access denied rate
    const accessDeniedCount = this.getAccessDeniedCount();
    if (accessDeniedCount > ORG_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Organization access denied rate ${accessDeniedCount}/min exceeds SLO ${ORG_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    // Rate limited rate
    const rateLimitedCount = this.getRateLimitedCount();
    if (rateLimitedCount > ORG_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE) {
      violations.push(
        `Organization rate limited rate ${rateLimitedCount}/min exceeds SLO ${ORG_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }
}

export const orgMetricsService = new OrganizationMetricsService();
