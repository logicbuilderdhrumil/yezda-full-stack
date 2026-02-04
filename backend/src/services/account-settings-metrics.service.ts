/**
 * Account Settings Metrics Service
 * Task 1.8: Define account settings SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';
import {
  ACCOUNT_SETTINGS_SLOS,
  ACCOUNT_SETTINGS_METRICS,
  type IntegrationProvider,
} from '../models/account-settings.model.js';

export class AccountSettingsMetricsService {
  /**
   * Record profile operation
   */
  recordProfileOperation(operation: 'read' | 'update', success: boolean, durationMs: number): void {
    metricsService.recordLatency(ACCOUNT_SETTINGS_METRICS.PROFILE_LATENCY, durationMs, { operation });
    metricsService.incrementCounter(
      operation === 'update'
        ? ACCOUNT_SETTINGS_METRICS.PROFILE_UPDATE
        : ACCOUNT_SETTINGS_METRICS.PROFILE_READ,
      { success: String(success) }
    );
  }

  /**
   * Record profile update denied
   */
  recordProfileUpdateDenied(tenantId: string, userId: string): void {
    metricsService.incrementCounter(ACCOUNT_SETTINGS_METRICS.PROFILE_UPDATE_DENIED, {
      tenantId,
      userId,
    });
  }

  /**
   * Record integration operation
   */
  recordIntegrationOperation(operation: string, success: boolean, durationMs: number): void {
    metricsService.recordLatency(ACCOUNT_SETTINGS_METRICS.INTEGRATION_LATENCY, durationMs, { operation });
    metricsService.incrementCounter(ACCOUNT_SETTINGS_METRICS.INTEGRATION_STATUS_READ, {
      success: String(success),
    });
  }

  /**
   * Record integration callback
   */
  recordIntegrationCallback(provider: IntegrationProvider, success: boolean, durationMs: number): void {
    metricsService.recordLatency(ACCOUNT_SETTINGS_METRICS.INTEGRATION_LATENCY, durationMs, {
      operation: 'callback',
      provider,
    });
    metricsService.incrementCounter(
      success
        ? ACCOUNT_SETTINGS_METRICS.INTEGRATION_CALLBACK_SUCCESS
        : ACCOUNT_SETTINGS_METRICS.INTEGRATION_CALLBACK_FAILURE,
      { provider }
    );
    metricsService.incrementCounter(ACCOUNT_SETTINGS_METRICS.INTEGRATION_CALLBACK, { provider });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string): void {
    metricsService.incrementCounter(ACCOUNT_SETTINGS_METRICS.RATE_LIMIT_HIT, { endpoint });
  }

  /**
   * Get profile P99 latency
   */
  getProfileP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === ACCOUNT_SETTINGS_METRICS.PROFILE_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get profile read P99 latency
   */
  getProfileReadP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter(
        (m) =>
          m.name === ACCOUNT_SETTINGS_METRICS.PROFILE_LATENCY && m.labels.operation === 'read'
      )
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get profile update P99 latency
   */
  getProfileUpdateP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter(
        (m) =>
          m.name === ACCOUNT_SETTINGS_METRICS.PROFILE_LATENCY && m.labels.operation === 'update'
      )
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get integration callback P99 latency
   */
  getIntegrationCallbackP99Latency(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter(
        (m) =>
          m.name === ACCOUNT_SETTINGS_METRICS.INTEGRATION_LATENCY &&
          m.labels.operation === 'callback'
      )
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get integration callback success rate
   */
  getIntegrationCallbackSuccessRate(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === ACCOUNT_SETTINGS_METRICS.INTEGRATION_CALLBACK_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === ACCOUNT_SETTINGS_METRICS.INTEGRATION_CALLBACK_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get profile update rate limit hit count
   */
  getProfileRateLimitHitCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) =>
        m.name === ACCOUNT_SETTINGS_METRICS.RATE_LIMIT_HIT &&
        m.labels.endpoint?.includes('profile')
    ).length;
  }

  /**
   * Get integration callback rate limit hit count
   */
  getIntegrationRateLimitHitCount(windowMs = 60000): number {
    const recentMetrics = metricsService.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) =>
        m.name === ACCOUNT_SETTINGS_METRICS.RATE_LIMIT_HIT &&
        m.labels.endpoint?.includes('integration')
    ).length;
  }

  /**
   * Check if account settings SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Profile read latency SLO
    const profileReadP99 = this.getProfileReadP99Latency();
    if (profileReadP99 > ACCOUNT_SETTINGS_SLOS.PROFILE_READ_LATENCY_P99_MS) {
      violations.push(
        `Profile read P99 latency ${profileReadP99}ms exceeds SLO ${ACCOUNT_SETTINGS_SLOS.PROFILE_READ_LATENCY_P99_MS}ms`
      );
    }

    // Profile update latency SLO
    const profileUpdateP99 = this.getProfileUpdateP99Latency();
    if (profileUpdateP99 > ACCOUNT_SETTINGS_SLOS.PROFILE_UPDATE_LATENCY_P99_MS) {
      violations.push(
        `Profile update P99 latency ${profileUpdateP99}ms exceeds SLO ${ACCOUNT_SETTINGS_SLOS.PROFILE_UPDATE_LATENCY_P99_MS}ms`
      );
    }

    // Integration callback latency SLO
    const callbackP99 = this.getIntegrationCallbackP99Latency();
    if (callbackP99 > ACCOUNT_SETTINGS_SLOS.INTEGRATION_CALLBACK_LATENCY_P99_MS) {
      violations.push(
        `Integration callback P99 latency ${callbackP99}ms exceeds SLO ${ACCOUNT_SETTINGS_SLOS.INTEGRATION_CALLBACK_LATENCY_P99_MS}ms`
      );
    }

    // Integration callback success rate SLO
    const callbackSuccessRate = this.getIntegrationCallbackSuccessRate();
    if (callbackSuccessRate < ACCOUNT_SETTINGS_SLOS.INTEGRATION_AVAILABILITY_RATE) {
      violations.push(
        `Integration callback success rate ${callbackSuccessRate.toFixed(2)}% below SLO ${ACCOUNT_SETTINGS_SLOS.INTEGRATION_AVAILABILITY_RATE}%`
      );
    }

    // Profile rate limit hits SLO
    const profileRateLimitHits = this.getProfileRateLimitHitCount();
    if (profileRateLimitHits > ACCOUNT_SETTINGS_SLOS.MAX_PROFILE_UPDATE_RATE_LIMIT_HITS_PER_MINUTE) {
      violations.push(
        `Profile rate limit hits ${profileRateLimitHits}/min exceeds SLO ${ACCOUNT_SETTINGS_SLOS.MAX_PROFILE_UPDATE_RATE_LIMIT_HITS_PER_MINUTE}/min`
      );
    }

    // Integration rate limit hits SLO
    const integrationRateLimitHits = this.getIntegrationRateLimitHitCount();
    if (integrationRateLimitHits > ACCOUNT_SETTINGS_SLOS.MAX_INTEGRATION_CALLBACK_RATE_LIMIT_HITS_PER_MINUTE) {
      violations.push(
        `Integration rate limit hits ${integrationRateLimitHits}/min exceeds SLO ${ACCOUNT_SETTINGS_SLOS.MAX_INTEGRATION_CALLBACK_RATE_LIMIT_HITS_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get health summary for account settings
   */
  getHealthSummary(): {
    profileReadP99Ms: number;
    profileUpdateP99Ms: number;
    integrationCallbackP99Ms: number;
    integrationCallbackSuccessRate: number;
    profileRateLimitHits: number;
    integrationRateLimitHits: number;
    slosViolations: string[];
  } {
    const sloCheck = this.checkSLOs();
    return {
      profileReadP99Ms: this.getProfileReadP99Latency(),
      profileUpdateP99Ms: this.getProfileUpdateP99Latency(),
      integrationCallbackP99Ms: this.getIntegrationCallbackP99Latency(),
      integrationCallbackSuccessRate: this.getIntegrationCallbackSuccessRate(),
      profileRateLimitHits: this.getProfileRateLimitHitCount(),
      integrationRateLimitHits: this.getIntegrationRateLimitHitCount(),
      slosViolations: sloCheck.violations,
    };
  }
}

export const accountSettingsMetricsService = new AccountSettingsMetricsService();
