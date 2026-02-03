/**
 * Socket Metrics Service
 * Task 1.7: Define socket service SLOs and add metrics/alerts
 */

import type { Metric } from './metrics.service.js';
import { SOCKET_METRICS, SOCKET_SLOS } from '../models/socket.model.js';

// In-memory metrics store for socket-specific metrics
const socketMetrics: Metric[] = [];

// Track active connections for gauge metric
let activeConnections = 0;

export class SocketMetricsService {
  /**
   * Record a counter metric
   */
  private incrementCounter(name: string, labels: Record<string, string> = {}): void {
    socketMetrics.push({
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
  private recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    socketMetrics.push({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Record successful socket connection
   */
  recordConnectionSuccess(): void {
    this.incrementCounter(SOCKET_METRICS.CONNECTION_SUCCESS);
    activeConnections += 1;
    this.recordGauge(SOCKET_METRICS.ACTIVE_CONNECTIONS, activeConnections);
  }

  /**
   * Record failed socket connection
   */
  recordConnectionFailure(reason: string): void {
    this.incrementCounter(SOCKET_METRICS.CONNECTION_FAILURE, { reason });
    this.incrementCounter(SOCKET_METRICS.AUTH_FAILURE);
  }

  /**
   * Record connection latency
   */
  recordConnectionLatency(durationMs: number): void {
    this.recordHistogram('socket_connection_latency_ms', durationMs);
  }

  /**
   * Record socket disconnection
   */
  recordDisconnection(reason: string): void {
    this.incrementCounter(SOCKET_METRICS.CONNECTION_CLOSED, { reason });
    activeConnections = Math.max(0, activeConnections - 1);
    this.recordGauge(SOCKET_METRICS.ACTIVE_CONNECTIONS, activeConnections);
  }

  /**
   * Record message sent
   */
  recordMessageSent(event: string): void {
    this.incrementCounter(SOCKET_METRICS.MESSAGE_SENT, { event });
  }

  /**
   * Record message received
   */
  recordMessageReceived(event: string): void {
    this.incrementCounter(SOCKET_METRICS.MESSAGE_RECEIVED, { event });
  }

  /**
   * Record rate limit hit
   */
  recordRateLimited(category: string): void {
    this.incrementCounter(SOCKET_METRICS.RATE_LIMITED, { category });
  }

  /**
   * Record presence update
   */
  recordPresenceUpdate(status: string): void {
    this.incrementCounter(SOCKET_METRICS.PRESENCE_UPDATE, { status });
  }

  /**
   * Record a gauge metric
   */
  private recordGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    // Remove old gauge with same name
    const idx = socketMetrics.findIndex(
      (m) => m.name === name && m.type === 'gauge'
    );
    if (idx >= 0) {
      socketMetrics.splice(idx, 1);
    }
    socketMetrics.push({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Get metrics for a time window
   */
  getMetrics(windowMs = 60000): Metric[] {
    const cutoff = new Date(Date.now() - windowMs);
    return socketMetrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Get connection success rate
   */
  getConnectionSuccessRate(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const successes = recentMetrics.filter(
      (m) => m.name === SOCKET_METRICS.CONNECTION_SUCCESS
    ).length;
    const failures = recentMetrics.filter(
      (m) => m.name === SOCKET_METRICS.CONNECTION_FAILURE
    ).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  /**
   * Get connection P99 latency
   */
  getConnectionP99Latency(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    const latencies = recentMetrics
      .filter((m) => m.name === 'socket_connection_latency_ms')
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (latencies.length === 0) return 0;

    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  /**
   * Get auth failure count
   */
  getAuthFailureCount(windowMs = 60000): number {
    const recentMetrics = this.getMetrics(windowMs);
    return recentMetrics.filter(
      (m) => m.name === SOCKET_METRICS.AUTH_FAILURE
    ).length;
  }

  /**
   * Get active connection count (gauge)
   */
  getActiveConnections(): number {
    return activeConnections;
  }

  /**
   * Check if socket SLOs are met
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check connection success rate
    const successRate = this.getConnectionSuccessRate();
    if (successRate < SOCKET_SLOS.CONNECTION_SUCCESS_RATE) {
      violations.push(
        `Socket connection success rate ${successRate.toFixed(2)}% below SLO ${SOCKET_SLOS.CONNECTION_SUCCESS_RATE}%`
      );
    }

    // Check connection latency P99
    const p99Latency = this.getConnectionP99Latency();
    if (p99Latency > SOCKET_SLOS.CONNECTION_LATENCY_P99_MS) {
      violations.push(
        `Socket connection P99 latency ${p99Latency}ms exceeds SLO ${SOCKET_SLOS.CONNECTION_LATENCY_P99_MS}ms`
      );
    }

    // Check auth failures
    const authFailures = this.getAuthFailureCount();
    if (authFailures > SOCKET_SLOS.MAX_AUTH_FAILURES_PER_MINUTE) {
      violations.push(
        `Socket auth failures ${authFailures}/min exceeds SLO ${SOCKET_SLOS.MAX_AUTH_FAILURES_PER_MINUTE}/min`
      );
    }

    return {
      met: violations.length === 0,
      violations,
    };
  }

  /**
   * Get SLO status summary
   */
  getSLOStatus(): {
    connectionSuccessRate: number;
    connectionP99LatencyMs: number;
    authFailuresPerMinute: number;
    activeConnections: number;
    slosViolated: string[];
  } {
    const sloCheck = this.checkSLOs();
    return {
      connectionSuccessRate: this.getConnectionSuccessRate(),
      connectionP99LatencyMs: this.getConnectionP99Latency(),
      authFailuresPerMinute: this.getAuthFailureCount(),
      activeConnections: this.getActiveConnections(),
      slosViolated: sloCheck.violations,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];
    const gauges = new Map<string, number>();
    const counters = new Map<string, number>();

    for (const metric of socketMetrics) {
      const labelStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      const key = labelStr ? `${metric.name}{${labelStr}}` : metric.name;

      if (metric.type === 'gauge') {
        gauges.set(key, metric.value);
      } else if (metric.type === 'counter') {
        counters.set(key, (counters.get(key) || 0) + 1);
      }
    }

    for (const [key, value] of gauges) {
      lines.push(`${key} ${value}`);
    }

    for (const [key, value] of counters) {
      lines.push(`${key} ${value}`);
    }

    return lines.join('\n');
  }

  /**
   * Clean up old metrics
   */
  cleanup(retentionMs = 3600000): void {
    const cutoff = new Date(Date.now() - retentionMs);
    const count = socketMetrics.length;
    const newMetrics = socketMetrics.filter((m) => m.timestamp > cutoff);
    socketMetrics.length = 0;
    socketMetrics.push(...newMetrics);
    console.log(`[SocketMetrics] Cleaned up ${count - socketMetrics.length} old metrics`);
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    socketMetrics.length = 0;
    activeConnections = 0;
  }
}

export const socketMetricsService = new SocketMetricsService();
