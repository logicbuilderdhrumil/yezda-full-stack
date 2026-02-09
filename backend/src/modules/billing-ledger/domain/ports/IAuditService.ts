/**
 * Audit Service Port for Billing Ledger
 */
export interface IAuditService {
  log(entry: {
    eventType: string;
    actorId?: string;
    actorType?: string;
    targetId?: string;
    targetType?: string;
    channel?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
    success: boolean;
    errorMessage?: string;
  }): void;
  logAnomaly?(params: {
    description: string;
    channel?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }): void;
}
