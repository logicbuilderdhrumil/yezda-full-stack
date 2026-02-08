export interface IMetricsService {
  recordOAuthOperation(operation: string, provider: string, success: boolean, durationMs?: number): void;
}
