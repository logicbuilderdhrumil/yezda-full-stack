/**
 * API Client Service
 * Task 1.1: Shared HTTP client module for outbound calls
 * Task 1.2: Standardized error handling and retry policy helpers
 * Task 1.4: Outbound security controls (allowlists, secret handling, TLS requirements)
 * Task 1.5: Circuit breakers and dependency SLO metrics
 * Task 1.6: Compliance logging for outbound integration access
 */

import { v4 as uuidv4 } from 'uuid';
import { URL } from 'url';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ApiClientConfig {
  /** Base URL for the integration */
  baseUrl: string;
  /** Default request timeout in milliseconds */
  timeoutMs: number;
  /** Default headers to include in all requests */
  headers?: Record<string, string>;
  /** Retry policy configuration */
  retry?: RetryConfig;
  /** Circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;
  /** Integration name for logging and metrics */
  integrationName: string;
  /** Maximum response body size in bytes (default: 10MB) */
  maxResponseSizeBytes?: number;
}

/** Default maximum response size: 10MB */
const DEFAULT_MAX_RESPONSE_SIZE_BYTES = 10 * 1024 * 1024;

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries in milliseconds */
  baseDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[];
  /** Use exponential backoff */
  exponentialBackoff: boolean;
}

export interface CircuitBreakerConfig {
  /** Failure threshold before circuit opens */
  failureThreshold: number;
  /** Success threshold to close circuit */
  successThreshold: number;
  /** Time window for counting failures in milliseconds */
  windowMs: number;
  /** Time the circuit stays open before half-open in milliseconds */
  openDurationMs: number;
}

export interface ApiClientRequest {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /** Request path (appended to baseUrl) */
  path: string;
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** Request body */
  body?: unknown;
  /** Request-specific headers */
  headers?: Record<string, string>;
  /** Override timeout for this request */
  timeoutMs?: number;
  /** Skip retry for this request */
  skipRetry?: boolean;
  /** Request ID for tracing */
  requestId?: string;
}

export interface ApiClientResponse<T = unknown> {
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Parsed response body */
  data: T;
  /** Response time in milliseconds */
  durationMs: number;
  /** Request ID for tracing */
  requestId: string;
}

export interface ApiClientError {
  /** Error code for programmatic handling */
  code: ApiErrorCode;
  /** Human-readable error message */
  message: string;
  /** HTTP status code if available */
  status?: number;
  /** Original error */
  cause?: Error;
  /** Request ID for tracing */
  requestId: string;
  /** Integration name */
  integrationName: string;
}

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CIRCUIT_OPEN'
  | 'BLOCKED_HOST'
  | 'TLS_ERROR'
  | 'RETRY_EXHAUSTED'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR'
  | 'PARSE_ERROR'
  | 'RESPONSE_TOO_LARGE'
  | 'UNKNOWN';

// ============================================================================
// Circuit Breaker State
// ============================================================================

/**
 * Circuit breaker states.
 * 
 * IMPORTANT: Circuit breaker state is stored in-memory per instance.
 * In multi-instance deployments (e.g., Kubernetes pods), each instance
 * maintains its own state. This means:
 * - One pod can have a circuit open while others keep sending requests
 * - Half-open probes are not coordinated across instances
 * 
 * For production multi-instance deployments, consider:
 * - Using Redis or another shared store for circuit breaker state
 * - Implementing a distributed circuit breaker pattern
 * - Accepting this as a limitation for simpler deployments
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number;
  openedAt: number;
}

// ============================================================================
// Outbound Security Controls
// ============================================================================

export interface OutboundSecurityConfig {
  /** Allowed hostnames for outbound requests */
  allowedHosts: string[];
  /** Allow all HTTPS hosts (less restrictive) */
  allowAllHttps: boolean;
  /** Require TLS for all requests */
  requireTls: boolean;
  /** Block private/internal IP ranges */
  blockPrivateRanges: boolean;
}

const DEFAULT_SECURITY_CONFIG: OutboundSecurityConfig = {
  allowedHosts: [],
  allowAllHttps: false,
  requireTls: true,
  blockPrivateRanges: true,
};

