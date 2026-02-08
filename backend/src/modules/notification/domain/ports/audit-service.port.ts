/**
 * Audit Service Port — notification module
 */
export interface IAuditService {
  log(event: {
    eventType: string;
    actorId: string;
    actorType: string;
    targetId?: string;
    targetType?: string;
    channel?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }): void;
}
