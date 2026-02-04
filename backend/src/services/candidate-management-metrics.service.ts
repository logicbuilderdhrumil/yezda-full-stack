/**
 * Candidate Management Metrics Service
 * Task 1.8: Define candidate management SLOs and add metrics/alerts
 */

import { metricsService } from './metrics.service.js';

// Metric names for candidate management
export const CANDIDATE_MANAGEMENT_METRICS = {
  REQUEST_LATENCY: 'candidate_management_request_latency_ms',
  SUCCESS: 'candidate_management_success_total',
  ERROR: 'candidate_management_error_total',
  ACCESS_DENIED: 'candidate_management_access_denied_total',
  RATE_LIMIT_HIT: 'candidate_management_rate_limit_hit_total',
  LIST_REQUEST: 'candidate_management_list_request_total',
  CREATE_REQUEST: 'candidate_management_create_request_total',
  UPDATE_REQUEST: 'candidate_management_update_request_total',
  DELETE_REQUEST: 'candidate_management_delete_request_total',
  BULK_CREATE_REQUEST: 'candidate_management_bulk_create_request_total',
  SUBMISSION_REQUEST: 'candidate_management_submission_request_total',
  CACHE_HIT: 'candidate_management_cache_hit_total',
  CACHE_MISS: 'candidate_management_cache_miss_total',
} as const;

// SLO targets for candidate management endpoints
export const CANDIDATE_MANAGEMENT_SLOS = {
  // Latency SLOs
  REQUEST_LATENCY_P99_MS: 500,
  REQUEST_LATENCY_P95_MS: 200,
  LIST_LATENCY_P99_MS: 1000,
  LIST_LATENCY_P95_MS: 500,

  // Availability SLOs
  AVAILABILITY_RATE: 99.9,
  SUCCESS_RATE: 99.0,

  // Rate limiting SLOs
  MAX_RATE_LIMIT_HITS_PER_MINUTE: 30,

  // Security SLOs
  MAX_ACCESS_DENIED_RATE_PER_MINUTE: 50,

  // Bulk operation SLOs
  BULK_CREATE_LATENCY_P99_MS: 5000,
  BULK_CREATE_LATENCY_P95_MS: 2000,

  // Submission SLOs (public endpoint)
  SUBMISSION_LATENCY_P99_MS: 300,
  SUBMISSION_SUCCESS_RATE: 99.5,
} as const;

export class CandidateManagementMetricsService {
  /**
   * Record a candidate management request
   */
  recordRequest(
    operation: 'list' | 'view' | 'create' | 'update' | 'status_update' | 'delete' | 'bulk_create' | 'submission',
    success: boolean,
    durationMs: number,
    labels: Record<string, string> = {}
  ): void {
    metricsService.recordLatency(CANDIDATE_MANAGEMENT_METRICS.REQUEST_LATENCY, durationMs, {
      operation,
      ...labels,
    });

    metricsService.incrementCounter(
      success ? CANDIDATE_MANAGEMENT_METRICS.SUCCESS : CANDIDATE_MANAGEMENT_METRICS.ERROR,
      { operation, ...labels }
    );
  }

