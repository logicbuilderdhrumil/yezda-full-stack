/**
 * SocketMetricsService — in-process metrics for socket SLOs
 * Implements ISocketMetricsService
 */
import type { ISocketMetricsService } from '../../domain/ports/ISocketMetricsService.js';
import { SOCKET_METRICS, SOCKET_SLOS } from '../../domain/entities/index.js';

interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

const socketMetrics: Metric[] = [];
let activeConnections = 0;

export class SocketMetricsService implements ISocketMetricsService {
  private incrementCounter(name: string, labels: Record<string, string> = {}): void {
    socketMetrics.push({ name, type: 'counter', value: 1, labels, timestamp: new Date() });
  }

  private recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    socketMetrics.push({ name, type: 'histogram', value, labels, timestamp: new Date() });
  }

  private recordGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const idx = socketMetrics.findIndex((m) => m.name === name && m.type === 'gauge');
    if (idx >= 0) socketMetrics.splice(idx, 1);
    socketMetrics.push({ name, type: 'gauge', value, labels, timestamp: new Date() });
  }

  recordConnectionSuccess(): void {
    this.incrementCounter(SOCKET_METRICS.CONNECTION_SUCCESS);
    activeConnections += 1;
    this.recordGauge(SOCKET_METRICS.ACTIVE_CONNECTIONS, activeConnections);
  }

  recordConnectionFailure(reason: string): void {
    this.incrementCounter(SOCKET_METRICS.CONNECTION_FAILURE, { reason });
    this.incrementCounter(SOCKET_METRICS.AUTH_FAILURE);
  }

  recordConnectionLatency(durationMs: number): void {
    this.recordHistogram('socket_connection_latency_ms', durationMs);
  }

  recordDisconnection(reason: string): void {
    this.incrementCounter(SOCKET_METRICS.CONNECTION_CLOSED, { reason });
    activeConnections = Math.max(0, activeConnections - 1);
    this.recordGauge(SOCKET_METRICS.ACTIVE_CONNECTIONS, activeConnections);
  }

  recordMessageSent(event: string): void {
    this.incrementCounter(SOCKET_METRICS.MESSAGE_SENT, { event });
  }

  recordMessageReceived(event: string): void {
    this.incrementCounter(SOCKET_METRICS.MESSAGE_RECEIVED, { event });
  }

  recordRateLimited(category: string): void {
    this.incrementCounter(SOCKET_METRICS.RATE_LIMITED, { category });
  }

  recordPresenceUpdate(status: string): void {
    this.incrementCounter(SOCKET_METRICS.PRESENCE_UPDATE, { status });
  }

  getActiveConnections(): number {
    return activeConnections;
  }

  private getMetrics(windowMs = 60000): Metric[] {
    const cutoff = new Date(Date.now() - windowMs);
    return socketMetrics.filter((m) => m.timestamp > cutoff);
  }

  private getConnectionSuccessRate(windowMs = 60000): number {
    const recent = this.getMetrics(windowMs);
    const successes = recent.filter((m) => m.name === SOCKET_METRICS.CONNECTION_SUCCESS).length;
    const failures = recent.filter((m) => m.name === SOCKET_METRICS.CONNECTION_FAILURE).length;
    const total = successes + failures;
    return total > 0 ? (successes / total) * 100 : 100;
  }

  private getConnectionP99Latency(windowMs = 60000): number {
    const recent = this.getMetrics(windowMs);
    const latencies = recent
      .filter((m) => m.name === 'socket_connection_latency_ms')
      .map((m) => m.value)
      .sort((a, b) => a - b);
    if (latencies.length === 0) return 0;
    const p99Index = Math.floor(latencies.length * 0.99);
    return latencies[p99Index] || latencies[latencies.length - 1];
  }

  private getAuthFailureCount(windowMs = 60000): number {
    return this.getMetrics(windowMs).filter((m) => m.name === SOCKET_METRICS.AUTH_FAILURE).length;
  }

  getSLOStatus(): {
    connectionSuccessRate: number;
    connectionP99LatencyMs: number;
    authFailuresPerMinute: number;
    activeConnections: number;
    slosViolated: string[];
  } {
    const violations: string[] = [];
    const successRate = this.getConnectionSuccessRate();
    const p99Latency = this.getConnectionP99Latency();
    const authFailures = this.getAuthFailureCount();

    if (successRate < SOCKET_SLOS.CONNECTION_SUCCESS_RATE) {
      violations.push(`Connection success rate ${successRate.toFixed(2)}% below SLO ${SOCKET_SLOS.CONNECTION_SUCCESS_RATE}%`);
    }
    if (p99Latency > SOCKET_SLOS.CONNECTION_LATENCY_P99_MS) {
      violations.push(`Connection P99 latency ${p99Latency}ms exceeds SLO ${SOCKET_SLOS.CONNECTION_LATENCY_P99_MS}ms`);
    }
    if (authFailures > SOCKET_SLOS.MAX_AUTH_FAILURES_PER_MINUTE) {
      violations.push(`Auth failures ${authFailures}/min exceeds SLO ${SOCKET_SLOS.MAX_AUTH_FAILURES_PER_MINUTE}/min`);
    }

    return {
      connectionSuccessRate: successRate,
      connectionP99LatencyMs: p99Latency,
      authFailuresPerMinute: authFailures,
      activeConnections: this.getActiveConnections(),
      slosViolated: violations,
    };
  }

  cleanup(retentionMs = 3600000): void {
    const cutoff = new Date(Date.now() - retentionMs);
    const filtered = socketMetrics.filter((m) => m.timestamp > cutoff);
    socketMetrics.length = 0;
    socketMetrics.push(...filtered);
  }

  reset(): void {
    socketMetrics.length = 0;
    activeConnections = 0;
  }
}