// Private IP patterns for hostname validation
const PRIVATE_IPV4_PATTERNS = [
  /^10\./,                              // 10.0.0.0/8 (Class A private)
  /^172\.(1[6-9]|2[0-9]|3[01])\./,      // 172.16.0.0/12 (Class B private)
  /^192\.168\./,                        // 192.168.0.0/16 (Class C private)
  /^127\./,                             // 127.0.0.0/8 (loopback)
  /^0\./,                               // 0.0.0.0/8 ("this" network)
  /^169\.254\./,                        // 169.254.0.0/16 (link-local)
  /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./,  // 100.64.0.0/10 (CGN)
];

const PRIVATE_IPV6_PATTERNS = [
  /^::1$/i,                             // ::1/128 (loopback)
  /^fe80:/i,                            // fe80::/10 (link-local)
  /^fc[0-9a-f]{2}:/i,                   // fc00::/7 (unique local address - ULA)
  /^fd[0-9a-f]{2}:/i,                   // fd00::/8 (unique local address - ULA)
  /^ff[0-9a-f]{2}:/i,                   // ff00::/8 (multicast)
  /^::$/,                               // :: (unspecified address)
  /^2001:db8:/i,                        // 2001:db8::/32 (documentation)
  /^100::/i,                            // 100::/64 (discard prefix)
  /^64:ff9b:/i,                         // 64:ff9b::/96 (IPv4/IPv6 translation)
];

const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,                          // .local TLD (mDNS)
  /\.internal$/i,                       // .internal TLD
  /\.localdomain$/i,                    // .localdomain TLD
];

/**
 * Check if an IP address or hostname is private/internal.
 * Used for pre-request validation and post-DNS resolution validation
 * to prevent SSRF and DNS rebinding attacks.
 * 
 * @param ip - IPv4 address, IPv6 address, or hostname to check
 * @returns true if the address is private/internal and should be blocked
 */
export function isPrivateIP(ip: string): boolean {
  // Check private hostnames
  for (const pattern of PRIVATE_HOSTNAME_PATTERNS) {
    if (pattern.test(ip)) {
      return true;
    }
  }

  // Check IPv4 patterns
  for (const pattern of PRIVATE_IPV4_PATTERNS) {
    if (pattern.test(ip)) {
      return true;
    }
  }

  // Check IPv6 patterns
  for (const pattern of PRIVATE_IPV6_PATTERNS) {
    if (pattern.test(ip)) {
      return true;
    }
  }

  // Additional check for IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
  const ipv4MappedMatch = ip.match(/^::ffff:(.+)$/i);
  if (ipv4MappedMatch) {
    return isPrivateIP(ipv4MappedMatch[1]);
  }

  // Check for IPv4-compatible IPv6 addresses (::x.x.x.x) - deprecated but still valid
  const ipv4CompatMatch = ip.match(/^::([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)$/i);
  if (ipv4CompatMatch) {
    return isPrivateIP(ipv4CompatMatch[1]);
  }

  return false;
}

/**
 * Validate a resolved IP address after DNS lookup.
 * Call this after DNS resolution to detect DNS rebinding attacks.
 * 
 * @param resolvedIP - The IP address returned by DNS resolution
 * @returns true if the IP is safe to connect to
 * @throws Error if the resolved IP is private/internal
 */
export function validateResolvedIP(resolvedIP: string): boolean {
  if (isPrivateIP(resolvedIP)) {
    throw new Error(`DNS rebinding detected: resolved to private IP ${resolvedIP}`);
  }
  return true;
}

// Sensitive query parameter keys to mask in URLs
const SENSITIVE_QUERY_PARAMS = [
  'api_key',
  'apikey',
  'api-key',
  'token',
  'access_token',
  'secret',
  'password',
  'key',
  'auth',
  'bearer',
  'credential',
];

/**
 * Mask sensitive query parameters in a URL for safe logging.
 * Replaces values of sensitive params like api_key, token, secret with asterisks.
 */
export function maskUrlSecrets(url: string): string {
  try {
    const parsed = new URL(url);
    let masked = false;
    
    for (const [key, value] of parsed.searchParams.entries()) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_QUERY_PARAMS.some(s => lowerKey.includes(s))) {
        const maskedValue = value.length > 8 
          ? `${value.slice(0, 2)}****${value.slice(-2)}` 
          : '****';
        parsed.searchParams.set(key, maskedValue);
        masked = true;
      }
    }
    
    return masked ? parsed.toString() : url;
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  exponentialBackoff: true,
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  windowMs: 60000,
  openDurationMs: 30000,
};

