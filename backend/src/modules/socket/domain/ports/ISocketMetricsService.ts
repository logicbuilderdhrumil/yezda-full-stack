/**
 * Socket metrics service port
 */
export interface ISocketMetricsService {
  recordConnectionSuccess(): void;
  recordConnectionFailure(reason: string): void;
  recordConnectionLatency(durationMs: number): void;
  recordDisconnection(reason: string): void;
  recordMessageSent(event: string): void;
  recordMessageReceived(event: string): void;
  recordRateLimited(category: string): void;
  recordPresenceUpdate(status: string): void;
  getActiveConnections(): number;
  getSLOStatus(): {
    connectionSuccessRate: number;
    connectionP99LatencyMs: number;
    authFailuresPerMinute: number;
    activeConnections: number;
    slosViolated: string[];
  };
}
