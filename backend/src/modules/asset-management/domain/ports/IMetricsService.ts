/**
 * Asset Management Domain Port — Metrics Service Interface
 */
export interface IMetricsService {
  recordLatency(operation: string, durationMs: number, labels?: Record<string, string>): void;
  incrementCounter(metric: string, labels?: Record<string, string>): void;
}
