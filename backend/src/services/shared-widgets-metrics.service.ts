/**
 * Shared Widgets Metrics Service
 * Task 1.8: SLO monitoring and metrics for widget endpoints
 */

export interface SharedWidgetsSLOConfig {
  /** Target availability percentage (e.g., 99.5) */
  availabilityTarget: number;
  /** Target p95 latency in milliseconds */
  latencyP95Target: number;
  /** Target error rate percentage (e.g., 0.5) */
  errorRateTarget: number;
  /** Target cache hit rate percentage */
  cacheHitRateTarget: number;
}

export interface SharedWidgetsMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  latencies: number[];
  throttledRequests: number;
  lastReset: Date;
}

export interface SLOStatus {
  met: boolean;
  violations: string[];
  availability: number;
  errorRate: number;
  latencyP95: number;
  cacheHitRate: number;
}

const DEFAULT_SLO_CONFIG: SharedWidgetsSLOConfig = {
  availabilityTarget: 99.5,
  latencyP95Target: 500,
  errorRateTarget: 0.5,
  cacheHitRateTarget: 80,
};

class SharedWidgetsMetricsService {
  private config: SharedWidgetsSLOConfig;
  private metrics: SharedWidgetsMetrics;

  constructor(config: Partial<SharedWidgetsSLOConfig> = {}) {
    this.config = { ...DEFAULT_SLO_CONFIG, ...config };
    this.metrics = this.createEmptyMetrics();
  }

  private createEmptyMetrics(): SharedWidgetsMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      latencies: [],
      throttledRequests: 0,
      lastReset: new Date(),
    };
  }

  /**
   * Record a successful widget data request
   */
  recordSuccess(latencyMs: number, cached: boolean): void {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.latencies.push(latencyMs);

    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Record a failed widget data request
   */
  recordFailure(latencyMs: number): void {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.latencies.push(latencyMs);
  }

  /**
   * Record a throttled request
   */
  recordThrottled(): void {
    this.metrics.totalRequests++;
    this.metrics.throttledRequests++;
  }

  /**
   * Calculate percentile from latencies
   */
  private calculatePercentile(percentile: number): number {
    if (this.metrics.latencies.length === 0) {
      return 0;
    }

    const sorted = [...this.metrics.latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Check SLO compliance
   */
  checkSLOs(): SLOStatus {
    const violations: string[] = [];

    // Calculate metrics
    const availability =
      this.metrics.totalRequests > 0
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
        : 100;

    const errorRate =
      this.metrics.totalRequests > 0
        ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100
        : 0;

    const latencyP95 = this.calculatePercentile(95);

    const cacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      cacheRequests > 0
        ? (this.metrics.cacheHits / cacheRequests) * 100
        : 100;

    // Check against targets
    if (availability < this.config.availabilityTarget) {
      violations.push(
        `Availability ${availability.toFixed(2)}% below target ${this.config.availabilityTarget}%`
      );
    }

    if (errorRate > this.config.errorRateTarget) {
      violations.push(
        `Error rate ${errorRate.toFixed(2)}% exceeds target ${this.config.errorRateTarget}%`
      );
    }

    if (latencyP95 > this.config.latencyP95Target && this.metrics.latencies.length > 0) {
      violations.push(
        `P95 latency ${latencyP95.toFixed(0)}ms exceeds target ${this.config.latencyP95Target}ms`
      );
    }

    if (cacheHitRate < this.config.cacheHitRateTarget && cacheRequests > 0) {
      violations.push(
        `Cache hit rate ${cacheHitRate.toFixed(2)}% below target ${this.config.cacheHitRateTarget}%`
      );
    }

    return {
      met: violations.length === 0,
      violations,
      availability,
      errorRate,
      latencyP95,
      cacheHitRate,
    };
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): SharedWidgetsMetrics {
    return { ...this.metrics };
  }

  /**
   * Get SLO configuration
   */
  getSLOConfig(): SharedWidgetsSLOConfig {
    return { ...this.config };
  }

  /**
   * Reset metrics (typically called on a schedule)
   */
  reset(): void {
    this.metrics = this.createEmptyMetrics();
  }

  /**
   * Clear all metrics and reset
   */
  clearAll(): void {
    this.reset();
  }
}

export const sharedWidgetsMetricsService = new SharedWidgetsMetricsService();
