/**
 * Metrics Service Port
 * Domain interface for metrics collection (implemented by legacy metricsService).
 */

export interface IMetricsService {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordLatency(name: string, durationMs: number, labels?: Record<string, string>): void;
}