  /**
   * Record access denied
   */
  recordAccessDenied(
    operation: string,
    reason: string,
    labels: Record<string, string> = {}
  ): void {
    metricsService.incrementCounter(CANDIDATE_MANAGEMENT_METRICS.ACCESS_DENIED, {
      operation,
      reason,
      ...labels,
    });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(operation: string, labels: Record<string, string> = {}): void {
    metricsService.incrementCounter(CANDIDATE_MANAGEMENT_METRICS.RATE_LIMIT_HIT, {
      operation,
      ...labels,
    });
  }

  /**
   * Record cache hit/miss
   */
  recordCacheResult(hit: boolean, labels: Record<string, string> = {}): void {
    metricsService.incrementCounter(
      hit ? CANDIDATE_MANAGEMENT_METRICS.CACHE_HIT : CANDIDATE_MANAGEMENT_METRICS.CACHE_MISS,
      labels
    );
  }

  /**
   * Get candidate management P99 latency
   */
  getP99Latency(windowMs = 60000): number {
    const metrics = metricsService.getMetrics(windowMs);
    const latencies = metrics
      .filter((m) => m.name === CANDIDATE_MANAGEMENT_METRICS.REQUEST_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get candidate management P95 latency
   */
  getP95Latency(windowMs = 60000): number {
    const metrics = metricsService.getMetrics(windowMs);
    const latencies = metrics
      .filter((m) => m.name === CANDIDATE_MANAGEMENT_METRICS.REQUEST_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p95Index = Math.floor(latencies.length * 0.95);
    return latencies[p95Index] || latencies[latencies.length - 1];
  }

  /**
   * Get success rate
   */
  getSuccessRate(windowMs = 60000): number {
    const metrics = metricsService.getMetrics(windowMs);
    const successes = metrics.filter(
      (m) => m.name === CANDIDATE_MANAGEMENT_METRICS.SUCCESS
    ).length;
    const errors = metrics.filter(
      (m) => m.name === CANDIDATE_MANAGEMENT_METRICS.ERROR
    ).length;
    const total = successes + errors;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get access denied count
   */
  getAccessDeniedCount(windowMs = 60000): number {
    const metrics = metricsService.getMetrics(windowMs);
    return metrics.filter(
      (m) => m.name === CANDIDATE_MANAGEMENT_METRICS.ACCESS_DENIED
    ).length;
  }

  /**
   * Get rate limit hit count
   */
  getRateLimitHitCount(windowMs = 60000): number {
    const metrics = metricsService.getMetrics(windowMs);
    return metrics.filter(
      (m) => m.name === CANDIDATE_MANAGEMENT_METRICS.RATE_LIMIT_HIT
    ).length;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(windowMs = 60000): number {
    const metrics = metricsService.getMetrics(windowMs);
    const hits = metrics.filter(
      (m) => m.name === CANDIDATE_MANAGEMENT_METRICS.CACHE_HIT
    ).length;
    const misses = metrics.filter(
      (m) => m.name === CANDIDATE_MANAGEMENT_METRICS.CACHE_MISS
    ).length;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Check if candidate management SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    const p99Latency = this.getP99Latency();
    if (p99Latency > CANDIDATE_MANAGEMENT_SLOS.REQUEST_LATENCY_P99_MS) {
      violations.push(
        `Candidate management P99 latency ${p99Latency}ms exceeds SLO ${CANDIDATE_MANAGEMENT_SLOS.REQUEST_LATENCY_P99_MS}ms`
      );
    }

    const successRate = this.getSuccessRate();
    if (successRate < CANDIDATE_MANAGEMENT_SLOS.SUCCESS_RATE) {
      violations.push(
        `Candidate management success rate ${successRate.toFixed(2)}% below SLO ${CANDIDATE_MANAGEMENT_SLOS.SUCCESS_RATE}%`
      );
    }

    const accessDeniedCount = this.getAccessDeniedCount();
    if (accessDeniedCount > CANDIDATE_MANAGEMENT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Candidate management access denied rate ${accessDeniedCount}/min exceeds SLO ${CANDIDATE_MANAGEMENT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    const rateLimitHits = this.getRateLimitHitCount();
    if (rateLimitHits > CANDIDATE_MANAGEMENT_SLOS.MAX_RATE_LIMIT_HITS_PER_MINUTE) {
      violations.push(
        `Candidate management rate limit hits ${rateLimitHits}/min exceeds SLO ${CANDIDATE_MANAGEMENT_SLOS.MAX_RATE_LIMIT_HITS_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get health summary for monitoring
   */
  getHealthSummary(): {
    healthy: boolean;
    metrics: {
      p99LatencyMs: number;
      p95LatencyMs: number;
      successRate: number;
      accessDeniedCount: number;
      rateLimitHitCount: number;
      cacheHitRate: number;
    };
    sloStatus: { met: boolean; violations: string[] };
  } {
    const p99LatencyMs = this.getP99Latency();
    const p95LatencyMs = this.getP95Latency();
    const successRate = this.getSuccessRate();
    const accessDeniedCount = this.getAccessDeniedCount();
    const rateLimitHitCount = this.getRateLimitHitCount();
    const cacheHitRate = this.getCacheHitRate();
    const sloStatus = this.checkSLOs();

    return {
      healthy: sloStatus.met,
      metrics: {
        p99LatencyMs,
        p95LatencyMs,
        successRate,
        accessDeniedCount,
        rateLimitHitCount,
        cacheHitRate,
      },
      sloStatus,
    };
  }
}

export const candidateManagementMetricsService = new CandidateManagementMetricsService();
