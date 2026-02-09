/**
 * Metrics Service Port — notification module
 */
export interface IMetricsService {
  incrementCounter(metric: string, labels?: Record<string, string>): void;
  recordLatency(metric: string, durationMs: number, labels?: Record<string, string>): void;
}