// ============================================================================
// SLO Metrics
// ============================================================================

export interface OutboundMetric {
  integrationName: string;
  requestId: string;
  method: string;
  path: string;
  status?: number;
  durationMs: number;
  success: boolean;
  errorCode?: ApiErrorCode;
  timestamp: Date;
}

export const OUTBOUND_SLOS = {
  /** P99 latency target */
  LATENCY_P99_MS: 2000,
  /** P95 latency target */
  LATENCY_P95_MS: 1000,
  /** Success rate target */
  SUCCESS_RATE_PERCENT: 99.5,
} as const;

// In-memory metrics store
const outboundMetrics: OutboundMetric[] = [];

// ============================================================================
// Audit Logging
// ============================================================================

export interface OutboundAuditEvent {
  eventType: 'OUTBOUND_REQUEST' | 'OUTBOUND_BLOCKED' | 'OUTBOUND_CIRCUIT_OPEN';
  integrationName: string;
  requestId: string;
  targetHost: string;
  targetPath: string;
  method: string;
  status?: number;
  durationMs?: number;
  success: boolean;
  errorCode?: ApiErrorCode;
  timestamp: Date;
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private readonly config: ApiClientConfig;
  private readonly retryConfig: RetryConfig;
  private readonly circuitBreakerConfig: CircuitBreakerConfig;
  private readonly securityConfig: OutboundSecurityConfig;
  private readonly maxResponseSizeBytes: number;
  private circuitState: CircuitBreakerState;
  private readonly auditLogger: (event: OutboundAuditEvent) => void;

