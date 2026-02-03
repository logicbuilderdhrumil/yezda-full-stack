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

// SLO targets for route guards
export const GUARD_SLOS = {
  // Latency SLOs
  GUARD_CHECK_LATENCY_P99_MS: 50,
  GUARD_CHECK_LATENCY_P95_MS: 20,

  // Availability SLOs
  GUARD_AVAILABILITY_RATE: 99.99,

  // Error rate SLOs
  MAX_AUTH_DENIED_RATE_PER_MINUTE: 100,
  MAX_ROLE_DENIED_RATE_PER_MINUTE: 50,
} as const;

// Metric names for guard operations
export const GUARD_METRICS = {
  AUTH_DENIED: 'guard_auth_denied_total',
  ROLE_DENIED: 'guard_role_denied_total',
  ACCESS_GRANTED: 'guard_access_granted_total',
  CHECK_LATENCY: 'guard_check_latency_ms',
  RATE_LIMITED: 'guard_rate_limited_total',
} as const;

// Metric names for shell configuration
export const SHELL_METRICS = {
  CONFIG_REQUEST: 'shell_config_request_total',
  CONFIG_LATENCY: 'shell_config_latency_ms',
  NAVIGATION_REQUEST: 'shell_navigation_request_total',
  PREFERENCE_UPDATE: 'shell_preference_update_total',
  CACHE_HIT: 'shell_cache_hit_total',
  CACHE_MISS: 'shell_cache_miss_total',
} as const;

// Metric names for OAuth operations
export const OAUTH_METRICS = {
  AUTHORIZE_INITIATED: 'oauth_authorize_initiated_total',
  CALLBACK_SUCCESS: 'oauth_callback_success_total',
  CALLBACK_FAILURE: 'oauth_callback_failure_total',
  CALLBACK_LATENCY: 'oauth_callback_latency_ms',
  TOKEN_REFRESH_SUCCESS: 'oauth_token_refresh_success_total',
  TOKEN_REFRESH_FAILURE: 'oauth_token_refresh_failure_total',
  TOKEN_REFRESH_LATENCY: 'oauth_token_refresh_latency_ms',
  DISCONNECT: 'oauth_disconnect_total',
  INVALID_STATE: 'oauth_invalid_state_total',
} as const;

// SLO targets for shell configuration endpoints
export const SHELL_SLOS = {
  // Latency SLOs
  CONFIG_LATENCY_P99_MS: 100,
  CONFIG_LATENCY_P95_MS: 50,
  NAVIGATION_LATENCY_P99_MS: 150,
  NAVIGATION_LATENCY_P95_MS: 75,

  // Availability SLOs
  CONFIG_AVAILABILITY_RATE: 99.9,

  // Cache efficiency SLOs
  CACHE_HIT_RATE_MIN: 80,
} as const;

// Metric names for Firebase integration
export const FIREBASE_METRICS = {
  TOKEN_REGISTRATION_SUCCESS: 'firebase_token_registration_success_total',
  TOKEN_REGISTRATION_FAILURE: 'firebase_token_registration_failure_total',
  TOKEN_UNREGISTRATION: 'firebase_token_unregistration_total',
  NOTIFICATION_DISPATCH_SUCCESS: 'firebase_notification_dispatch_success_total',
  NOTIFICATION_DISPATCH_FAILURE: 'firebase_notification_dispatch_failure_total',
  DISPATCH_LATENCY: 'firebase_dispatch_latency_ms',
  RATE_LIMIT_HIT: 'firebase_rate_limit_hit_total',
} as const;

// SLO targets for Firebase integration
export const FIREBASE_SLOS = {
  // Latency SLOs
  DISPATCH_LATENCY_P99_MS: 500,
  DISPATCH_LATENCY_P95_MS: 200,

  // Availability SLOs
  DISPATCH_SUCCESS_RATE: 99.5,
  TOKEN_REGISTRATION_SUCCESS_RATE: 99.9,

  // Rate limiting SLOs
  MAX_RATE_LIMIT_HITS_PER_MINUTE: 50,
} as const;

