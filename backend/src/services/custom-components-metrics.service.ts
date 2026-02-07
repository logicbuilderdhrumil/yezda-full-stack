/**
 * Custom Components Metrics Service
 * Task 1.8: Define component endpoint SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';

/** Metric names for custom component operations */
export const CUSTOM_COMPONENTS_METRICS = {
  ORG_LIST_SUCCESS: 'custom_components_org_list_success_total',
  ORG_LIST_FAILURE: 'custom_components_org_list_failure_total',
  ORG_LIST_LATENCY: 'custom_components_org_list_latency_ms',
  ORG_SWITCH_SUCCESS: 'custom_components_org_switch_success_total',
  ORG_SWITCH_FAILURE: 'custom_components_org_switch_failure_total',
  ORG_SWITCH_LATENCY: 'custom_components_org_switch_latency_ms',
  THEME_READ_SUCCESS: 'custom_components_theme_read_success_total',
  THEME_READ_FAILURE: 'custom_components_theme_read_failure_total',
  THEME_READ_LATENCY: 'custom_components_theme_read_latency_ms',
  THEME_UPDATE_SUCCESS: 'custom_components_theme_update_success_total',
  THEME_UPDATE_FAILURE: 'custom_components_theme_update_failure_total',
  THEME_UPDATE_LATENCY: 'custom_components_theme_update_latency_ms',
  RATE_LIMITED: 'custom_components_rate_limited_total',
} as const;

/** SLO targets for custom component endpoints */
export const CUSTOM_COMPONENTS_SLOS = {
  // Latency SLOs
  ORG_LIST_LATENCY_P99_MS: 200,
  ORG_LIST_LATENCY_P95_MS: 100,
  ORG_SWITCH_LATENCY_P99_MS: 150,
  ORG_SWITCH_LATENCY_P95_MS: 75,
  THEME_READ_LATENCY_P99_MS: 100,
  THEME_READ_LATENCY_P95_MS: 50,
  THEME_UPDATE_LATENCY_P99_MS: 150,
  THEME_UPDATE_LATENCY_P95_MS: 75,

  // Availability SLOs
  ORG_LIST_SUCCESS_RATE: 99.9,
  ORG_SWITCH_SUCCESS_RATE: 99.5,
  THEME_READ_SUCCESS_RATE: 99.9,
  THEME_UPDATE_SUCCESS_RATE: 99.5,

  // Rate limiting SLOs
  MAX_RATE_LIMITED_PER_MINUTE: 50,
} as const;

class CustomComponentsMetricsService {
  /**
   * Record organization list operation
   */
  recordOrgList(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success
        ? CUSTOM_COMPONENTS_METRICS.ORG_LIST_SUCCESS
        : CUSTOM_COMPONENTS_METRICS.ORG_LIST_FAILURE
    );
    metricsService.recordLatency(CUSTOM_COMPONENTS_METRICS.ORG_LIST_LATENCY, durationMs);
  }

  /**
   * Record organization switch operation
   */
  recordOrgSwitch(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success
        ? CUSTOM_COMPONENTS_METRICS.ORG_SWITCH_SUCCESS
        : CUSTOM_COMPONENTS_METRICS.ORG_SWITCH_FAILURE
    );
    metricsService.recordLatency(CUSTOM_COMPONENTS_METRICS.ORG_SWITCH_LATENCY, durationMs);
  }

  /**
   * Record theme read operation
   */
  recordThemeRead(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success
        ? CUSTOM_COMPONENTS_METRICS.THEME_READ_SUCCESS
        : CUSTOM_COMPONENTS_METRICS.THEME_READ_FAILURE
    );
    metricsService.recordLatency(CUSTOM_COMPONENTS_METRICS.THEME_READ_LATENCY, durationMs);
  }

  /**
   * Record theme update operation
   */
  recordThemeUpdate(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success
        ? CUSTOM_COMPONENTS_METRICS.THEME_UPDATE_SUCCESS
        : CUSTOM_COMPONENTS_METRICS.THEME_UPDATE_FAILURE
    );
    metricsService.recordLatency(CUSTOM_COMPONENTS_METRICS.THEME_UPDATE_LATENCY, durationMs);
  }

  /**
   * Record rate limit hit
   */
  recordRateLimited(): void {
    metricsService.incrementCounter(CUSTOM_COMPONENTS_METRICS.RATE_LIMITED);
  }

  /**
   * Get org list P99 latency
   */
  getOrgListP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === CUSTOM_COMPONENTS_METRICS.ORG_LIST_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;
    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get org list success rate
   */
  getOrgListSuccessRate(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === CUSTOM_COMPONENTS_METRICS.ORG_LIST_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === CUSTOM_COMPONENTS_METRICS.ORG_LIST_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get rate limited count
   */
  getRateLimitedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === CUSTOM_COMPONENTS_METRICS.RATE_LIMITED
    ).length;
  }

  /**
   * Check if custom component SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    const orgListP99 = this.getOrgListP99Latency();
    if (orgListP99 > CUSTOM_COMPONENTS_SLOS.ORG_LIST_LATENCY_P99_MS) {
      violations.push(
        `Org list P99 latency ${orgListP99}ms exceeds SLO ${CUSTOM_COMPONENTS_SLOS.ORG_LIST_LATENCY_P99_MS}ms`
      );
    }

    const orgListSuccessRate = this.getOrgListSuccessRate();
    if (orgListSuccessRate < CUSTOM_COMPONENTS_SLOS.ORG_LIST_SUCCESS_RATE) {
      violations.push(
        `Org list success rate ${orgListSuccessRate.toFixed(2)}% below SLO ${CUSTOM_COMPONENTS_SLOS.ORG_LIST_SUCCESS_RATE}%`
      );
    }

    const rateLimitedCount = this.getRateLimitedCount();
    if (rateLimitedCount > CUSTOM_COMPONENTS_SLOS.MAX_RATE_LIMITED_PER_MINUTE) {
      violations.push(
        `Rate limited ${rateLimitedCount}/min exceeds SLO ${CUSTOM_COMPONENTS_SLOS.MAX_RATE_LIMITED_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }
}

export const customComponentsMetricsService = new CustomComponentsMetricsService();