  constructor(
    config: ApiClientConfig,
    securityConfig?: Partial<OutboundSecurityConfig>,
    auditLogger?: (event: OutboundAuditEvent) => void
  ) {
    this.config = config;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retry };
    this.circuitBreakerConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config.circuitBreaker };
    this.securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...securityConfig };
    this.maxResponseSizeBytes = config.maxResponseSizeBytes ?? DEFAULT_MAX_RESPONSE_SIZE_BYTES;
    this.circuitState = {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailureAt: 0,
      openedAt: 0,
    };
    this.auditLogger = auditLogger ?? this.defaultAuditLogger.bind(this);

    // Validate base URL on construction
    this.validateUrl(this.config.baseUrl, 'base URL');
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Execute an HTTP request with retry, circuit breaker, and security controls
   */
  async request<T = unknown>(request: ApiClientRequest): Promise<ApiClientResponse<T>> {
    const requestId = request.requestId ?? uuidv4();
    const startTime = Date.now();
    const fullUrl = this.buildUrl(request.path, request.query);

    // Validate outbound security
    this.validateOutboundSecurity(fullUrl, requestId);

    // Check circuit breaker
    if (!this.checkCircuitBreaker(requestId)) {
      const error = this.createError('CIRCUIT_OPEN', 'Circuit breaker is open', requestId);
      this.logAudit({
        eventType: 'OUTBOUND_CIRCUIT_OPEN',
        integrationName: this.config.integrationName,
        requestId,
        targetHost: new URL(fullUrl).hostname,
        targetPath: request.path,
        method: request.method,
        success: false,
        errorCode: 'CIRCUIT_OPEN',
        timestamp: new Date(),
      });
      throw error;
    }

    const headers = this.buildHeaders(request.headers, requestId);
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs;

    let lastError: ApiClientError | undefined;
    const maxAttempts = request.skipRetry ? 1 : this.retryConfig.maxAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(
          request.method,
          fullUrl,
          headers,
          request.body,
          timeoutMs,
          requestId
        );

        const durationMs = Date.now() - startTime;
        this.recordSuccess(request, response.status, durationMs, requestId);

        return {
          ...response,
          durationMs,
          requestId,
        };
      } catch (err) {
        lastError = err as ApiClientError;
        const durationMs = Date.now() - startTime;

        // Record failure for circuit breaker
        this.recordFailure();

        // Check if we should retry
        if (attempt < maxAttempts && this.shouldRetry(lastError, attempt)) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          continue;
        }

        // Log final failure
        this.recordMetric({
          integrationName: this.config.integrationName,
          requestId,
          method: request.method,
          path: request.path,
          status: lastError.status,
          durationMs,
          success: false,
          errorCode: lastError.code,
          timestamp: new Date(),
        });

        this.logAudit({
          eventType: 'OUTBOUND_REQUEST',
          integrationName: this.config.integrationName,
          requestId,
          targetHost: new URL(fullUrl).hostname,
          targetPath: request.path,
          method: request.method,
          status: lastError.status,
          durationMs,
          success: false,
          errorCode: lastError.code,
          timestamp: new Date(),
        });

        break;
      }
    }

    // Only wrap as RETRY_EXHAUSTED if actual retries were attempted
    if (lastError && maxAttempts > 1 && lastError.code !== 'RETRY_EXHAUSTED') {
      lastError = this.createError(
        'RETRY_EXHAUSTED',
        `Request failed after ${maxAttempts} attempts: ${lastError.message}`,
        requestId,
        lastError.status,
        lastError.cause
      );
    }

    throw lastError;
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = unknown>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
    options?: Partial<ApiClientRequest>
  ): Promise<ApiClientResponse<T>> {
    return this.request<T>({
      method: 'GET',
      path,
      query,
      ...options,
    });
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: Partial<ApiClientRequest>
  ): Promise<ApiClientResponse<T>> {
    return this.request<T>({
      method: 'POST',
      path,
      body,
      ...options,
    });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: Partial<ApiClientRequest>
  ): Promise<ApiClientResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      path,
      body,
      ...options,
    });
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: Partial<ApiClientRequest>
  ): Promise<ApiClientResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      path,
      body,
      ...options,
    });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = unknown>(
    path: string,
    options?: Partial<ApiClientRequest>
  ): Promise<ApiClientResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      path,
      ...options,
    });
  }

  /**
   * Get current circuit breaker state
   */
  getCircuitState(): CircuitState {
    return this.circuitState.state;
  }

  /**
   * Manually reset circuit breaker (for testing/admin)
   */
  resetCircuitBreaker(): void {
    this.circuitState = {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailureAt: 0,
      openedAt: 0,
    };
  }

  // ============================================================================
  // Private Methods - Request Execution
  // ============================================================================

  private async executeRequest<T>(
    method: string,
    url: string,
    headers: Record<string, string>,
    body: unknown | undefined,
    timeoutMs: number,
    requestId: string
  ): Promise<{ status: number; headers: Record<string, string>; data: T }> {
    // Use AbortSignal.timeout() for cleaner timeout handling (Node 18+)
    // This properly handles both connection and body streaming timeouts
    const signal = AbortSignal.timeout(timeoutMs);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: signal as RequestInit['signal'],
      };

      if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      // Response size limit guard
      // Check Content-Length header first for efficiency (avoid streaming large responses)
      const contentLengthHeader = responseHeaders['content-length'];
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (!isNaN(contentLength) && contentLength > this.maxResponseSizeBytes) {
          throw this.createError(
            'RESPONSE_TOO_LARGE',
            `Response size ${contentLength} bytes exceeds limit of ${this.maxResponseSizeBytes} bytes`,
            requestId,
            response.status
          );
        }
      }

      // Parse response body with size limit enforcement
      let data: T;
      const contentType = responseHeaders['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        try {
          // For JSON, we need to read the text first to check size
          const text = await response.text();
          if (text.length > this.maxResponseSizeBytes) {
            throw this.createError(
              'RESPONSE_TOO_LARGE',
              `Response size ${text.length} bytes exceeds limit of ${this.maxResponseSizeBytes} bytes`,
              requestId,
              response.status
            );
          }
          data = JSON.parse(text) as T;
        } catch (e) {
          if ((e as ApiClientError).code === 'RESPONSE_TOO_LARGE') {
            throw e;
          }
          throw this.createError('PARSE_ERROR', 'Failed to parse JSON response', requestId, response.status);
        }
      } else {
        const text = await response.text();
        if (text.length > this.maxResponseSizeBytes) {
          throw this.createError(
            'RESPONSE_TOO_LARGE',
            `Response size ${text.length} bytes exceeds limit of ${this.maxResponseSizeBytes} bytes`,
            requestId,
            response.status
          );
        }
        data = text as unknown as T;
      }

      // Handle error statuses
      if (response.status >= 400) {
        const errorCode: ApiErrorCode = response.status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
        throw this.createError(
          errorCode,
          `HTTP ${response.status}: ${response.statusText}`,
          requestId,
          response.status
        );
      }

      return { status: response.status, headers: responseHeaders, data };
    } catch (err) {
      // Handle timeout errors (AbortSignal.timeout throws TimeoutError in Node 18+)
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        throw this.createError('TIMEOUT', `Request timed out after ${timeoutMs}ms`, requestId);
      }

      if ((err as ApiClientError).code) {
        throw err;
      }

      // Mask URL secrets in network error messages
      const maskedUrl = maskUrlSecrets(url);
      throw this.createError(
        'NETWORK_ERROR',
        `Network error for ${maskedUrl}: ${(err as Error).message}`,
        requestId,
        undefined,
        err as Error
      );
    }
  }

  // ============================================================================
  // Private Methods - Security
  // ============================================================================

  private validateUrl(url: string, context: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid ${context}: ${url}`);
    }
    return parsed;
  }

  private validateOutboundSecurity(url: string, requestId: string): void {
    const parsed = this.validateUrl(url, 'request URL');

    // Check TLS requirement
    if (this.securityConfig.requireTls && parsed.protocol !== 'https:') {
      this.logBlockedRequest(parsed, requestId, 'TLS required');
      throw this.createError('TLS_ERROR', 'TLS is required for outbound requests', requestId);
    }

    // Check private ranges (hostname-based)
    // Note: This validates the hostname/IP string before DNS resolution.
    // For DNS rebinding protection, use validateResolvedIP() after DNS lookup
    // to verify the resolved IP is not private. See isPrivateIP() helper.
    if (this.securityConfig.blockPrivateRanges) {
      const hostname = parsed.hostname;
      if (isPrivateIP(hostname)) {
        this.logBlockedRequest(parsed, requestId, 'Private IP blocked');
        throw this.createError('BLOCKED_HOST', `Blocked private IP range: ${hostname}`, requestId);
      }
    }

    // Check allowlist
    if (!this.securityConfig.allowAllHttps) {
      const isAllowed = this.securityConfig.allowedHosts.some((allowed) => {
        if (allowed.startsWith('*.')) {
          // Wildcard match
          const suffix = allowed.slice(1);
          return parsed.hostname.endsWith(suffix) || parsed.hostname === allowed.slice(2);
        }
        return parsed.hostname === allowed;
      });

      if (!isAllowed) {
        this.logBlockedRequest(parsed, requestId, 'Host not in allowlist');
        throw this.createError('BLOCKED_HOST', `Host not allowed: ${parsed.hostname}`, requestId);
      }
    }
  }

  private logBlockedRequest(url: URL, requestId: string, reason: string): void {
    // Mask secrets in the URL before logging
    const maskedUrl = maskUrlSecrets(url.toString());
    const maskedUrlObj = new URL(maskedUrl);
    
    this.logAudit({
      eventType: 'OUTBOUND_BLOCKED',
      integrationName: this.config.integrationName,
      requestId,
      targetHost: maskedUrlObj.hostname,
      targetPath: maskedUrlObj.pathname + (maskedUrlObj.search || ''),
      method: 'BLOCKED',
      success: false,
      errorCode: 'BLOCKED_HOST',
      timestamp: new Date(),
    });

    console.warn(
      JSON.stringify({
        level: 'warn',
        type: 'security',
        event: 'outbound_blocked',
        integrationName: this.config.integrationName,
        requestId,
        host: maskedUrlObj.hostname,
        url: maskedUrl,
        reason,
        timestamp: new Date().toISOString(),
      })
    );
  }

  // ============================================================================
  // Private Methods - Circuit Breaker
  // ============================================================================

  private checkCircuitBreaker(_requestId: string): boolean {
    const now = Date.now();

    switch (this.circuitState.state) {
      case 'closed':
        return true;

      case 'open': {
        // Check if we should transition to half-open
        const timeSinceOpen = now - this.circuitState.openedAt;
        if (timeSinceOpen >= this.circuitBreakerConfig.openDurationMs) {
          this.circuitState.state = 'half-open';
          this.circuitState.successes = 0;
          return true;
        }
        return false;
      }

      case 'half-open':
        return true;

      default:
        return true;
    }
  }

  private recordSuccess(
    request: ApiClientRequest,
    status: number,
    durationMs: number,
    requestId: string
  ): void {
    if (this.circuitState.state === 'half-open') {
      this.circuitState.successes++;
      if (this.circuitState.successes >= this.circuitBreakerConfig.successThreshold) {
        this.circuitState.state = 'closed';
        this.circuitState.failures = 0;
      }
    } else if (this.circuitState.state === 'closed') {
      // Reset failures on success in closed state
      this.circuitState.failures = 0;
    }

    // Record metric
    this.recordMetric({
      integrationName: this.config.integrationName,
      requestId,
      method: request.method,
      path: request.path,
      status,
      durationMs,
      success: true,
      timestamp: new Date(),
    });

    // Log audit
    const fullUrl = this.buildUrl(request.path, request.query);
    const parsed = new URL(fullUrl);
    this.logAudit({
      eventType: 'OUTBOUND_REQUEST',
      integrationName: this.config.integrationName,
      requestId,
      targetHost: parsed.hostname,
      targetPath: request.path,
      method: request.method,
      status,
      durationMs,
      success: true,
      timestamp: new Date(),
    });
  }

  private recordFailure(): void {
    const now = Date.now();

    // Check if we're within the failure window
    if (now - this.circuitState.lastFailureAt > this.circuitBreakerConfig.windowMs) {
      this.circuitState.failures = 0;
    }

    this.circuitState.failures++;
    this.circuitState.lastFailureAt = now;

    if (this.circuitState.state === 'half-open') {
      // Any failure in half-open returns to open
      this.circuitState.state = 'open';
      this.circuitState.openedAt = now;
    } else if (
      this.circuitState.state === 'closed' &&
      this.circuitState.failures >= this.circuitBreakerConfig.failureThreshold
    ) {
      this.circuitState.state = 'open';
      this.circuitState.openedAt = now;
    }
  }

  // ============================================================================
  // Private Methods - Retry
  // ============================================================================

  private shouldRetry(error: ApiClientError, _attempt: number): boolean {
    // Never retry certain errors
    if (['BLOCKED_HOST', 'TLS_ERROR', 'CIRCUIT_OPEN'].includes(error.code)) {
      return false;
    }

    // Retry on retryable status codes
    if (error.status && this.retryConfig.retryableStatuses.includes(error.status)) {
      return true;
    }

    // Retry on network errors and timeouts
    if (['NETWORK_ERROR', 'TIMEOUT'].includes(error.code)) {
      return true;
    }

    return false;
  }

  private calculateRetryDelay(attempt: number): number {
    if (this.retryConfig.exponentialBackoff) {
      const delay = this.retryConfig.baseDelayMs * Math.pow(2, attempt - 1);
      // Add jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      return Math.min(delay + jitter, this.retryConfig.maxDelayMs);
    }
    return this.retryConfig.baseDelayMs;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Private Methods - Utilities
  // ============================================================================

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    let baseUrl = this.config.baseUrl;
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    if (path.startsWith('/')) {
      path = path.slice(1);
    }

    const url = new URL(path, baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private buildHeaders(
    requestHeaders?: Record<string, string>,
    requestId?: string
  ): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': `YezdaApiClient/1.0 (${this.config.integrationName})`,
      'X-Request-ID': requestId ?? uuidv4(),
      ...this.config.headers,
      ...requestHeaders,
    };
  }

  private createError(
    code: ApiErrorCode,
    message: string,
    requestId: string,
    status?: number,
    cause?: Error
  ): ApiClientError {
    return {
      code,
      message,
      status,
      cause,
      requestId,
      integrationName: this.config.integrationName,
    };
  }

  // ============================================================================
  // Private Methods - Logging & Metrics
  // ============================================================================

  private recordMetric(metric: OutboundMetric): void {
    outboundMetrics.push(metric);

    // Keep only last hour of metrics
    const cutoff = Date.now() - 3600000;
    while (outboundMetrics.length > 0 && outboundMetrics[0].timestamp.getTime() < cutoff) {
      outboundMetrics.shift();
    }
  }

  private logAudit(event: OutboundAuditEvent): void {
    this.auditLogger(event);
  }

  private defaultAuditLogger(event: OutboundAuditEvent): void {
    // Structured logging without sensitive data
    console.log(
      JSON.stringify({
        level: event.success ? 'info' : 'warn',
        type: 'outbound_audit',
        eventType: event.eventType,
        integrationName: event.integrationName,
        requestId: event.requestId,
        targetHost: event.targetHost,
        targetPath: event.targetPath,
        method: event.method,
        status: event.status,
        durationMs: event.durationMs,
        success: event.success,
        errorCode: event.errorCode,
        timestamp: event.timestamp.toISOString(),
      })
    );
  }
}

// ============================================================================
// Metrics Service for Outbound Calls
// ============================================================================

export class OutboundMetricsService {
  /**
   * Get metrics for a time window
   */
  getMetrics(windowMs = 60000): OutboundMetric[] {
    const cutoff = new Date(Date.now() - windowMs);
    return outboundMetrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Get metrics for a specific integration
   */
  getIntegrationMetrics(integrationName: string, windowMs = 60000): OutboundMetric[] {
    return this.getMetrics(windowMs).filter((m) => m.integrationName === integrationName);
  }

  /**
   * Calculate success rate for an integration
   */
  getSuccessRate(integrationName: string, windowMs = 60000): number {
    const metrics = this.getIntegrationMetrics(integrationName, windowMs);
    if (metrics.length === 0) return 100;

    const successes = metrics.filter((m) => m.success).length;
    return (successes / metrics.length) * 100;
  }

  /**
   * Calculate P99 latency for an integration
   */
  getP99Latency(integrationName: string, windowMs = 60000): number {
    const metrics = this.getIntegrationMetrics(integrationName, windowMs);
    if (metrics.length === 0) return 0;

    const latencies = metrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] ?? latencies[latencies.length - 1];
  }

  /**
   * Calculate P95 latency for an integration
   */
  getP95Latency(integrationName: string, windowMs = 60000): number {
    const metrics = this.getIntegrationMetrics(integrationName, windowMs);
    if (metrics.length === 0) return 0;

    const latencies = metrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    return latencies[p95Index] ?? latencies[latencies.length - 1];
  }

  /**
   * Check if SLOs are met for an integration
   */
  checkSLOs(integrationName: string, windowMs = 60000): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    const successRate = this.getSuccessRate(integrationName, windowMs);
    if (successRate < OUTBOUND_SLOS.SUCCESS_RATE_PERCENT) {
      violations.push(
        `${integrationName} success rate ${successRate.toFixed(2)}% below SLO ${OUTBOUND_SLOS.SUCCESS_RATE_PERCENT}%`
      );
    }

    const p99Latency = this.getP99Latency(integrationName, windowMs);
    if (p99Latency > OUTBOUND_SLOS.LATENCY_P99_MS) {
      violations.push(
        `${integrationName} P99 latency ${p99Latency}ms exceeds SLO ${OUTBOUND_SLOS.LATENCY_P99_MS}ms`
      );
    }

    const p95Latency = this.getP95Latency(integrationName, windowMs);
    if (p95Latency > OUTBOUND_SLOS.LATENCY_P95_MS) {
      violations.push(
        `${integrationName} P95 latency ${p95Latency}ms exceeds SLO ${OUTBOUND_SLOS.LATENCY_P95_MS}ms`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get all integrations with recent activity
   */
  getActiveIntegrations(windowMs = 60000): string[] {
    const metrics = this.getMetrics(windowMs);
    return [...new Set(metrics.map((m) => m.integrationName))];
  }

  /**
   * Clear old metrics
   */
  cleanup(retentionMs = 3600000): void {
    const cutoff = new Date(Date.now() - retentionMs);
    const countBefore = outboundMetrics.length;
    while (outboundMetrics.length > 0 && outboundMetrics[0].timestamp < cutoff) {
      outboundMetrics.shift();
    }
    console.log(`Cleaned up ${countBefore - outboundMetrics.length} old outbound metrics`);
  }
}

// ============================================================================
// Factory and Singleton Instances
// ============================================================================

export const outboundMetricsService = new OutboundMetricsService();

/**
 * Create a configured API client for an integration
 */
export function createApiClient(
  config: ApiClientConfig,
  securityConfig?: Partial<OutboundSecurityConfig>,
  auditLogger?: (event: OutboundAuditEvent) => void
): ApiClient {
  return new ApiClient(config, securityConfig, auditLogger);
}

/**
 * Secret handling utility - mask sensitive headers for logging
 */
export function maskSecrets(headers: Record<string, string>): Record<string, string> {
  const sensitiveKeys = ['authorization', 'x-api-key', 'api-key', 'bearer', 'token', 'secret'];
  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      masked[key] = value.length > 8 ? `${value.slice(0, 4)}****${value.slice(-4)}` : '****';
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
