/**
 * Metrics Service Port (Form Builder)
 */
export interface IMetricsService {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordLatency(name: string, durationMs: number, labels?: Record<string, string>): void;
  recordRedisError(context: string): void;
}
