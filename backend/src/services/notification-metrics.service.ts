/**
 * Notification Metrics Service
 * Task 1.8: Define notification endpoint SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';

/** Metric names for notification operations */
export const NOTIFICATION_METRICS = {
  CREATE_SUCCESS: 'notification_create_success_total',
  CREATE_FAILURE: 'notification_create_failure_total',
  CREATE_LATENCY: 'notification_create_latency_ms',
  READ_SUCCESS: 'notification_read_success_total',
  READ_FAILURE: 'notification_read_failure_total',
  READ_LATENCY: 'notification_read_latency_ms',
  LIST_SUCCESS: 'notification_list_success_total',
  LIST_FAILURE: 'notification_list_failure_total',
  LIST_LATENCY: 'notification_list_latency_ms',
  STATUS_UPDATE_SUCCESS: 'notification_status_update_success_total',
  STATUS_UPDATE_FAILURE: 'notification_status_update_failure_total',
  STATUS_UPDATE_LATENCY: 'notification_status_update_latency_ms',
  ACCESS_DENIED: 'notification_access_denied_total',
  RATE_LIMITED: 'notification_rate_limited_total',
} as const;

/** SLO targets for notification endpoints */
export const NOTIFICATION_SLOS = {
  // Latency SLOs
  LIST_LATENCY_P99_MS: 200,
  LIST_LATENCY_P95_MS: 100,
  READ_LATENCY_P99_MS: 100,
  READ_LATENCY_P95_MS: 50,
  STATUS_UPDATE_LATENCY_P99_MS: 100,
  STATUS_UPDATE_LATENCY_P95_MS: 50,

  // Availability SLOs
  LIST_SUCCESS_RATE: 99.9,
  READ_SUCCESS_RATE: 99.9,
  STATUS_UPDATE_SUCCESS_RATE: 99.9,

  // Security SLOs
  MAX_ACCESS_DENIED_RATE_PER_MINUTE: 50,
  MAX_RATE_LIMITED_RATE_PER_MINUTE: 100,
} as const;

class NotificationMetricsService {
  /**
   * Record notification create operation
   */
  recordCreate(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? NOTIFICATION_METRICS.CREATE_SUCCESS : NOTIFICATION_METRICS.CREATE_FAILURE
    );
    metricsService.recordLatency(NOTIFICATION_METRICS.CREATE_LATENCY, durationMs);
  }

  /**
   * Record notification read operation
   */
  recordRead(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? NOTIFICATION_METRICS.READ_SUCCESS : NOTIFICATION_METRICS.READ_FAILURE
    );
    metricsService.recordLatency(NOTIFICATION_METRICS.READ_LATENCY, durationMs);
  }

  /**
   * Record notification list operation
   */
  recordList(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? NOTIFICATION_METRICS.LIST_SUCCESS : NOTIFICATION_METRICS.LIST_FAILURE
    );
    metricsService.recordLatency(NOTIFICATION_METRICS.LIST_LATENCY, durationMs);
  }

  /**
   * Record notification status update operation
   */
  recordStatusUpdate(success: boolean, durationMs: number): void {
    metricsService.incrementCounter(
      success ? NOTIFICATION_METRICS.STATUS_UPDATE_SUCCESS : NOTIFICATION_METRICS.STATUS_UPDATE_FAILURE
    );
    metricsService.recordLatency(NOTIFICATION_METRICS.STATUS_UPDATE_LATENCY, durationMs);
  }

  /**
   * Record access denied event
   */
  recordAccessDenied(): void {
    metricsService.incrementCounter(NOTIFICATION_METRICS.ACCESS_DENIED);
  }

  /**
   * Record rate limit hit
   */
  recordRateLimited(): void {
    metricsService.incrementCounter(NOTIFICATION_METRICS.RATE_LIMITED);
  }

  /**
   * Get list operation P99 latency
   */
  getListP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === NOTIFICATION_METRICS.LIST_LATENCY)
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
      (m) => m.name === NOTIFICATION_METRICS.LIST_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === NOTIFICATION_METRICS.LIST_FAILURE
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
      .filter((m) => m.name === NOTIFICATION_METRICS.READ_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get access denied count
   */
  getAccessDeniedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === NOTIFICATION_METRICS.ACCESS_DENIED
    ).length;
  }

  /**
   * Get rate limited count
   */
  getRateLimitedCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === NOTIFICATION_METRICS.RATE_LIMITED
    ).length;
  }

  /**
   * Check if notification SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // List latency SLO
    const listP99Latency = this.getListP99Latency();
    if (listP99Latency > NOTIFICATION_SLOS.LIST_LATENCY_P99_MS) {
      violations.push(
        `Notification list P99 latency ${listP99Latency}ms exceeds SLO ${NOTIFICATION_SLOS.LIST_LATENCY_P99_MS}ms`
      );
    }

    // List success rate SLO
    const listSuccessRate = this.getListSuccessRate();
    if (listSuccessRate < NOTIFICATION_SLOS.LIST_SUCCESS_RATE) {
      violations.push(
        `Notification list success rate ${listSuccessRate.toFixed(2)}% below SLO ${NOTIFICATION_SLOS.LIST_SUCCESS_RATE}%`
      );
    }

    // Read latency SLO
    const readP99Latency = this.getReadP99Latency();
    if (readP99Latency > NOTIFICATION_SLOS.READ_LATENCY_P99_MS) {
      violations.push(
        `Notification read P99 latency ${readP99Latency}ms exceeds SLO ${NOTIFICATION_SLOS.READ_LATENCY_P99_MS}ms`
      );
    }

    // Access denied rate
    const accessDeniedCount = this.getAccessDeniedCount();
    if (accessDeniedCount > NOTIFICATION_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Notification access denied rate ${accessDeniedCount}/min exceeds SLO ${NOTIFICATION_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    // Rate limited rate
    const rateLimitedCount = this.getRateLimitedCount();
    if (rateLimitedCount > NOTIFICATION_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE) {
      violations.push(
        `Notification rate limited rate ${rateLimitedCount}/min exceeds SLO ${NOTIFICATION_SLOS.MAX_RATE_LIMITED_RATE_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }
}

export const notificationMetricsService = new NotificationMetricsService();
