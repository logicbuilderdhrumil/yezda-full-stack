/**
 * Metrics Service
 * Task 1.9: Auth endpoint SLOs and metrics collection
 */

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

// In-memory metrics store (replace with Prometheus/StatsD in production)
const metrics: Metric[] = [];

// Metric names for auth SLOs
export const AUTH_METRICS = {
  SIGN_IN_LATENCY: 'auth_signin_latency_ms',
  SIGN_IN_SUCCESS: 'auth_signin_success_total',
  SIGN_IN_FAILURE: 'auth_signin_failure_total',
  SIGN_UP_SUCCESS: 'auth_signup_success_total',
  TOKEN_REFRESH_SUCCESS: 'auth_token_refresh_success_total',
  TOKEN_REFRESH_FAILURE: 'auth_token_refresh_failure_total',
  PASSWORD_RESET_REQUEST: 'auth_password_reset_request_total',
  MFA_ENROLLMENT: 'auth_mfa_enrollment_total',
  RATE_LIMIT_HIT: 'auth_rate_limit_hit_total',
  ACCOUNT_LOCKOUT: 'auth_account_lockout_total',
  REDIS_ERROR: 'redis_error_total',
} as const;

// SLO targets for auth endpoints
export const AUTH_SLOS = {
  // Latency SLOs
  SIGN_IN_LATENCY_P99_MS: 500,
  SIGN_IN_LATENCY_P95_MS: 200,
  TOKEN_REFRESH_LATENCY_P99_MS: 100,
  
  // Availability SLOs
  SIGN_IN_SUCCESS_RATE: 99.9,
  TOKEN_REFRESH_SUCCESS_RATE: 99.99,
  
  // Security SLOs
  MAX_LOCKOUT_RATE_PERCENT: 1,
  MAX_RATE_LIMIT_HITS_PER_MINUTE: 100,
} as const;

export class MetricsService {
  /**
   * Record a counter metric
   */
  incrementCounter(name: string, labels: Record<string, string> = {}): void {
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
  recordLatency(name: string, durationMs: number, labels: Record<string, string> = {}): void {
    metrics.push({
      name,
      type: 'histogram',
      value: durationMs,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Record sign-in attempt
   */
  recordSignIn(success: boolean, durationMs: number, userType: 'user' | 'candidate'): void {
    this.recordLatency(AUTH_METRICS.SIGN_IN_LATENCY, durationMs, { userType });
    this.incrementCounter(
      success ? AUTH_METRICS.SIGN_IN_SUCCESS : AUTH_METRICS.SIGN_IN_FAILURE,
      { userType }
    );
  }

  /**
   * Record token refresh
   */
  recordTokenRefresh(success: boolean): void {
    this.incrementCounter(
      success ? AUTH_METRICS.TOKEN_REFRESH_SUCCESS : AUTH_METRICS.TOKEN_REFRESH_FAILURE
    );
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string): void {
    this.incrementCounter(AUTH_METRICS.RATE_LIMIT_HIT, { endpoint });
  }

  /**
   * Record account lockout
   */
  recordLockout(userType: 'user' | 'candidate'): void {
    this.incrementCounter(AUTH_METRICS.ACCOUNT_LOCKOUT, { userType });
  }

  /**
   * Record Redis error (for monitoring connection issues)
   */
  recordRedisError(operation: string): void {
    this.incrementCounter(AUTH_METRICS.REDIS_ERROR, { operation });
  }

  /**
   * Get metrics for a time window
   */
  getMetrics(windowMs = 60000): Metric[] {
    const cutoff = new Date(Date.now() - windowMs);
    return metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Calculate sign-in success rate
   */
  getSignInSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === AUTH_METRICS.SIGN_IN_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === AUTH_METRICS.SIGN_IN_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Calculate P99 latency for sign-in
   */
  getSignInP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === AUTH_METRICS.SIGN_IN_LATENCY)
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

    const successRate = this.getSignInSuccessRate();
    if (successRate < AUTH_SLOS.SIGN_IN_SUCCESS_RATE) {
      violations.push(
        `Sign-in success rate ${successRate.toFixed(2)}% below SLO ${AUTH_SLOS.SIGN_IN_SUCCESS_RATE}%`
      );
    }

    const p99Latency = this.getSignInP99Latency();
    if (p99Latency > AUTH_SLOS.SIGN_IN_LATENCY_P99_MS) {
      violations.push(
        `Sign-in P99 latency ${p99Latency}ms exceeds SLO ${AUTH_SLOS.SIGN_IN_LATENCY_P99_MS}ms`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Clear old metrics
   */
  cleanup(retentionMs = 3600000): void {
    const cutoff = new Date(Date.now() - retentionMs);
    const count = metrics.length;
    metrics.splice(0, metrics.findIndex((m) => m.timestamp > cutoff));
    console.log(`Cleaned up ${count - metrics.length} old metrics`);
  }
}

export const metricsService = new MetricsService();
