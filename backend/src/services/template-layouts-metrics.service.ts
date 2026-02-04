/**
 * Template Layouts Metrics Service
 * Task 1.8: SLO targets and metrics/alerts for layout endpoints
 */

import { metricsService } from './metrics.service.js';

// Metric names for template layout operations
export const TEMPLATE_LAYOUT_METRICS = {
  NAVIGATION_REQUEST: 'template_layout_navigation_request_total',
  PROFILE_SUMMARY_REQUEST: 'template_layout_profile_summary_request_total',
  REQUEST_LATENCY: 'template_layout_request_latency_ms',
  CACHE_HIT: 'template_layout_cache_hit_total',
  CACHE_MISS: 'template_layout_cache_miss_total',
  ACCESS_DENIED: 'template_layout_access_denied_total',
  RATE_LIMIT_HIT: 'template_layout_rate_limit_hit_total',
} as const;

// SLO targets for template layout endpoints
export const TEMPLATE_LAYOUT_SLOS = {
  // Latency SLOs
  NAVIGATION_LATENCY_P99_MS: 100,
  NAVIGATION_LATENCY_P95_MS: 50,
  PROFILE_SUMMARY_LATENCY_P99_MS: 150,
  PROFILE_SUMMARY_LATENCY_P95_MS: 75,

  // Availability SLOs
  AVAILABILITY_RATE: 99.9,

  // Cache efficiency SLOs
  CACHE_HIT_RATE_MIN: 80,

  // Rate limiting SLOs
  MAX_RATE_LIMIT_HITS_PER_MINUTE: 100,

  // Access control SLOs
  MAX_ACCESS_DENIED_RATE_PER_MINUTE: 50,
} as const;

export class TemplateLayoutsMetricsService {
  /**
   * Record navigation request
   */
  recordNavigationRequest(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(TEMPLATE_LAYOUT_METRICS.NAVIGATION_REQUEST, {
      success: String(success),
    });
    metricsService.recordLatency(TEMPLATE_LAYOUT_METRICS.REQUEST_LATENCY, durationMs, {
      operation: 'navigation',
    });
  }

  /**
   * Record profile summary request
   */
  recordProfileSummaryRequest(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(TEMPLATE_LAYOUT_METRICS.PROFILE_SUMMARY_REQUEST, {
      success: String(success),
    });
    metricsService.recordLatency(TEMPLATE_LAYOUT_METRICS.REQUEST_LATENCY, durationMs, {
      operation: 'profile_summary',
    });
  }

  /**
   * Record cache hit
   */
  recordCacheHit(operation: string): void {
    metricsService.incrementCounter(TEMPLATE_LAYOUT_METRICS.CACHE_HIT, { operation });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(operation: string): void {
    metricsService.incrementCounter(TEMPLATE_LAYOUT_METRICS.CACHE_MISS, { operation });
  }

  /**
   * Record access denied
   */
  recordAccessDenied(reason: string): void {
    metricsService.incrementCounter(TEMPLATE_LAYOUT_METRICS.ACCESS_DENIED, { reason });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string): void {
    metricsService.incrementCounter(TEMPLATE_LAYOUT_METRICS.RATE_LIMIT_HIT, { endpoint });
  }

  /**
   * Get navigation P99 latency
   */
  getNavigationP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter(
        (m) =>
          m.name === TEMPLATE_LAYOUT_METRICS.REQUEST_LATENCY &&
          m.labels.operation === 'navigation'
      )
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get profile summary P99 latency
   */
  getProfileSummaryP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter(
        (m) =>
          m.name === TEMPLATE_LAYOUT_METRICS.REQUEST_LATENCY &&
          m.labels.operation === 'profile_summary'
      )
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
      (m) => m.name === TEMPLATE_LAYOUT_METRICS.CACHE_HIT
    ).length;
    const misses = recentMetrics.filter(
      (m) => m.name === TEMPLATE_LAYOUT_METRICS.CACHE_MISS
    ).length;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 100;
  }

  /**
   * Get rate limit hit count
   */
  getRateLimitHitCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === TEMPLATE_LAYOUT_METRICS.RATE_LIMIT_HIT
    ).length;
  }

  /**
   * Get access denied count
   */
  getAccessDeniedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === TEMPLATE_LAYOUT_METRICS.ACCESS_DENIED
    ).length;
  }

  /**
   * Check if template layout SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check navigation latency
    const navP99Latency = this.getNavigationP99Latency();
    if (navP99Latency > TEMPLATE_LAYOUT_SLOS.NAVIGATION_LATENCY_P99_MS) {
      violations.push(
        `Navigation P99 latency ${navP99Latency}ms exceeds SLO ${TEMPLATE_LAYOUT_SLOS.NAVIGATION_LATENCY_P99_MS}ms`
      );
    }

    // Check profile summary latency
    const profileP99Latency = this.getProfileSummaryP99Latency();
    if (profileP99Latency > TEMPLATE_LAYOUT_SLOS.PROFILE_SUMMARY_LATENCY_P99_MS) {
      violations.push(
        `Profile summary P99 latency ${profileP99Latency}ms exceeds SLO ${TEMPLATE_LAYOUT_SLOS.PROFILE_SUMMARY_LATENCY_P99_MS}ms`
      );
    }

    // Check cache hit rate
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < TEMPLATE_LAYOUT_SLOS.CACHE_HIT_RATE_MIN) {
      violations.push(
        `Cache hit rate ${cacheHitRate.toFixed(2)}% below SLO ${TEMPLATE_LAYOUT_SLOS.CACHE_HIT_RATE_MIN}%`
      );
    }

    // Check rate limit hits
    const rateLimitHits = this.getRateLimitHitCount();
    if (rateLimitHits > TEMPLATE_LAYOUT_SLOS.MAX_RATE_LIMIT_HITS_PER_MINUTE) {
      violations.push(
        `Rate limit hits ${rateLimitHits}/min exceeds SLO ${TEMPLATE_LAYOUT_SLOS.MAX_RATE_LIMIT_HITS_PER_MINUTE}/min`
      );
    }

    // Check access denied rate
    const accessDeniedCount = this.getAccessDeniedCount();
    if (accessDeniedCount > TEMPLATE_LAYOUT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Access denied rate ${accessDeniedCount}/min exceeds SLO ${TEMPLATE_LAYOUT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get health summary for template layout endpoints
   */
  getHealthSummary(): {
    navigationLatencyP99Ms: number;
    profileSummaryLatencyP99Ms: number;
    cacheHitRate: number;
    rateLimitHits: number;
    accessDeniedCount: number;
    sloStatus: { met: boolean; violations: string[] };
  } {
    return {
      navigationLatencyP99Ms: this.getNavigationP99Latency(),
      profileSummaryLatencyP99Ms: this.getProfileSummaryP99Latency(),
      cacheHitRate: this.getCacheHitRate(),
      rateLimitHits: this.getRateLimitHitCount(),
      accessDeniedCount: this.getAccessDeniedCount(),
      sloStatus: this.checkSLOs(),
    };
  }
}

export const templateLayoutsMetricsService = new TemplateLayoutsMetricsService();
