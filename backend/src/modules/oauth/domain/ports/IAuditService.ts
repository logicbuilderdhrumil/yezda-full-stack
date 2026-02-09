export interface IAuditService {
  log(entry: {
    eventType: string;
    actorId?: string;
    actorType?: string;
    targetId?: string;
    targetType?: string;
    channel?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
  }): void;
}
