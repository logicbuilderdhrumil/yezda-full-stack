/**
 * Metrics Service Port (Chat)
 */
export interface IMetricsService {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordLatency(name: string, durationMs: number, labels?: Record<string, string>): void;
  getMetrics(windowMs?: number): Array<{ name: string; value: number }>;
}