// SLO targets for OAuth endpoints
export const OAUTH_SLOS = {
  // Latency SLOs
  CALLBACK_LATENCY_P99_MS: 2000,
  CALLBACK_LATENCY_P95_MS: 1000,
  TOKEN_REFRESH_LATENCY_P99_MS: 1000,
  TOKEN_REFRESH_LATENCY_P95_MS: 500,

  // Availability SLOs
  CALLBACK_SUCCESS_RATE: 99.0,
  TOKEN_REFRESH_SUCCESS_RATE: 99.5,

  // Security SLOs
  MAX_INVALID_STATE_RATE_PER_MINUTE: 50,
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
   * Get guard P99 latency
   */
  getGuardP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === GUARD_METRICS.CHECK_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get guard denial count
   */
  getGuardDenialCount(windowMs = 60000): { auth: number; role: number } {
    const recentMetrics = this.getMetrics(windowMs);
    const authDenials = recentMetrics.filter(
      (m) => m.name === GUARD_METRICS.AUTH_DENIED
    ).length;
    const roleDenials = recentMetrics.filter(
      (m) => m.name === GUARD_METRICS.ROLE_DENIED
    ).length;

    return { auth: authDenials, role: roleDenials };
  }

  /**
   * Check if guard SLOs are met
   */
  checkGuardSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    const p99Latency = this.getGuardP99Latency();
    if (p99Latency > GUARD_SLOS.GUARD_CHECK_LATENCY_P99_MS) {
      violations.push(
        `Guard check P99 latency ${p99Latency}ms exceeds SLO ${GUARD_SLOS.GUARD_CHECK_LATENCY_P99_MS}ms`
      );
    }

    const denials = this.getGuardDenialCount();
    if (denials.auth > GUARD_SLOS.MAX_AUTH_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Auth denied rate ${denials.auth}/min exceeds SLO ${GUARD_SLOS.MAX_AUTH_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    if (denials.role > GUARD_SLOS.MAX_ROLE_DENIED_RATE_PER_MINUTE) {
      violations.push(
        `Role denied rate ${denials.role}/min exceeds SLO ${GUARD_SLOS.MAX_ROLE_DENIED_RATE_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Record shell config request
   */
  recordShellConfigRequest(endpoint: string, cached: boolean): void {
    this.incrementCounter(SHELL_METRICS.CONFIG_REQUEST, { endpoint });
    this.incrementCounter(cached ? SHELL_METRICS.CACHE_HIT : SHELL_METRICS.CACHE_MISS, { endpoint });
  }

  /**
   * Record shell config latency
   */
  recordShellConfigLatency(endpoint: string, durationMs: number): void {
    this.recordLatency(SHELL_METRICS.CONFIG_LATENCY, durationMs, { endpoint });
  }

  /**
   * Record navigation request
   */
  recordNavigationRequest(authorized: boolean): void {
    this.incrementCounter(SHELL_METRICS.NAVIGATION_REQUEST, { authorized: String(authorized) });
  }

  /**
   * Record preference update
   */
  recordPreferenceUpdate(userType: 'user' | 'candidate'): void {
    this.incrementCounter(SHELL_METRICS.PREFERENCE_UPDATE, { userType });
  }

  /**
   * Get shell config P99 latency
   */
  getShellConfigP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === SHELL_METRICS.CONFIG_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get shell cache hit rate
   */
  getShellCacheHitRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const hits = recentMetrics.filter((m) => m.name === SHELL_METRICS.CACHE_HIT).length;
    const misses = recentMetrics.filter((m) => m.name === SHELL_METRICS.CACHE_MISS).length;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 100;
  }

  /**
   * Check if shell SLOs are met
   */
  checkShellSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    const p99Latency = this.getShellConfigP99Latency();
    if (p99Latency > SHELL_SLOS.CONFIG_LATENCY_P99_MS) {
      violations.push(
        `Shell config P99 latency ${p99Latency}ms exceeds SLO ${SHELL_SLOS.CONFIG_LATENCY_P99_MS}ms`
      );
    }

    const cacheHitRate = this.getShellCacheHitRate();
    if (cacheHitRate < SHELL_SLOS.CACHE_HIT_RATE_MIN) {
      violations.push(
        `Shell cache hit rate ${cacheHitRate.toFixed(2)}% below SLO ${SHELL_SLOS.CACHE_HIT_RATE_MIN}%`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Record Firebase token registration
   */
  recordFirebaseTokenRegistration(success: boolean): void {
    this.incrementCounter(
      success
        ? FIREBASE_METRICS.TOKEN_REGISTRATION_SUCCESS
        : FIREBASE_METRICS.TOKEN_REGISTRATION_FAILURE
    );
  }

  /**
   * Record Firebase token unregistration
   */
  recordFirebaseTokenUnregistration(): void {
    this.incrementCounter(FIREBASE_METRICS.TOKEN_UNREGISTRATION);
  }

  /**
   * Record Firebase notification dispatch
   */
  recordFirebaseDispatch(success: boolean, durationMs: number): void {
    this.recordLatency(FIREBASE_METRICS.DISPATCH_LATENCY, durationMs);
    this.incrementCounter(
      success
        ? FIREBASE_METRICS.NOTIFICATION_DISPATCH_SUCCESS
        : FIREBASE_METRICS.NOTIFICATION_DISPATCH_FAILURE
    );
  }

  /**
   * Record Firebase rate limit hit
   */
  recordFirebaseRateLimitHit(endpoint: string): void {
    this.incrementCounter(FIREBASE_METRICS.RATE_LIMIT_HIT, { endpoint });
  }

  /**
   * Get Firebase dispatch P99 latency
   */
  getFirebaseDispatchP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === FIREBASE_METRICS.DISPATCH_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Record OAuth operation
   */
  recordOAuthOperation(
    operation: 'authorize' | 'callback' | 'refresh' | 'disconnect',
    provider: string,
    success: boolean,
    durationMs?: number
  ): void {
    const labels = { provider, operation };

    switch (operation) {
      case 'authorize':
        this.incrementCounter(OAUTH_METRICS.AUTHORIZE_INITIATED, labels);
        break;
      case 'callback':
        this.incrementCounter(
          success ? OAUTH_METRICS.CALLBACK_SUCCESS : OAUTH_METRICS.CALLBACK_FAILURE,
          labels
        );
        if (durationMs !== undefined) {
          this.recordLatency(OAUTH_METRICS.CALLBACK_LATENCY, durationMs, labels);
        }
        break;
      case 'refresh':
        this.incrementCounter(
          success ? OAUTH_METRICS.TOKEN_REFRESH_SUCCESS : OAUTH_METRICS.TOKEN_REFRESH_FAILURE,
          labels
        );
        if (durationMs !== undefined) {
          this.recordLatency(OAUTH_METRICS.TOKEN_REFRESH_LATENCY, durationMs, labels);
        }
        break;
      case 'disconnect':
        this.incrementCounter(OAUTH_METRICS.DISCONNECT, labels);
        break;
    }
  }

  /**
   * Get OAuth callback success rate
   */
  getOAuthCallbackSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === OAUTH_METRICS.CALLBACK_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === OAUTH_METRICS.CALLBACK_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get OAuth callback P99 latency
   */
  getOAuthCallbackP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === OAUTH_METRICS.CALLBACK_LATENCY)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get Firebase dispatch success rate
   */
  getFirebaseDispatchSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === FIREBASE_METRICS.NOTIFICATION_DISPATCH_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === FIREBASE_METRICS.NOTIFICATION_DISPATCH_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get Firebase token registration success rate
   */
  getFirebaseTokenRegistrationSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === FIREBASE_METRICS.TOKEN_REGISTRATION_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === FIREBASE_METRICS.TOKEN_REGISTRATION_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get Firebase rate limit hit count
   */
  getFirebaseRateLimitHitCount(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === FIREBASE_METRICS.RATE_LIMIT_HIT
    ).length;
  }

  /**
   * Check if Firebase SLOs are met
   */
  checkFirebaseSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    const p99Latency = this.getFirebaseDispatchP99Latency();
    if (p99Latency > FIREBASE_SLOS.DISPATCH_LATENCY_P99_MS) {
      violations.push(
        `Firebase dispatch P99 latency ${p99Latency}ms exceeds SLO ${FIREBASE_SLOS.DISPATCH_LATENCY_P99_MS}ms`
      );
    }

    const dispatchSuccessRate = this.getFirebaseDispatchSuccessRate();
    if (dispatchSuccessRate < FIREBASE_SLOS.DISPATCH_SUCCESS_RATE) {
      violations.push(
        `Firebase dispatch success rate ${dispatchSuccessRate.toFixed(2)}% below SLO ${FIREBASE_SLOS.DISPATCH_SUCCESS_RATE}%`
      );
    }

    const tokenSuccessRate = this.getFirebaseTokenRegistrationSuccessRate();
    if (tokenSuccessRate < FIREBASE_SLOS.TOKEN_REGISTRATION_SUCCESS_RATE) {
      violations.push(
        `Firebase token registration success rate ${tokenSuccessRate.toFixed(2)}% below SLO ${FIREBASE_SLOS.TOKEN_REGISTRATION_SUCCESS_RATE}%`
      );
    }

    const rateLimitHits = this.getFirebaseRateLimitHitCount();
    if (rateLimitHits > FIREBASE_SLOS.MAX_RATE_LIMIT_HITS_PER_MINUTE) {
      violations.push(
        `Firebase rate limit hits ${rateLimitHits}/min exceeds SLO ${FIREBASE_SLOS.MAX_RATE_LIMIT_HITS_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Check if OAuth SLOs are met
   */
  checkOAuthSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    const successRate = this.getOAuthCallbackSuccessRate();
    if (successRate < OAUTH_SLOS.CALLBACK_SUCCESS_RATE) {
      violations.push(
        `OAuth callback success rate ${successRate.toFixed(2)}% below SLO ${OAUTH_SLOS.CALLBACK_SUCCESS_RATE}%`
      );
    }

    const p99Latency = this.getOAuthCallbackP99Latency();
    if (p99Latency > OAUTH_SLOS.CALLBACK_LATENCY_P99_MS) {
      violations.push(
        `OAuth callback P99 latency ${p99Latency}ms exceeds SLO ${OAUTH_SLOS.CALLBACK_LATENCY_P99_MS}ms`
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

  /**
   * Clear all metrics (for testing purposes)
   */
  clearAll(): void {
    metrics.length = 0;
  }
}

export const metricsService = new MetricsService();
